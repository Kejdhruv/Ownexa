import joblib
import numpy as np

model = joblib.load("models/risk_profile_model.pkl")

def predict_risk(user_data):
    X = np.array([user_data])
    risk = model.predict(X)[0]
    return ["Low","Medium","High"][risk]
