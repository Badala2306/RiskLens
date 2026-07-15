"""
RiskLens - Synthetic Credit Portfolio Generator
-------------------------------------------------
Generates a realistic (synthetic) consumer credit portfolio dataset.
Default risk is NOT random - it's driven by a weighted combination of
real risk factors (utilization, DTI, payment history, income, etc.)
plus noise, so the downstream ML model has real signal to learn from.

Run:
    python generate_data.py
Output:
    credit_portfolio.csv  (in this folder)
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

N = 8000
REGIONS = ["North", "South", "East", "West", "Central"]
SEGMENTS = ["Retail", "Small Business", "Premium", "Student"]

def generate_portfolio(n=N):
    age = np.clip(np.random.normal(40, 12, n), 18, 75).round().astype(int)
    employment_years = np.clip(np.random.exponential(6, n), 0, 40).round(1)

    # income correlated loosely with age/employment
    base_income = 25000 + employment_years * 1800 + np.random.normal(0, 12000, n)
    income = np.clip(base_income, 15000, 250000).round(-2)

    existing_loans = np.random.poisson(1.4, n)
    credit_utilization = np.clip(np.random.beta(2, 3, n), 0.01, 0.99)  # % of credit limit used
    debt_to_income = np.clip(np.random.beta(2, 4, n) * 1.2, 0.02, 1.1)
    late_payments_12m = np.random.poisson(0.7 + credit_utilization * 3, n)
    payment_history_score = np.clip(
        850 - late_payments_12m * 45 - debt_to_income * 200 + np.random.normal(0, 40, n),
        300, 850
    ).round().astype(int)

    loan_amount = np.clip(np.random.lognormal(9.2, 0.6, n), 1000, 500000).round(-2)
    loan_term_months = np.random.choice([12, 24, 36, 48, 60, 84], n,
                                         p=[0.1, 0.2, 0.3, 0.2, 0.15, 0.05])
    interest_rate = np.clip(
        5 + (1 - payment_history_score / 850) * 15 + np.random.normal(0, 1, n), 3, 29.9
    ).round(2)

    region = np.random.choice(REGIONS, n)
    segment = np.random.choice(SEGMENTS, n, p=[0.5, 0.2, 0.2, 0.1])

    # application dates spread over the last 24 months (for trend analysis)
    start = datetime(2024, 7, 1)
    application_date = [start + timedelta(days=int(d)) for d in np.random.uniform(0, 730, n)]

    # --- Risk score: weighted combination of real factors, then squashed to probability ---
    risk_score = (
        (1 - payment_history_score / 850) * 4.2
        + credit_utilization * 3.0
        + debt_to_income * 2.6
        + (late_payments_12m / (late_payments_12m.max() + 1)) * 2.4
        + (interest_rate / 30) * 1.2
        - (income / income.max()) * 1.5
        - (employment_years / 40) * 1.0
        + np.random.normal(0, 0.08, n)  # modest noise - keeps it realistic but learnable
    )
    scaled_risk = (risk_score - risk_score.mean()) * 1.8
    prob_default = 1 / (1 + np.exp(-scaled_risk))
    default_flag = (np.random.uniform(0, 1, n) < prob_default * 0.32).astype(int)  # ~ target 12-16% default rate

    df = pd.DataFrame({
        "customer_id": [f"CUST{100000+i}" for i in range(n)],
        "application_date": [d.strftime("%Y-%m-%d") for d in application_date],
        "age": age,
        "region": region,
        "segment": segment,
        "employment_years": employment_years,
        "annual_income": income.astype(int),
        "existing_loans": existing_loans,
        "credit_utilization": credit_utilization.round(3),
        "debt_to_income": debt_to_income.round(3),
        "late_payments_12m": late_payments_12m,
        "payment_history_score": payment_history_score,
        "loan_amount": loan_amount.astype(int),
        "loan_term_months": loan_term_months,
        "interest_rate": interest_rate,
        "default_flag": default_flag,
    })

    return df.sort_values("application_date").reset_index(drop=True)


if __name__ == "__main__":
    df = generate_portfolio()
    out_path = os.path.join(SCRIPT_DIR, "credit_portfolio.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} records -> {out_path}")
    print(f"Overall default rate: {df['default_flag'].mean():.2%}")
    print(df.head())
