# RiskLens — Credit Risk Intelligence Platform

An end-to-end analytics platform that simulates how a risk/product analytics
team at a bank or fintech monitors, predicts, and explains credit risk across
a loan portfolio — built to demonstrate the full **data → insight → model →
AI-automation** pipeline.

> Synthetic data only. No real customer or institutional data is used anywhere
> in this project.

## Why this project

This was built to map directly onto a Technical Product Analyst role spanning
**Data & Insights** and **AI & Automation** for enterprise fintech products:

| Job responsibility | Where it lives in this project |
|---|---|
| Analyze product/customer/business data for trends, risks, opportunities | `sql/portfolio_analysis.sql` |
| Define, track, and measure key metrics | Default rate, exposure, risk-band KPIs (SQL + dashboard) |
| Build dashboards & scalable reporting | `app/streamlit_app.py` |
| Build & validate predictive models | `model/train_model.py` (Logistic Regression vs Random Forest, ROC-AUC 0.73) |
| Identify AI-driven automation opportunities | `ai/risk_narrative.py` — auto-generated risk memos |
| Evaluate & leverage AI/ML technologies | Pluggable Claude API integration with offline fallback |

## Architecture

```
generate_data.py  →  credit_portfolio.csv  →  credit_risk.db (SQLite)
                                                     │
                                    ┌────────────────┼─────────────────┐
                            SQL analysis      ML model training   AI narrative engine
                        (portfolio_analysis.sql)  (train_model.py)   (risk_narrative.py)
                                    └────────────────┼─────────────────┘
                                                     │
                                         streamlit_app.py (dashboard)
```

**Data layer:** 8,000 synthetic loan accounts with realistic, correlated risk
features (income, utilization, DTI, payment history, delinquency) driving a
~15% default rate — tuned to be learnable but noisy, like real credit data.

**Analytics layer:** SQL queries covering portfolio health, segment/region
risk, utilization risk bands, monthly trend, and top-risk-account
identification — the kind of queries a risk/product analyst runs weekly.

**ML layer:** Logistic Regression and Random Forest trained to predict
default probability. Logistic Regression won on ROC-AUC (0.73) and is the
production model, with feature importances surfaced for explainability.

**AI layer:** A narrative-generation module that auto-writes a plain-English
risk committee memo and per-customer risk explanations. It's written as an
LLM-pluggable component — if `ANTHROPIC_API_KEY` is set it calls Claude live;
otherwise it falls back to a deterministic template built from the same
structured KPIs, so the pipeline never breaks in a demo or CI environment.

**Presentation layer:** A Streamlit dashboard with filterable KPIs, trend
charts, model performance comparison, the AI memo generator, and a
customer-level risk lookup with real-time prediction + explanation.

## Setup

```bash
git clone <this-repo>
cd risklens
pip install -r requirements.txt

# 1. Generate the synthetic portfolio
python data/generate_data.py

# 2. Load it into SQLite
python data/load_to_db.py

# 3. Train the model
python model/train_model.py

# 4. (Optional) enable live AI narrative generation
export ANTHROPIC_API_KEY=your_key_here

# 5. Run the dashboard
streamlit run app/streamlit_app.py
```

Explore the SQL analysis directly with:
```bash
sqlite3 data/credit_risk.db < sql/portfolio_analysis.sql
```

## Results

- **Default rate:** ~15% (realistic for a consumer credit portfolio)
- **Model:** Logistic Regression, ROC-AUC 0.73, Recall 0.63 at default threshold
- **Top risk drivers:** credit utilization, debt-to-income, payment history score
- **Riskiest segment/region:** Small Business / North (identified via SQL + confirmed by model feature importance — a nice cross-check to mention in an interview)

## Possible extensions (good talking points for an interview)

- Swap the offline template for a live Claude API call with structured JSON output (tool use) to auto-classify accounts into action queues
- Add SHAP for true per-prediction explainability instead of the lightweight feature-matching approach
- Deploy the dashboard (Streamlit Community Cloud / Docker) and add a scheduled job (e.g. GitHub Actions) to regenerate the memo weekly
- Add a monitoring layer to detect model/data drift over time — directly relevant to "continuous improvement of AI-powered solutions"

## Tech stack

Python · pandas · scikit-learn · SQLite/SQL · Streamlit · Plotly · Anthropic API (optional)

## Suggested resume bullets

- *Designed and built an end-to-end credit risk analytics platform (SQL, Python, ML) simulating an 8,000-account loan portfolio, including a Logistic Regression default-prediction model (ROC-AUC 0.73) and an interactive Streamlit dashboard.*
- *Built an AI-automation layer that auto-generates natural-language risk committee memos and per-customer risk explanations, architected with a live LLM API path and a deterministic offline fallback for reliability.*
- *Wrote and validated SQL analysis covering portfolio KPIs, segment/region risk concentration, and utilization-based risk banding to surface actionable underwriting recommendations.*
