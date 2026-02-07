import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.metrics import mean_absolute_error, r2_score

users = pd.read_csv("data/processed/users_processed.csv")
X_users = users[['age','income','investment_amount','investment_duration']]
y_users = users['risk_label']


risk_model = joblib.load("models/risk_profile_model.pkl")


y_pred = risk_model.predict(X_users)





print("==== USER RISK PROFILING MODEL ====")
print("Accuracy:", accuracy_score(y_users, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y_users, y_pred))
print("Classification Report:\n", classification_report(y_users, y_pred))

props = pd.read_csv("data/processed/properties_processed.csv")
X_return = props[['price','rental_yield','price_growth','occupancy_rate']]
y_return = props['expected_return']

return_model = joblib.load("models/return_prediction_model.pkl")
y_return_pred = return_model.predict(X_return)

print("\n==== PROPERTY RETURN PREDICTION MODEL ====")
print("MAE:", mean_absolute_error(y_return, y_return_pred))
print("R2 Score:", r2_score(y_return, y_return_pred))

X_risk = props[['price','occupancy_rate','price_growth']]
y_risk = props['risk_score']

property_risk_model = joblib.load("models/property_risk_model.pkl")
y_risk_pred = property_risk_model.predict(X_risk)

print("\n==== PROPERTY RISK SCORE MODEL ====")
print("MAE:", mean_absolute_error(y_risk, y_risk_pred))
print("R2 Score:", r2_score(y_risk, y_risk_pred))
