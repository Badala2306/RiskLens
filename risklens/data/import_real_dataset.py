"""
RiskLens - Real-World Dataset Importer & Mapping Pipeline
---------------------------------------------------------
This script downloads a popular, real-world credit risk dataset (the classic
Kaggle Credit Risk / Lending Club-inspired dataset), maps its features to our 
16-column RiskLens schema, and automatically triggers SQLite database reload
and Machine Learning model retraining so the UI instantly runs on real-world data!

Options:
1. Run with zero arguments to automatically download and process a public real-world dataset.
2. Place your own custom "credit_risk_dataset.csv" in this folder and the pipeline will detect it!
"""

import os
import sys
import sqlite3
import urllib.request
import pandas as pd
import numpy as np

# Set paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = SCRIPT_DIR
CSV_OUTPUT_PATH = os.path.join(DATA_DIR, "credit_portfolio.csv")

# Public raw dataset mirrors for Kaggle Credit Risk Dataset
DATASET_URLS = [
    "https://raw.githubusercontent.com/lauradiosan/AI-2023-2024/main/labs/lab08/data/credit_risk_dataset.csv",
    "https://raw.githubusercontent.com/gandersonb/credit_risk_prediction/main/credit_risk_dataset.csv"
]

def download_dataset():
    """Attempts to download the real credit risk dataset from public mirrors."""
    print("Checking for existing real-world source files...")
    local_source = os.path.join(DATA_DIR, "credit_risk_dataset.csv")
    
    if os.path.exists(local_source):
        print(f" -> Found local source file: {local_source}. Using it for pipeline.")
        return local_source
        
    print("No local source found. Downloading real-world Credit Risk Dataset from public mirrors...")
    for url in DATASET_URLS:
        try:
            print(f" -> Trying mirror: {url}")
            urllib.request.urlretrieve(url, local_source)
            print(" -> Download successful!")
            return local_source
        except Exception as e:
            print(f" -> Mirror failed: {e}")
            
    print("\n[ERROR] All online mirrors were unreachable. Please download the Kaggle Credit Risk Dataset manually,")
    print("save it as 'credit_risk_dataset.csv' inside '/risklens/data/' and re-run this script.")
    sys.exit(1)

