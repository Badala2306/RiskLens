-- ============================================================
-- RiskLens :: Portfolio Risk Analysis Queries
-- Run against credit_risk.db (table: accounts)
-- ============================================================

-- 1. Overall portfolio health
SELECT
    COUNT(*) AS total_accounts,
    SUM(default_flag) AS total_defaults,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct,
    ROUND(SUM(loan_amount), 0) AS total_exposure,
    ROUND(SUM(CASE WHEN default_flag = 1 THEN loan_amount ELSE 0 END), 0) AS exposure_at_default
FROM accounts;

-- 2. Default rate & exposure by segment
SELECT
    segment,
    COUNT(*) AS accounts,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct,
    ROUND(AVG(loan_amount), 0) AS avg_loan_amount,
    ROUND(SUM(loan_amount), 0) AS total_exposure
FROM accounts
GROUP BY segment
ORDER BY default_rate_pct DESC;

-- 3. Default rate by region
SELECT
    region,
    COUNT(*) AS accounts,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct
FROM accounts
GROUP BY region
ORDER BY default_rate_pct DESC;

-- 4. Risk banding by credit utilization (behavioral risk tiers)
SELECT
    CASE
        WHEN credit_utilization < 0.3 THEN 'Low (<30%)'
        WHEN credit_utilization < 0.6 THEN 'Medium (30-60%)'
        WHEN credit_utilization < 0.85 THEN 'High (60-85%)'
        ELSE 'Critical (>85%)'
    END AS utilization_band,
    COUNT(*) AS accounts,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct
FROM accounts
GROUP BY utilization_band
ORDER BY default_rate_pct DESC;

-- 5. Monthly application & default trend (for trend charts)
SELECT
    strftime('%Y-%m', application_date) AS month,
    COUNT(*) AS new_accounts,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct,
    ROUND(SUM(loan_amount), 0) AS new_exposure
FROM accounts
GROUP BY month
ORDER BY month;

-- 6. Top 20 highest-risk currently-active accounts
-- (proxy for "active" = not yet defaulted; ranked by known risk drivers)
SELECT
    customer_id, segment, region, credit_utilization, debt_to_income,
    late_payments_12m, payment_history_score, loan_amount
FROM accounts
WHERE default_flag = 0
ORDER BY
    (credit_utilization + debt_to_income) DESC,
    late_payments_12m DESC,
    payment_history_score ASC
LIMIT 20;

-- 7. Payment history score distribution vs default rate (for model sanity-check)
SELECT
    CASE
        WHEN payment_history_score >= 750 THEN 'Excellent (750+)'
        WHEN payment_history_score >= 650 THEN 'Good (650-749)'
        WHEN payment_history_score >= 550 THEN 'Fair (550-649)'
        ELSE 'Poor (<550)'
    END AS score_band,
    COUNT(*) AS accounts,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct
FROM accounts
GROUP BY score_band
ORDER BY default_rate_pct DESC;
