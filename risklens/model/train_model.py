"""
RiskLens - Credit Default Prediction Model
--------------------------------------------
Trains and compares two models (Logistic Regression, Random Forest) to
predict probability of default, then saves the best one along with
metrics and feature importances for the dashboard to consume.

Run:
    python train_model.py
Outputs (in this folder):
    model.pkl            - the trained model (best of the two)
    scaler.pkl           - fitted StandardScaler (for logistic regression path)
    metrics.json         - evaluation metrics for both models
    feature_importance.csv
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix

# Anchor all paths to this script's own location, so it works no matter
# what folder you run "python train_model.py" from.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "..", "data", "credit_portfolio.csv")

FEATURES = [
    "age", "employment_years", "annual_income", "existing_loans",
    "credit_utilization", "debt_to_income", "late_payments_12m",
    "payment_history_score", "loan_amount", "loan_term_months", "interest_rate",
]
CATEGORICAL = ["region", "segment"]
TARGET = "default_flag"


def load_data():
    df = pd.read_csv(DATA_PATH)
    df_enc = pd.get_dummies(df, columns=CATEGORICAL, drop_first=True)
    feature_cols = FEATURES + [c for c in df_enc.columns if c.startswith("region_") or c.startswith("segment_")]
    X = df_enc[feature_cols]
    y = df_enc[TARGET]
    return X, y, feature_cols


def evaluate(name, model, X_test, y_test, y_prob):
    y_pred = (y_prob >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    return {
        "model": name,
        "roc_auc": round(roc_auc_score(y_test, y_prob), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1": round(f1_score(y_test, y_pred), 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def main():
    X, y, feature_cols = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    results = []

    # --- Logistic Regression (scaled) ---
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    logreg = LogisticRegression(max_iter=1000, class_weight="balanced")
    logreg.fit(X_train_s, y_train)
    prob_lr = logreg.predict_proba(X_test_s)[:, 1]
    results.append(evaluate("LogisticRegression", logreg, X_test, y_test, prob_lr))

    # --- Random Forest ---
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=15,
        class_weight="balanced", random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)
    prob_rf = rf.predict_proba(X_test)[:, 1]
    results.append(evaluate("RandomForest", rf, X_test, y_test, prob_rf))

    # pick best by ROC-AUC
    best = max(results, key=lambda r: r["roc_auc"])
    print("Model comparison:")
    for r in results:
        print(f"  {r['model']}: ROC-AUC={r['roc_auc']}, Precision={r['precision']}, Recall={r['recall']}, F1={r['f1']}")
    print(f"\nBest model: {best['model']}")

    if best["model"] == "RandomForest":
        joblib.dump(rf, os.path.join(SCRIPT_DIR, "model.pkl"))
        joblib.dump(None, os.path.join(SCRIPT_DIR, "scaler.pkl"))  # RF doesn't need scaling
        importances = pd.DataFrame({
            "feature": feature_cols,
            "importance": rf.feature_importances_,
        }).sort_values("importance", ascending=False)
    else:
        joblib.dump(logreg, os.path.join(SCRIPT_DIR, "model.pkl"))
        joblib.dump(scaler, os.path.join(SCRIPT_DIR, "scaler.pkl"))
        importances = pd.DataFrame({
            "feature": feature_cols,
            "importance": np.abs(logreg.coef_[0]),
        }).sort_values("importance", ascending=False)

    importances.to_csv(os.path.join(SCRIPT_DIR, "feature_importance.csv"), index=False)

    with open(os.path.join(SCRIPT_DIR, "metrics.json"), "w") as f:
        json.dump({"results": results, "best_model": best["model"], "feature_cols": feature_cols}, f, indent=2)

    print("\nSaved: model.pkl, scaler.pkl, metrics.json, feature_importance.csv")
    print("\nTop 5 risk drivers:")
    print(importances.head(5).to_string(index=False))


if __name__ == "__main__":
    main()
