import joblib
import pandas as pd

# Load trained model
risk_model = joblib.load("models/risk_profile_model.pkl")

def predict_and_store_user_risk(user_input: dict):
    """
    user_input comes from signup form (backend)
    """
    df = pd.DataFrame([user_input])
    df = df[risk_model.feature_names_in_]
    risk_label = int(risk_model.predict(df)[0])

    # replace with actual DB insert
    user_record = user_input.copy()
    user_record["risk_label"] = risk_label

    return user_record

