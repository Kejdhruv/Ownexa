# Ownexa Model Service

This module contains the machine learning and model-serving layer for Ownexa. It handles investor risk profiling, property return prediction, property risk scoring, and a small FastAPI service that currently updates a user's stored risk label in Supabase during signup.

In the current codebase, this module is both:

- a training/evaluation workspace for scikit-learn models
- a lightweight inference API consumed by the backend

## What This Module Does

The `Model/` folder supports three main ML tasks:

1. classify a user's investment risk profile
2. estimate property return potential
3. estimate property risk score

Only the first one is actively wired into the running application flow right now.

### What Is Live Today

The backend signup route calls:

```text
PUT http://127.0.0.1:8000/recommend
```

That API:

- accepts user investment profile data
- predicts the user's `risk_label`
- writes that `risk_label` back into the Supabase `users` table
- returns the predicted risk label in the response

### What Exists But Is Not Fully Wired End-To-End

- property recommendation logic
- return prediction inference
- property risk score model inference in the app flow

Those pieces exist in the repository, but the FastAPI route currently does not return ranked property recommendations to the frontend.

## Folder Structure

```text
Model/
├── api/
│   ├── __init__.py
│   └── ml_api.py
├── data/
│   ├── raw/
│   │   ├── properties.csv
│   │   ├── transactions.csv
│   │   └── users.csv
│   └── processed/
│       ├── properties_processed.csv
│       └── users_processed.csv
├── Database/
│   ├── __init__.py
│   └── supabase_client.py
├── models/
│   ├── property_risk_model.pkl
│   ├── return_prediction_model.pkl
│   └── risk_profile_model.pkl
├── src/
│   ├── __init__.py
│   ├── inference/
│   ├── preprocessing/
│   └── training/
├── test/
│   └── test_model_accuracy.py
├── requirements.txt
└── test_models.py
```

## High-Level Architecture

```text
Raw CSV Data
    |
    v
Preprocessing Scripts
    |
    v
Processed CSV Data
    |
    v
Training Scripts
    |
    v
.pkl Model Artifacts
    |
    v
Inference Helpers + FastAPI
    |
    v
Backend Signup Flow / Supabase User Update
```

## Components

### 1. Preprocessing

Preprocessing lives in [`src/preprocessing/preprocess_all.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/preprocessing/preprocess_all.py).

It performs two dataset transformations:

#### User Dataset Processing

Input file:

- `data/raw/users.csv`

Generated output:

- `data/processed/users_processed.csv`

Transformation logic:

- reads `risk_appetite`
- maps it to a numeric `risk_label`

Current mapping:

- `low -> 0`
- `medium -> 1`
- everything else -> `2`

This means the current logic assumes all non-`low` and non-`medium` values should be treated as `high`.

#### Property Dataset Processing

Input file:

- `data/raw/properties.csv`

Generated output:

- `data/processed/properties_processed.csv`

Derived columns:

- `expected_return = rental_yield + price_growth`
- `risk_score = 100 - occupancy_rate`

This is currently a rule-based derived target creation step rather than a more advanced feature engineering pipeline.

### 2. Training

Training scripts live in `src/training/`.

#### `train_risk_profile.py`

File:

- [`src/training/train_risk_profile.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/training/train_risk_profile.py)

Purpose:

- trains the user risk classifier

Model:

- `RandomForestClassifier(n_estimators=200, random_state=42)`

Features:

- `age`
- `income`
- `investment_amount`
- `investment_duration`

Target:

- `risk_label`

Input dataset:

- `data/processed/users_processed.csv`

Saved artifact:

- `models/risk_profile_model.pkl`

Notes:

- uses an 80/20 train-test split
- script saves the model but does not print evaluation metrics by itself

#### `train_return_model.py`

File:

- [`src/training/train_return_model.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/training/train_return_model.py)

Purpose:

- trains the property return prediction model

Model:

- `GradientBoostingRegressor(n_estimators=300)`

Features:

- `price`
- `rental_yield`
- `price_growth`
- `occupancy_rate`

Target:

- `expected_return`

Input dataset:

- `data/processed/properties_processed.csv`

Saved artifact:

- `models/return_prediction_model.pkl`

#### `train_property_risk.py`

File:

- [`src/training/train_property_risk.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/training/train_property_risk.py)

