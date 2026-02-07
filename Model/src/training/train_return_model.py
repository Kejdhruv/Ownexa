import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
import joblib

df = pd.read_csv("data/processed/properties_processed.csv")

X = df[['price','rental_yield','price_growth','occupancy_rate']]
y = df['expected_return']

model = GradientBoostingRegressor(n_estimators=300)
model.fit(X, y)

joblib.dump(model, "models/return_prediction_model.pkl")
print("Return Prediction Model Saved")
