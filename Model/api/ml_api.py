from fastapi import FastAPI
import pandas as pd
from src.inference.recommendation_engine import recommend_properties

app = FastAPI()

properties = pd.read_csv("data/processed/properties_processed.csv")

@app.post("/recommend")
def recommend(user: dict):
    user_data = [
        user['age'],
        user['income'],
        user['investment_amount'],
        user['investment_duration']
    ]
    result = recommend_properties(user_data, properties)
    return {"recommended_properties": result}