Purpose:

- trains the property risk estimation model

Model:

- `RandomForestRegressor(n_estimators=250)`

Features:

- `price`
- `occupancy_rate`
- `price_growth`

Target:

- `risk_score`

Input dataset:

- `data/processed/properties_processed.csv`

Saved artifact:

- `models/property_risk_model.pkl`

### 3. Inference

Inference helpers live in `src/inference/`.

#### `risk_profile_infer.py`

File:

- [`src/inference/risk_profile_infer.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/inference/risk_profile_infer.py)

Behavior:

- loads `models/risk_profile_model.pkl`
- predicts a class index
- maps it to a human-readable label:
  - `0 -> Low`
  - `1 -> Medium`
  - `2 -> High`

Expected input order:

- `age`
- `income`
- `investment_amount`
- `investment_duration`

#### `return_predict_infer.py`

File:

- [`src/inference/return_predict_infer.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/inference/return_predict_infer.py)

Behavior:

- loads `models/return_prediction_model.pkl`
- predicts a numeric expected return

Expected input order:

- `price`
- `rental_yield`
- `price_growth`
- `occupancy_rate`

#### `predict_risk_once.py`

File:

- [`src/inference/predict_risk_once.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/inference/predict_risk_once.py)

Behavior:

- loads `risk_profile_model.pkl`
- converts a single user input dict into a pandas DataFrame
- reorders columns to match `risk_model.feature_names_in_`
- predicts the numeric risk label
- updates the Supabase `users` table for the given `user_id`
- returns the updated row payload

This is the most important inference file for the live app because the API calls into it directly.

#### `reccomendation_engine.py`

File:

- [`src/inference/reccomendation_engine.py`](/Users/dhruv/Blockchain/Ownexa/Model/src/inference/reccomendation_engine.py)

Purpose:

- combines user risk and predicted property returns
- filters properties by acceptable risk threshold
- sorts by expected return
- returns top 5 recommendations

Current logic:

- `Low` risk users only see properties with `risk_score < 30`
- `Medium` risk users only see properties with `risk_score < 60`
- `High` risk users can see all properties

Important note:

This engine exists, but the FastAPI layer currently does not expose full recommendation results to the client.

## FastAPI Service

The service entry point is [`api/ml_api.py`](/Users/dhruv/Blockchain/Ownexa/Model/api/ml_api.py).

### Current API Behavior

On startup it:

- adjusts the Python import path so local modules can be imported
- loads `data/processed/properties_processed.csv`
- initializes a FastAPI app

It currently exposes:

- `PUT /recommend`

### Request Schema

The request model is:

```json
{
  "id": "user-uuid",
  "age": 24,
  "income": 600000,
  "investment_amount": 100000,
  "investment_duration": 12
}
```

### Current Response Shape

```json
{
  "risk_profile": 1
}
```

Important detail:

Although the response field is named `risk_profile`, the current implementation returns the numeric `risk_label`, not the string values `Low`, `Medium`, or `High`.

### Internal Flow Of `PUT /recommend`

1. parse the payload into `UserInput`
2. build a `user_data_for_risk` dictionary
3. call `predict_and_store_user_risk(user.id, user_data_for_risk)`
4. write the inferred label back into Supabase
5. return the resulting label

### Current Limitation

The API loads the processed property CSV on startup, but it does not currently use that data inside the endpoint response. That suggests the code was intended to expand into recommendation delivery but has not completed that integration yet.

## Supabase Integration

Supabase connectivity is configured in [`Database/supabase_client.py`](/Users/dhruv/Blockchain/Ownexa/Model/Database/supabase_client.py).

Environment variables required:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Behavior:

- loads `.env`
- creates a Supabase client
- exports it as `supabaseAuth`

### What The Model Service Writes

The live write path updates the `users` table:

- matches row by `id`
- writes the input investment profile fields
- writes `risk_label`

That means the ML service acts as a persistence-updater, not just a prediction endpoint.

## Data Files

### Raw Data

- `data/raw/users.csv`
- `data/raw/properties.csv`
- `data/raw/transactions.csv`

### Processed Data

- `data/processed/users_processed.csv`
- `data/processed/properties_processed.csv`

### Model Artifacts

- `models/risk_profile_model.pkl`
- `models/return_prediction_model.pkl`
- `models/property_risk_model.pkl`

## Installation

Install dependencies with:

```bash
cd Model
python3 -m pip install -r requirements.txt
```

## Run The API

Start the FastAPI server with:

```bash
cd Model
python3 -m uvicorn api.ml_api:app --reload --host 127.0.0.1 --port 8000
```

Local endpoint:

```text
http://127.0.0.1:8000/recommend
```

## Training Workflow

Recommended order:

### 1. Preprocess Data

```bash
cd Model
python3 src/preprocessing/preprocess_all.py
```

### 2. Train Risk Profile Model

```bash
cd Model
python3 src/training/train_risk_profile.py
```

### 3. Train Return Prediction Model

```bash
cd Model
python3 src/training/train_return_model.py
```

### 4. Train Property Risk Model

```bash
cd Model
python3 src/training/train_property_risk.py
```

## Evaluation

Evaluation script:

- [`test/test_model_accuracy.py`](/Users/dhruv/Blockchain/Ownexa/Model/test/test_model_accuracy.py)

Run it with:

```bash
cd Model
python3 test/test_model_accuracy.py
```

It prints:

- classification accuracy for user risk profiling
- confusion matrix
- classification report
- MAE and R2 for return prediction
- MAE and R2 for property risk estimation

## Expected Feature Schemas

### Risk Model Feature Schema

Expected fields:

```text
age
income
investment_amount
investment_duration
```

### Return Model Feature Schema

Expected fields:

```text
price
rental_yield
price_growth
occupancy_rate
```

### Property Risk Model Feature Schema

Expected fields:

```text
price
occupancy_rate
price_growth
```

## Example Usage

### Curl Example

```bash
curl -X PUT http://127.0.0.1:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "id": "USER_UUID",
    "age": 24,
    "income": 600000,
    "investment_amount": 100000,
    "investment_duration": 12
  }'
