import joblib
import pandas as pd

risk_model = joblib.load("models/risk_profile_model.pkl")
return_model = joblib.load("models/return_prediction_model.pkl")


test_user = [[25, 900000, 100000, 5]]
print("Predicted Risk:", risk_model.predict(test_user))


props = pd.read_csv("data/processed/properties_processed.csv")
sample = props.iloc[0][['price','rental_yield','price_growth','occupancy_rate']]
print("Predicted Return:", return_model.predict([sample]))
