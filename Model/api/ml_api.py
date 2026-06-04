import sys
import os
from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel

# -----------------------
# Fix import path
# -----------------------

ROOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


# -----------------------
# Imports
# -----------------------
from src.inference.predict_risk_once import predict_and_store_user_risk


# -----------------------
# App
# -----------------------

app = FastAPI(
    title="Ownexa Model Service",
    version="1.0.0"
)


# -----------------------
# Load CSV
# -----------------------

csv_path = os.path.join(
    ROOT_DIR,
    "data",
    "processed",
    "properties_processed.csv"
)

properties = pd.read_csv(csv_path)


# -----------------------
# Input Schema
# -----------------------

class UserInput(BaseModel):
    id: str
    age: int
    income: float
    investment_amount: float
    investment_duration: int


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "ownexa-model"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ownexa-model"
    }


# -----------------------
# API Route
# -----------------------

@app.put("/recommend")
def recommend(user: UserInput):

    # -----------------------
    # 1. Store Risk Profile
    # -----------------------

    user_data_for_risk = {
        "age": int(user.age),
        "income": float(user.income),
        "investment_amount": float(user.investment_amount),
        "investment_duration": int(user.investment_duration)
    }

    risk_result = predict_and_store_user_risk(
        user.id,
        user_data_for_risk
    )

    # -----------------------
    # 2. Get Recommendations
    # -----------------------


    # -----------------------
    # 3. Response
    # -----------------------

    return {
        "risk_profile": risk_result.get("risk_label"),
    }