```

### Expected Output

```json
{
  "risk_profile": 1
}
```

## File-By-File Purpose

- `api/ml_api.py`: FastAPI app and request handler
- `Database/supabase_client.py`: Supabase connection setup
- `src/preprocessing/preprocess_all.py`: CSV preprocessing
- `src/training/train_risk_profile.py`: risk classifier training
- `src/training/train_return_model.py`: return regressor training
- `src/training/train_property_risk.py`: risk regressor training
- `src/inference/risk_profile_infer.py`: label inference helper
- `src/inference/return_predict_infer.py`: return inference helper
- `src/inference/predict_risk_once.py`: live risk inference + DB update
- `src/inference/reccomendation_engine.py`: recommendation ranking logic
- `test/test_model_accuracy.py`: evaluation metrics

## Known Issues And Gaps

These are important to know before extending the model service:

- `requirements.txt` currently lists `pandas`, `numpy`, `scikit-learn`, `joblib`, `fastapi`, and `uvicorn`, but `Database/supabase_client.py` also imports `python-dotenv` and `supabase`, so those dependencies should also be installed or added to `requirements.txt`.
- The endpoint name `/recommend` suggests recommendation output, but the current API only returns a stored risk label.
- `ml_api.py` loads processed property data on startup but does not currently use it in the endpoint response.
- `test_models.py` appears outdated or incorrect for the current `predict_and_store_user_risk` function signature, because the live function expects `(user_id, user_input)` but the script calls it with a single argument.
- The file name `reccomendation_engine.py` contains a spelling typo in `recommendation`.
- Label casing and semantics should be documented consistently across the backend and frontend if the system eventually exposes user-facing risk categories.

## Suggested Improvements

- add missing Python dependencies to `requirements.txt`
- add `.env.example` for the model service
- expose full recommendation results from the API
- add a health check route such as `GET /health`
- add proper unit tests for preprocessing and inference
- standardize naming and spelling for recommendation-related files
- version the models and datasets explicitly
- log model metadata at startup for easier debugging

## Quick Start

1. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `Model/.env`.
2. Install Python dependencies.
3. Ensure `models/*.pkl` files and processed CSVs exist.
4. Start the FastAPI server on port `8000`.
5. Start the backend so signup can call `/recommend`.
