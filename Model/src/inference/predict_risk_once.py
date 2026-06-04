import sys
import os

# -----------------------
# Fix project path
# -----------------------

ROOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


# -----------------------
# Imports
# -----------------------

import joblib
import pandas as pd
from Database.supabase_client import supabaseAuth


# -----------------------
# Load Model
# -----------------------

MODEL_PATH = os.path.join(ROOT_DIR, "models", "risk_profile_model.pkl")
risk_model = joblib.load(MODEL_PATH)


# -----------------------
# Main Function
# -----------------------

def predict_and_store_user_risk(user_id: str, user_input: dict):

    df = pd.DataFrame([user_input])

    df = df[risk_model.feature_names_in_]

    risk_label = int(risk_model.predict(df)[0])

    update_data = {
        **user_input,
        "risk_label": risk_label
    }

    response = (
        supabaseAuth
        .table("users")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if response.data is None:
        raise Exception("Failed to update user risk profile")

    return response.data[0]
