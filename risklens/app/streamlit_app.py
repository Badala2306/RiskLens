"""
RiskLens - Credit Risk Intelligence Dashboard
------------------------------------------------
Run with:
    streamlit run streamlit_app.py

Prerequisites (run once, from project root):
    python data/generate_data.py
    python data/load_to_db.py
    python model/train_model.py

Optional (for live AI narrative instead of the offline template):
    export ANTHROPIC_API_KEY=your_key_here
"""

import os
import sys
import json
import sqlite3

import joblib
import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai"))
from risk_narrative import generate_portfolio_memo, explain_customer_risk  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
DB_PATH = os.path.join(ROOT, "data", "credit_risk.db")
MODEL_PATH = os.path.join(ROOT, "model", "model.pkl")
SCALER_PATH = os.path.join(ROOT, "model", "scaler.pkl")
METRICS_PATH = os.path.join(ROOT, "model", "metrics.json")
IMPORTANCE_PATH = os.path.join(ROOT, "model", "feature_importance.csv")

st.set_page_config(page_title="RiskLens | Credit Risk Intelligence", layout="wide")


# ---------- Data loading (cached) ----------
@st.cache_data
def load_accounts():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM accounts", conn, parse_dates=["application_date"])
    conn.close()
    return df


@st.cache_resource
def load_model_artifacts():
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(METRICS_PATH) as f:
        metrics = json.load(f)
    importance = pd.read_csv(IMPORTANCE_PATH)
    return model, scaler, metrics, importance


df = load_accounts()
model, scaler, metrics, importance_df = load_model_artifacts()

# ---------- Sidebar filters ----------
st.sidebar.title("RiskLens")
st.sidebar.caption("Credit Risk Intelligence Platform")

segments = st.sidebar.multiselect("Segment", sorted(df["segment"].unique()), default=list(df["segment"].unique()))
regions = st.sidebar.multiselect("Region", sorted(df["region"].unique()), default=list(df["region"].unique()))

filtered = df[df["segment"].isin(segments) & df["region"].isin(regions)]

st.sidebar.divider()
st.sidebar.metric("Filtered accounts", f"{len(filtered):,}")
st.sidebar.metric("Filtered default rate", f"{filtered['default_flag'].mean():.1%}")

# ---------- Header ----------
st.title("🏦 RiskLens — Credit Risk Intelligence Platform")
st.caption("End-to-end portfolio analytics · ML default prediction · AI-generated risk narratives")

# ---------- KPI row ----------
c1, c2, c3, c4 = st.columns(4)
c1.metric("Total Accounts", f"{len(filtered):,}")
c2.metric("Default Rate", f"{filtered['default_flag'].mean():.1%}")
c3.metric("Total Exposure", f"${filtered['loan_amount'].sum():,.0f}")
c4.metric("Avg Payment Score", f"{filtered['payment_history_score'].mean():.0f}")

st.divider()

# ---------- Tabs ----------
tab_overview, tab_model, tab_ai, tab_lookup = st.tabs(
    ["📊 Portfolio Overview", "🤖 Model Performance", "📝 AI Risk Memo", "🔍 Customer Lookup"]
)

