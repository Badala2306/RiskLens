"""
Loads credit_portfolio.csv into a SQLite database (credit_risk.db)
so the project demonstrates real SQL analysis, not just pandas.
"""
import os
import sqlite3
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "credit_portfolio.csv")
DB_PATH = os.path.join(SCRIPT_DIR, "credit_risk.db")

df = pd.read_csv(CSV_PATH, parse_dates=["application_date"])

conn = sqlite3.connect(DB_PATH)
df.to_sql("accounts", conn, if_exists="replace", index=False)

# helpful index for query performance
conn.execute("CREATE INDEX IF NOT EXISTS idx_segment ON accounts(segment)")
conn.execute("CREATE INDEX IF NOT EXISTS idx_region ON accounts(region)")
conn.commit()
conn.close()

print(f"Loaded {len(df)} rows into credit_risk.db -> table 'accounts'")
