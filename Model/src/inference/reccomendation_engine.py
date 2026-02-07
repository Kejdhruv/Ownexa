from risk_profile_infer import predict_risk
from return_predict_infer import predict_return
import pandas as pd

def recommend_properties(user, properties_df):
    user_risk = predict_risk(user)

    recommendations = []

    for _, row in properties_df.iterrows():
        expected_return = predict_return([
            row['price'],
            row['rental_yield'],
            row['price_growth'],
            row['occupancy_rate']
        ])

        if user_risk == "Low" and row['risk_score'] < 30:
            recommendations.append((row['property_id'], expected_return))

        elif user_risk == "Medium" and row['risk_score'] < 60:
            recommendations.append((row['property_id'], expected_return))

        elif user_risk == "High":
            recommendations.append((row['property_id'], expected_return))

    recommendations.sort(key=lambda x: x[1], reverse=True)
    return recommendations[:5]
