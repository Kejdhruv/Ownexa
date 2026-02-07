import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

df = pd.read_csv("data/processed/users_processed.csv")

X = df[['age','income','investment_amount','investment_duration']]
y = df['risk_label']  # 0=Low, 1=Medium, 2=High

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

joblib.dump(model, "models/risk_profile_model.pkl")
print("Risk Profile Model Saved")
