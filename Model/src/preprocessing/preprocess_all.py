import pandas as pd


users = pd.read_csv("data/raw/users.csv")

def risk_label(row):
    if row['risk_appetite'] == 'low':
        return 0
    elif row['risk_appetite'] == 'medium':
        return 1
    else:
        return 2

users['risk_label'] = users.apply(risk_label, axis=1)
users.to_csv("data/processed/users_processed.csv", index=False)


props = pd.read_csv("data/raw/properties.csv")

props['expected_return'] = props['rental_yield'] + props['price_growth']
props['risk_score'] = 100 - props['occupancy_rate']

props.to_csv("data/processed/properties_processed.csv", index=False)

print("✅ Preprocessing done")