# ===================== TAB 1: Overview =====================
with tab_overview:
    col1, col2 = st.columns(2)

    with col1:
        seg_stats = (
            filtered.groupby("segment")
            .agg(accounts=("customer_id", "count"), default_rate=("default_flag", "mean"))
            .reset_index()
        )
        fig = px.bar(seg_stats, x="segment", y="default_rate", title="Default Rate by Segment",
                     text_auto=".1%", color="default_rate", color_continuous_scale="Reds")
        fig.update_layout(yaxis_tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        region_stats = (
            filtered.groupby("region")
            .agg(accounts=("customer_id", "count"), default_rate=("default_flag", "mean"))
            .reset_index()
        )
        fig = px.bar(region_stats, x="region", y="default_rate", title="Default Rate by Region",
                     text_auto=".1%", color="default_rate", color_continuous_scale="Oranges")
        fig.update_layout(yaxis_tickformat=".0%")
        st.plotly_chart(fig, use_container_width=True)

    # monthly trend
    trend = filtered.copy()
    trend["month"] = trend["application_date"].dt.to_period("M").astype(str)
    monthly = trend.groupby("month").agg(
        new_accounts=("customer_id", "count"),
        default_rate=("default_flag", "mean"),
    ).reset_index()
    fig = px.line(monthly, x="month", y="default_rate", title="Monthly Default Rate Trend", markers=True)
    fig.update_layout(yaxis_tickformat=".0%")
    st.plotly_chart(fig, use_container_width=True)

    # utilization risk band
    filtered_band = filtered.copy()
    filtered_band["utilization_band"] = pd.cut(
        filtered_band["credit_utilization"], bins=[0, 0.3, 0.6, 0.85, 1.0],
        labels=["Low (<30%)", "Medium (30-60%)", "High (60-85%)", "Critical (>85%)"]
    )
    band_stats = filtered_band.groupby("utilization_band", observed=True).agg(
        accounts=("customer_id", "count"), default_rate=("default_flag", "mean")
    ).reset_index()
    fig = px.bar(band_stats, x="utilization_band", y="default_rate",
                 title="Default Rate by Credit Utilization Band", text_auto=".1%",
                 color="default_rate", color_continuous_scale="Reds")
    fig.update_layout(yaxis_tickformat=".0%")
    st.plotly_chart(fig, use_container_width=True)

# ===================== TAB 2: Model Performance =====================
with tab_model:
    st.subheader("Model Comparison")
    results_df = pd.DataFrame(metrics["results"])
    st.dataframe(
        results_df[["model", "roc_auc", "precision", "recall", "f1"]],
        use_container_width=True, hide_index=True
    )
    st.info(f"**Best model in production:** {metrics['best_model']}")

    st.subheader("Top Risk Drivers (Feature Importance)")
    fig = px.bar(
        importance_df.head(10).sort_values("importance"),
        x="importance", y="feature", orientation="h",
        title="What the model weighs most heavily"
    )
    st.plotly_chart(fig, use_container_width=True)

# ===================== TAB 3: AI Risk Memo =====================
with tab_ai:
    st.subheader("Automated Risk Committee Memo")
    st.caption(
        "Generated automatically from current portfolio KPIs. "
        + ("🟢 Using live Claude API." if os.environ.get("ANTHROPIC_API_KEY") else
           "⚪ Offline template mode — set ANTHROPIC_API_KEY to enable live LLM generation.")
    )

    seg_rates = filtered.groupby("segment")["default_flag"].mean()
    region_rates = filtered.groupby("region")["default_flag"].mean()
    trend2 = filtered.copy()
    trend2["month"] = trend2["application_date"].dt.to_period("M").astype(str)
    monthly_rates = trend2.groupby("month")["default_flag"].mean()
    mom_change = 0.0
    if len(monthly_rates) >= 2:
        mom_change = (monthly_rates.iloc[-1] - monthly_rates.iloc[-2]) * 100

    stats = {
        "total_accounts": len(filtered),
        "default_rate_pct": round(filtered["default_flag"].mean() * 100, 1),
        "total_exposure": filtered["loan_amount"].sum(),
        "worst_segment": seg_rates.idxmax(),
        "worst_segment_rate": round(seg_rates.max() * 100, 1),
        "worst_region": region_rates.idxmax(),
        "worst_region_rate": round(region_rates.max() * 100, 1),
        "mom_change_pct": mom_change,
    }

    if st.button("🔄 Generate Memo", type="primary"):
        with st.spinner("Generating risk memo..."):
            memo = generate_portfolio_memo(stats)
        st.success("Memo generated")
        st.markdown(f"> {memo}")

# ===================== TAB 4: Customer Lookup =====================
with tab_lookup:
    st.subheader("Individual Customer Risk Lookup")
    customer_id = st.selectbox("Select Customer ID", filtered["customer_id"].tolist())
    cust = filtered[filtered["customer_id"] == customer_id].iloc[0]

    col1, col2, col3 = st.columns(3)
    col1.metric("Payment History Score", int(cust["payment_history_score"]))
    col2.metric("Credit Utilization", f"{cust['credit_utilization']:.0%}")
    col3.metric("Debt-to-Income", f"{cust['debt_to_income']:.0%}")

    feature_cols = metrics["feature_cols"]
    row = pd.DataFrame([{
        **{c: cust[c] for c in ["age", "employment_years", "annual_income", "existing_loans",
                                 "credit_utilization", "debt_to_income", "late_payments_12m",
                                 "payment_history_score", "loan_amount", "loan_term_months", "interest_rate"]},
    }])
    for c in feature_cols:
        if c.startswith("region_"):
            row[c] = 1 if c == f"region_{cust['region']}" else 0
        elif c.startswith("segment_"):
            row[c] = 1 if c == f"segment_{cust['segment']}" else 0
    row = row.reindex(columns=feature_cols, fill_value=0)

    if scaler is not None:
        row_input = scaler.transform(row)
    else:
        row_input = row
    risk_prob = model.predict_proba(row_input)[0, 1]

    st.metric("Predicted Default Probability", f"{risk_prob:.1%}")

    if st.button("💬 Explain This Risk Score"):
        with st.spinner("Generating explanation..."):
            explanation = explain_customer_risk(cust.to_dict(), importance_df.to_dict("records"))
        st.info(explanation)
