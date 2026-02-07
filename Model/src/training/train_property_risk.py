import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

df = pd.read_csv("data/processed/properties_processed.csv")

X = df[['price','occupancy_rate','price_growth']]
y = df['risk_score']

model = RandomForestRegressor(n_estimators=250)
model.fit(X, y)

joblib.dump(model, "models/property_risk_model.pkl")
print("Property Risk Model Saved")
