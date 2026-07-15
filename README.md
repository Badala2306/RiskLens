# RiskLens — Credit Risk Intelligence Platform (Full-Stack React)

An end-to-end, modern Full-Stack credit intelligence and portfolio risk analytics platform. This application implements the UCI-inspired credit risk predictive model and introduces several high-value business analytics features including SHAP-like explainability, a business-optimal threshold calculator, and an interactive what-if risk simulator with real-time Gemini-powered underwriting.

## ✨ Advanced Features Added

1. **High-Fidelity Portfolio Dataset**:
   Includes a rich portfolio database of 2,000 active and defaulted loan accounts with realistic behavioral correlations (income, credit score, utilization, late payments, debt-to-income).

2. **Expected Profit Optimizer (Threshold Calculator)**:
   Calculates the mathematically optimal decision cutoff point that maximizes net bank profit based on the **Cost of a Default (capital loss)** versus the **Cost of Rejection (missed opportunity / lost interest margin)**. Shows the total expected value added over a static 0.5 ML threshold.

3. **Global Model Validation & Confusion Matrix**:
   Compares Logistic Regression champion model with Random Forest challenger, displaying standard validation metrics (ROC-AUC, Precision, Recall, F1) and interactive Confusion Matrices alongside global Feature Importances.

4. **Interactive "What-If" Credit Simulator**:
   Allows underwriters to manipulate applicant attributes (utilization, DTI, FICO, late payments) and instantly calculate simulated default probabilities, complete with interactive gauges and decision recommendations.

5. **Individual SHAP Explainability & Gemini Audit**:
   Retrieves individual customer profiles, maps local SHAP feature contributions (showing positive and negative drivers of the prediction), and uses server-side **Gemini 3.5 Flash** to draft a clear natural language risk report.

6. **Gemini Credit Committee Risk Memo**:
   Dynamically compiles current filtered portfolio metrics, flags segments and regional risk concentration, and drafts an executive risk committee memo via generative AI.

## 🛠️ Architecture

* **Frontend**: React 19, Tailwind CSS, Lucide Icons, Recharts (responsive data visualizations).
* **Backend**: Express (REST API), in-memory SQLite-matching state generator, Node-native.
* **AI/LLM Core**: Server-side Google GenAI SDK (`@google/genai`) using `gemini-3.5-flash` with offline structural templates fallback.