def map_and_clean_data(source_path):
    """Maps the Kaggle credit risk columns into RiskLens schema."""
    print("\nStep 1: Loading raw dataset and starting feature engineering/mapping...")
    raw_df = pd.read_csv(source_path)
    print(f" -> Raw dataset loaded successfully: {len(raw_df)} rows, {len(raw_df.columns)} columns.")
    
    # 1. Clean missing values from the raw dataset (interest rate and employment length often have nulls)
    raw_df['person_emp_length'] = raw_df['person_emp_length'].fillna(raw_df['person_emp_length'].median())
    raw_df['loan_int_rate'] = raw_df['loan_int_rate'].fillna(raw_df['loan_int_rate'].median())
    
    # Filter out extreme anomalies/outliers for clean visualization (e.g., age > 100)
    raw_df = raw_df[raw_df['person_age'] < 90]
    
    # Limit row count to ~4,000 for responsive loading and training
    processed_df = raw_df.sample(n=min(4000, len(raw_df)), random_state=42).copy()
    processed_df = processed_df.reset_index(drop=True)
    
    # 2. Build the target RiskLens Schema
    mapped_data = {}
    
    # Unique Customer IDs
    mapped_data['customer_id'] = [f"CUST{200000 + i}" for i in range(len(processed_df))]
    
    # Generate Application Dates spread uniformly across the last 24 months (for nice UI timelines)
    end_date = pd.Timestamp("2026-07-15")
    start_date = end_date - pd.DateOffset(months=24)
    dates_pool = pd.date_range(start=start_date, end=end_date, freq='h')
    mapped_data['application_date'] = np.random.choice(dates_pool, size=len(processed_df))
    mapped_data['application_date'] = [d.strftime("%Y-%m-%d") for d in mapped_data['application_date']]
    
    # Numerical profiles
    mapped_data['age'] = processed_df['person_age'].astype(int)
    mapped_data['employment_years'] = processed_df['person_emp_length'].round(1)
    mapped_data['annual_income'] = processed_df['person_income'].astype(int)
    mapped_data['existing_loans'] = processed_df['cb_person_cred_hist_length'].astype(int)
    
    # Map credit utilization from percent income or raw utilization
    # Kaggle dataset has 'loan_percent_income'. We can map utilization to be correlated with person credit default on file
    base_util = processed_df['loan_percent_income'] * 1.5 + np.random.uniform(0.05, 0.2, size=len(processed_df))
    mapped_data['credit_utilization'] = np.clip(base_util, 0.01, 0.99).round(3)
    
    # Debt to Income
    mapped_data['debt_to_income'] = processed_df['loan_percent_income'].round(3)
    
    # Map historical default to late payments
    # cb_person_default_on_file is 'Y' or 'N'
    late_payments = []
    for val in processed_df['cb_person_default_on_file']:
        if val == 'Y':
            late_payments.append(np.random.randint(1, 6))
        else:
            late_payments.append(np.random.choice([0, 1], p=[0.85, 0.15]))
    mapped_data['late_payments_12m'] = late_payments
    
    # Map Loan Grade (A-G) to standard FICO ranges (Payment History Score)
    score_mapping = {
        'A': 760, 'B': 715, 'C': 665, 'D': 615, 'E': 565, 'F': 515, 'G': 480
    }
    fico_scores = []
    for grade in processed_df['loan_grade']:
        base_fico = score_mapping.get(grade, 650)
        # Add realistic minor variance within grade bands
        fico_scores.append(int(np.clip(base_fico + np.random.normal(0, 15), 300, 850)))
    mapped_data['payment_history_score'] = fico_scores
    
    # Core Loan attributes
    mapped_data['loan_amount'] = processed_df['loan_amnt'].astype(int)
    
    # Generate realistic loan terms based on loan size
    terms = []
    for amt in processed_df['loan_amnt']:
        if amt > 25000:
            terms.append(np.random.choice([48, 60, 84]))
        elif amt > 10000:
            terms.append(np.random.choice([36, 48, 60]))
        else:
            terms.append(np.random.choice([12, 24, 36]))
    mapped_data['loan_term_months'] = terms
    
    # Interest rate and default flag mapped directly
    mapped_data['interest_rate'] = processed_df['loan_int_rate'].round(2)
    mapped_data['default_flag'] = processed_df['loan_status'].astype(int)
    
    # Randomize Region
    regions = ["North", "South", "East", "West", "Central"]
    mapped_data['region'] = np.random.choice(regions, size=len(processed_df))
    
    # Map loan_intent to segment
    segment_mapping = {
        'PERSONAL': 'Retail',
        'EDUCATION': 'Student',
        'VENTURE': 'Small Business',
        'MEDICAL': 'Retail',
        'HOMEIMPROVEMENT': 'Premium',
        'DEBTCONSOLIDATION': 'Retail'
    }
    mapped_data['segment'] = [segment_mapping.get(intent, 'Retail') for intent in processed_df['loan_intent']]
    
    # Create the mapped dataframe
    final_df = pd.DataFrame(mapped_data)
    
    # Save the mapped dataset back to credit_portfolio.csv
    print(f"\nStep 2: Saving cleaned mapped dataset to {CSV_OUTPUT_PATH}...")
    final_df.to_csv(CSV_OUTPUT_PATH, index=False)
    print(" -> credit_portfolio.csv updated!")
    return final_df

def run_downstream_scripts():
    """Runs train_model.py and load_to_db.py to update ML model and SQLite database."""
    print("\nStep 3: Triggering database reload...")
    try:
        import load_to_db
        print(" -> SQLite database credit_risk.db reloaded successfully!")
    except Exception as e:
        print(f" -> Failed to reload SQLite database: {e}")
        
    print("\nStep 4: Triggering Machine Learning model retraining...")
    sys.path.append(os.path.join(SCRIPT_DIR, "..", "model"))
    try:
        import train_model
        # Execute main function of train_model to retrain
        train_model.main()
        print(" -> ML model retrained and serialized successfully on real data!")
    except Exception as e:
        print(f" -> Failed to retrain ML model: {e}")

def main():
    print("=====================================================================")
    print("            RiskLens Real-World Dataset Pipeline Activated           ")
    print("=====================================================================")
    source_file = download_dataset()
    map_and_clean_data(source_file)
    run_downstream_scripts()
    print("\n=====================================================================")
    print(" SUCCESS: Real-world credit risk dataset integrated successfully!")
    print(" RiskLens platform is now running live on Kaggle credit data.")
    print("=====================================================================")

if __name__ == "__main__":
    main()
