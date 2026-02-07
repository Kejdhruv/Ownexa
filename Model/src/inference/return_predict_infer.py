import joblib
import numpy as np

model = joblib.load("models/return_prediction_model.pkl")

def predict_return(property_data):
    X = np.array([property_data])
    return float(model.predict(X)[0])
