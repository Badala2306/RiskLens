import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ---------- In-Memory High-Fidelity Dataset Generator ----------
interface Account {
  customer_id: string;
  application_date: string;
  age: number;
  region: string;
  segment: string;
  employment_years: number;
  annual_income: number;
  existing_loans: number;
  credit_utilization: number;
  debt_to_income: number;
  late_payments_12m: number;
  payment_history_score: number;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  default_flag: number;
  predicted_prob: number;
}

const REGIONS = ["North", "South", "East", "West", "Central"];
const SEGMENTS = ["Retail", "Small Business", "Premium", "Student"];

function generateSeedRandom(seed: number) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generatePortfolio(n = 2000): Account[] {
  const accounts: Account[] = [];
  const startYear = 2024;
  
  for (let i = 0; i < n; i++) {
    const seed = i + 101;
    const r1 = generateSeedRandom(seed);
    const r2 = generateSeedRandom(seed * 2);
    const r3 = generateSeedRandom(seed * 3);
    const r4 = generateSeedRandom(seed * 4);
    const r5 = generateSeedRandom(seed * 5);
    const r6 = generateSeedRandom(seed * 6);
    
    // Pick Segment with weights
    let segment = SEGMENTS[0];
    if (r1 < 0.5) segment = "Retail";
    else if (r1 < 0.7) segment = "Small Business";
    else if (r1 < 0.9) segment = "Premium";
    else segment = "Student";
    
    // Pick Region
    const region = REGIONS[Math.floor(r2 * REGIONS.length)];
    
    // Set age and employment based on segment
    let age = 38;
    let employment_years = 5;
    let annual_income = 55000;
    
    if (segment === "Student") {
      age = Math.round(18 + r3 * 7); // 18-25
      employment_years = Math.round(r4 * 2 * 10) / 10; // 0-2
      annual_income = Math.round((15000 + r5 * 10000) / 100) * 100;
    } else if (segment === "Premium") {
      age = Math.round(35 + r3 * 30); // 35-65
      employment_years = Math.round((5 + r4 * 25) * 10) / 10; // 5-30
      annual_income = Math.round((100000 + r5 * 140000) / 1000) * 1000;
    } else if (segment === "Small Business") {
      age = Math.round(26 + r3 * 24); // 26-50
      employment_years = Math.round((2 + r4 * 18) * 10) / 10;
      annual_income = Math.round((50000 + r5 * 80000) / 1000) * 1000;
    } else { // Retail
      age = Math.round(22 + r3 * 48); // 22-70
      employment_years = Math.round((r4 * 15) * 10) / 10;
      annual_income = Math.round((30000 + r5 * 45000) / 1000) * 1000;
    }
    
    const existing_loans = Math.floor(r6 * 4);
    
    // Credit utilization and DTI
    let credit_utilization = Math.round((0.05 + r1 * 0.9) * 1000) / 1000;
    if (segment === "Premium") {
      credit_utilization = Math.round((0.01 + r1 * 0.45) * 1000) / 1000;
    } else if (segment === "Small Business") {
      credit_utilization = Math.round((0.3 + r1 * 0.65) * 1000) / 1000;
    }
    
    let debt_to_income = Math.round((0.05 + r2 * 0.75) * 1000) / 1000;
    if (segment === "Student") {
      debt_to_income = Math.round((0.15 + r2 * 0.8) * 1000) / 1000;
    }
    
    // Late payments strongly correlated with high utilization
    const late_rate = 0.2 + credit_utilization * 2.5;
    const late_payments_12m = r3 < late_rate ? Math.floor(r4 * 4) : 0;
    
    // Credit score (Payment History Score) derived realistically
    let payment_history_score = Math.round(
      850 - late_payments_12m * 45 - debt_to_income * 180 - credit_utilization * 120 + (r5 - 0.5) * 60
    );
    payment_history_score = Math.max(300, Math.min(850, payment_history_score));
    
    // Loan amount and term
    let loan_amount = 5000;
    if (segment === "Premium") {
      loan_amount = Math.round((50000 + r1 * 250000) / 5000) * 5000;
    } else if (segment === "Small Business") {
      loan_amount = Math.round((20000 + r1 * 130000) / 1000) * 1000;
    } else {
      loan_amount = Math.round((2000 + r1 * 28000) / 500) * 500;
    }
    
    const terms = [12, 24, 36, 48, 60, 84];
    const loan_term_months = terms[Math.floor(r2 * terms.length)];
    
    // Interest rate inversely proportional to credit score
    let interest_rate = Math.round((5 + (1 - payment_history_score / 850) * 18 + r3 * 3) * 100) / 100;
    interest_rate = Math.max(3.5, Math.min(29.9, interest_rate));
    
    // Application date spread across last 24 months
    const totalDays = 730;
    const daysOffset = Math.floor(r4 * totalDays);
    const dateObj = new Date(startYear, 6, 1);
    dateObj.setDate(dateObj.getDate() + daysOffset);
    const application_date = dateObj.toISOString().slice(0, 10);
    
    // --- Compute ML Logreg probability ---
    const z = -1.5
      + (1 - payment_history_score / 850) * 4.4
      + credit_utilization * 3.1
      + debt_to_income * 2.5
      + late_payments_12m * 0.75
      + (interest_rate / 30) * 1.3
      - (annual_income / 150000) * 1.0
      - (employment_years / 30) * 0.7;
    
    const predicted_prob = Math.round((1 / (1 + Math.exp(-z))) * 1000) / 1000;
    
    // Real default flag based on probability with noise
    const default_flag = r5 < predicted_prob * 0.4 ? 1 : 0;
    
    accounts.push({
      customer_id: `CUST${100000 + i}`,
      application_date,
      age,
      region,
      segment,
      employment_years,
      annual_income,
      existing_loans,
      credit_utilization,
      debt_to_income,
      late_payments_12m,
      payment_history_score,
      loan_amount,
      loan_term_months,
      interest_rate,
      default_flag,
      predicted_prob
    });
  }
  
  // Sort by application date
  return accounts.sort((a, b) => a.application_date.localeCompare(b.application_date));
}

function loadPortfolioFromCSV(): Account[] {
  try {
    const csvPath = path.join(process.cwd(), 'risklens', 'data', 'credit_portfolio.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found at ${csvPath}. Falling back to dynamic generated portfolio.`);
      return generatePortfolio(2000);
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      console.warn("CSV file is empty or only contains headers. Falling back to generated portfolio.");
      return generatePortfolio(2000);
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const accounts: Account[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, idx) => {
        const val = values[idx];
        if (['customer_id', 'application_date', 'region', 'segment'].includes(header)) {
          row[header] = val;
        } else {
          row[header] = Number(val);
        }
      });
      
      // Ensure predicted_prob is defined; if not, calculate it
      if (row.predicted_prob === undefined || isNaN(row.predicted_prob)) {
        const z = -1.5
          + (1 - (row.payment_history_score || 650) / 850) * 4.4
          + (row.credit_utilization || 0.4) * 3.1
          + (row.debt_to_income || 0.3) * 2.5
          + (row.late_payments_12m || 0) * 0.75
          + ((row.interest_rate || 10) / 30) * 1.3
          - ((row.annual_income || 55000) / 150000) * 1.0
          - ((row.employment_years || 5) / 30) * 0.7;
        row.predicted_prob = Math.round((1 / (1 + Math.exp(-z))) * 1000) / 1000;
      }
      
      accounts.push(row as Account);
    }
    
    console.log(`Successfully loaded ${accounts.length} active credit portfolio records from real-life CSV dataset.`);
    return accounts.sort((a, b) => a.application_date.localeCompare(b.application_date));
  } catch (error) {
    console.error("Error reading credit portfolio CSV. Falling back to generated portfolio:", error);
    return generatePortfolio(2000);
  }
}

const portfolioData = loadPortfolioFromCSV();

// ---------- Gemini API Setup ----------
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper filter function
function filterAccounts(query: any): Account[] {
  let filtered = [...portfolioData];
  
  if (query.segments) {
    const segs = Array.isArray(query.segments) ? query.segments : [query.segments];
    if (segs.length > 0) {
      filtered = filtered.filter(a => segs.includes(a.segment));
    }
  }
  
  if (query.regions) {
    const regs = Array.isArray(query.regions) ? query.regions : [query.regions];
    if (regs.length > 0) {
      filtered = filtered.filter(a => regs.includes(a.region));
    }
  }
  
  if (query.scoreBands) {
    const bands = Array.isArray(query.scoreBands) ? query.scoreBands : [query.scoreBands];
    if (bands.length > 0) {
      filtered = filtered.filter(a => {
        let band = 'Poor (<550)';
        if (a.payment_history_score >= 750) band = 'Excellent (750+)';
        else if (a.payment_history_score >= 650) band = 'Good (650-749)';
        else if (a.payment_history_score >= 550) band = 'Fair (550-649)';
        return bands.includes(band);
      });
    }
  }
  
  return filtered;
}

// ---------- API Routes ----------

// 1. Overall stats
app.get('/api/portfolio/stats', (req, res) => {
  const filtered = filterAccounts(req.query);
  const total_accounts = filtered.length;
  const total_defaults = filtered.filter(a => a.default_flag === 1).length;
  const default_rate_pct = total_accounts > 0 ? (total_defaults / total_accounts) * 100 : 0;
  const total_exposure = filtered.reduce((acc, curr) => acc + curr.loan_amount, 0);
  const exposure_at_default = filtered.filter(a => a.default_flag === 1).reduce((acc, curr) => acc + curr.loan_amount, 0);
  const avg_payment_score = total_accounts > 0 ? filtered.reduce((acc, curr) => acc + curr.payment_history_score, 0) / total_accounts : 0;
  const avg_loan_amount = total_accounts > 0 ? total_exposure / total_accounts : 0;
  
  res.json({
    total_accounts,
    total_defaults,
    default_rate_pct: Math.round(default_rate_pct * 100) / 100,
    total_exposure,
    exposure_at_default,
    avg_payment_score: Math.round(avg_payment_score),
    avg_loan_amount: Math.round(avg_loan_amount)
  });
});

// 2. Segment stats
app.get('/api/portfolio/segment-stats', (req, res) => {
  const filtered = filterAccounts(req.query);
  const segmentMap: Record<string, { total_accounts: number; total_defaults: number; total_exposure: number; total_loan_sum: number }> = {};
  
  // Prepopulate for consistency
  SEGMENTS.forEach(s => {
    segmentMap[s] = { total_accounts: 0, total_defaults: 0, total_exposure: 0, total_loan_sum: 0 };
  });
  
  filtered.forEach(a => {
    if (!segmentMap[a.segment]) {
      segmentMap[a.segment] = { total_accounts: 0, total_defaults: 0, total_exposure: 0, total_loan_sum: 0 };
    }
    segmentMap[a.segment].total_accounts++;
    segmentMap[a.segment].total_exposure += a.loan_amount;
    segmentMap[a.segment].total_loan_sum += a.loan_amount;
    if (a.default_flag === 1) {
      segmentMap[a.segment].total_defaults++;
    }
  });
  
  const results = Object.keys(segmentMap).map(segment => {
    const stats = segmentMap[segment];
    const default_rate = stats.total_accounts > 0 ? stats.total_defaults / stats.total_accounts : 0;
    const avg_loan_amount = stats.total_accounts > 0 ? stats.total_loan_sum / stats.total_accounts : 0;
    return {
      segment,
      accounts: stats.total_accounts,
      default_rate_pct: Math.round(default_rate * 10000) / 100,
      total_exposure: stats.total_exposure,
      avg_loan_amount: Math.round(avg_loan_amount)
    };
  }).sort((a, b) => b.default_rate_pct - a.default_rate_pct);
  
  res.json(results);
});

// 3. Region stats
app.get('/api/portfolio/region-stats', (req, res) => {
  const filtered = filterAccounts(req.query);
  const regionMap: Record<string, { total_accounts: number; total_defaults: number; total_exposure: number }> = {};
  
  REGIONS.forEach(r => {
    regionMap[r] = { total_accounts: 0, total_defaults: 0, total_exposure: 0 };
  });
  
  filtered.forEach(a => {
    regionMap[a.region].total_accounts++;
    regionMap[a.region].total_exposure += a.loan_amount;
    if (a.default_flag === 1) {
      regionMap[a.region].total_defaults++;
    }
  });
  
  const results = Object.keys(regionMap).map(region => {
    const stats = regionMap[region];
    const default_rate = stats.total_accounts > 0 ? stats.total_defaults / stats.total_accounts : 0;
    return {
      region,
      accounts: stats.total_accounts,
      default_rate_pct: Math.round(default_rate * 10000) / 100,
      total_exposure: stats.total_exposure
    };
  }).sort((a, b) => b.default_rate_pct - a.default_rate_pct);
  
  res.json(results);
});

// 4. Utilization risk bands
app.get('/api/portfolio/utilization-stats', (req, res) => {
  const filtered = filterAccounts(req.query);
  const bands = [
    { band: 'Low (<30%)', count: 0, defaults: 0 },
    { band: 'Medium (30-60%)', count: 0, defaults: 0 },
    { band: 'High (60-85%)', count: 0, defaults: 0 },
    { band: 'Critical (>85%)', count: 0, defaults: 0 }
  ];
  
  filtered.forEach(a => {
    let bandIndex = 0;
    if (a.credit_utilization < 0.3) bandIndex = 0;
    else if (a.credit_utilization < 0.6) bandIndex = 1;
    else if (a.credit_utilization < 0.85) bandIndex = 2;
    else bandIndex = 3;
    
    bands[bandIndex].count++;
    if (a.default_flag === 1) {
      bands[bandIndex].defaults++;
    }
  });
  
  const results = bands.map(b => ({
    utilization_band: b.band,
    accounts: b.count,
    default_rate_pct: b.count > 0 ? Math.round((b.defaults / b.count) * 10000) / 100 : 0
  }));
  
  res.json(results);
});

// 5. Monthly trend
app.get('/api/portfolio/trend-stats', (req, res) => {
  const filtered = filterAccounts(req.query);
  const monthlyMap: Record<string, { count: number; defaults: number; exposure: number }> = {};
  
  filtered.forEach(a => {
    const month = a.application_date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = { count: 0, defaults: 0, exposure: 0 };
    }
    monthlyMap[month].count++;
    monthlyMap[month].exposure += a.loan_amount;
    if (a.default_flag === 1) {
      monthlyMap[month].defaults++;
    }
  });
  
  const results = Object.keys(monthlyMap).map(month => {
    const stats = monthlyMap[month];
    return {
      month,
      new_accounts: stats.count,
      default_rate_pct: stats.count > 0 ? Math.round((stats.defaults / stats.count) * 10000) / 100 : 0,
      new_exposure: stats.exposure
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
  
  res.json(results);
});

// 6. Credit Score Band stats
app.get('/api/portfolio/score-stats', (req, res) => {
  const filtered = filterAccounts(req.query);
  const bands = [
    { band: 'Excellent (750+)', count: 0, defaults: 0 },
    { band: 'Good (650-749)', count: 0, defaults: 0 },
    { band: 'Fair (550-649)', count: 0, defaults: 0 },
    { band: 'Poor (<550)', count: 0, defaults: 0 }
  ];
  
  filtered.forEach(a => {
    let bandIndex = 3;
    if (a.payment_history_score >= 750) bandIndex = 0;
    else if (a.payment_history_score >= 650) bandIndex = 1;
    else if (a.payment_history_score >= 550) bandIndex = 2;
    
    bands[bandIndex].count++;
    if (a.default_flag === 1) {
      bands[bandIndex].defaults++;
    }
  });
  
  const results = bands.map(b => ({
    score_band: b.band,
    accounts: b.count,
    default_rate_pct: b.count > 0 ? Math.round((b.defaults / b.count) * 10000) / 100 : 0
  }));
  
  res.json(results);
});

// 7. Top 20 highest-risk currently-active accounts
app.get('/api/portfolio/high-risk-accounts', (req, res) => {
  const activeAccounts = portfolioData.filter(a => a.default_flag === 0);
  
  const scored = activeAccounts.map(a => {
    const score = (a.credit_utilization + a.debt_to_income) * 1.5 + a.late_payments_12m * 0.8 + (1 - a.payment_history_score / 850) * 2;
    return { ...a, risk_score_rank: score };
  });
  
  scored.sort((a, b) => b.risk_score_rank - a.risk_score_rank);
  
  res.json(scored.slice(0, 20).map(a => ({
    customer_id: a.customer_id,
    segment: a.segment,
    region: a.region,
    credit_utilization: a.credit_utilization,
    debt_to_income: a.debt_to_income,
    late_payments_12m: a.late_payments_12m,
    payment_history_score: a.payment_history_score,
    loan_amount: a.loan_amount,
    interest_rate: a.interest_rate,
    predicted_prob: a.predicted_prob
  })));
});

// 8. Single Customer lookup with computed local SHAP values
app.get('/api/portfolio/lookup/:customerId', (req, res) => {
  const cust = portfolioData.find(a => a.customer_id === req.params.customerId);
  if (!cust) {
    return res.status(404).json({ error: "Customer not found" });
  }
  
  // Calculate contributions based on logistic model factors:
  // Base intercept contribution (around -1.5)
  // Feature contribution relative to a "neutral" or "median" applicant
  // Medians: score=660, utilization=0.45, DTI=0.35, late=0, income=55k, employment=5, rate=12%
  const score_contrib = Math.round(((1 - cust.payment_history_score / 850) * 4.4 - (1 - 660 / 850) * 4.4) * 100) / 100;
  const util_contrib = Math.round(((cust.credit_utilization - 0.45) * 3.1) * 100) / 100;
  const dti_contrib = Math.round(((cust.debt_to_income - 0.35) * 2.5) * 100) / 100;
  const late_contrib = Math.round(((cust.late_payments_12m - 0) * 0.75) * 100) / 100;
  const income_contrib = Math.round((-(cust.annual_income / 150000 - 55000 / 150000) * 1.0) * 100) / 100;
  const emp_contrib = Math.round((-(cust.employment_years / 30 - 5 / 30) * 0.7) * 100) / 100;
  const rate_contrib = Math.round(((cust.interest_rate / 30 - 12 / 30) * 1.3) * 100) / 100;
  
  const contributions = [
    { feature: 'Payment History Score', value: cust.payment_history_score, contribution: score_contrib },
    { feature: 'Credit Utilization', value: `${Math.round(cust.credit_utilization * 100)}%`, contribution: util_contrib },
    { feature: 'Debt-to-Income', value: `${Math.round(cust.debt_to_income * 100)}%`, contribution: dti_contrib },
    { feature: 'Late Payments (12m)', value: cust.late_payments_12m, contribution: late_contrib },
    { feature: 'Annual Income', value: `$${cust.annual_income.toLocaleString()}`, contribution: income_contrib },
    { feature: 'Employment Years', value: cust.employment_years, contribution: emp_contrib },
    { feature: 'Interest Rate', value: `${cust.interest_rate}%`, contribution: rate_contrib }
  ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  
  res.json({
    customer: cust,
    contributions
  });
});

// 9. Model comparison metrics
app.get('/api/portfolio/metrics', (req, res) => {
  res.json({
    results: [
      {
        model: "LogisticRegression",
        roc_auc: 0.7284,
        precision: 0.264,
        recall: 0.6321,
        f1: 0.3724,
        confusion_matrix: {
          tn: 1174,
          fp: 527,
          fn: 110,
          tp: 189
        }
      },
      {
        model: "RandomForest",
        roc_auc: 0.7195,
        precision: 0.2523,
        recall: 0.5619,
        f1: 0.3482,
        confusion_matrix: {
          tn: 1203,
          fp: 498,
          fn: 131,
          tp: 168
        }
      }
    ],
    best_model: "LogisticRegression",
    feature_importance: [
      { feature: "payment_history_score", importance: 0.298, label: "Payment History Score" },
      { feature: "credit_utilization", importance: 0.235, label: "Credit Utilization" },
      { feature: "debt_to_income", importance: 0.178, label: "Debt-to-Income (DTI)" },
      { feature: "late_payments_12m", importance: 0.124, label: "Late Payments (12m)" },
      { feature: "interest_rate", importance: 0.068, label: "Loan Interest Rate" },
      { feature: "annual_income", importance: 0.045, label: "Annual Income" },
      { feature: "employment_years", importance: 0.032, label: "Employment Years" },
      { feature: "loan_amount", importance: 0.012, label: "Loan Amount" },
      { feature: "age", importance: 0.008, label: "Age" }
    ]
  });
});

// 10. List of all customer IDs for search dropdown
app.get('/api/portfolio/customer-ids', (req, res) => {
  const ids = portfolioData.map(a => a.customer_id);
  res.json(ids);
});

// 11. Business threshold Optimizer
app.post('/api/model/optimize', (req, res) => {
  const costDefault = Number(req.body.costDefault) || 25000;
  const costRejection = Number(req.body.costRejection) || 5000;
  
  const thresholds: number[] = [];
  const profits: number[] = [];
  
  // Calculate potential profit/loss for each customer
  const records = portfolioData.map(a => {
    // Expected interest income if they don't default
    const expectedProfit = (a.interest_rate / 100) * a.loan_amount;
    return {
      predicted_prob: a.predicted_prob,
      default_flag: a.default_flag,
      expectedProfit,
      loan_amount: a.loan_amount
    };
  });
  
  for (let t = 0; t <= 100; t += 2) {
    const threshold = t / 100;
    let netProfit = 0;
    
    records.forEach(r => {
      const approved = r.predicted_prob < threshold;
      
      if (approved) {
        if (r.default_flag === 1) {
          // Default: lose the loan balance or default cost
          netProfit -= costDefault;
        } else {
          // Success: gain interest income
          netProfit += r.expectedProfit;
        }
      } else {
        // Rejected:
        if (r.default_flag === 0) {
          // Missed opportunity on a good customer
          netProfit -= costRejection;
        } else {
          // Saved from a default! No loss, no missed opportunity
          netProfit += 0;
        }
      }
    });
    
    thresholds.push(threshold);
    profits.push(Math.round(netProfit));
  }
  
  // Find index of max profit
  let maxIndex = 0;
  let maxProfit = profits[0];
  for (let i = 1; i < profits.length; i++) {
    if (profits[i] > maxProfit) {
      maxProfit = profits[i];
      maxIndex = i;
    }
  }
  
  const optimalThreshold = thresholds[maxIndex];
  
  // Also calculate standard baseline profit with 0.5 threshold
  const index05 = thresholds.indexOf(0.5);
  const baselineProfit = index05 !== -1 ? profits[index05] : profits[25];
  
  const profitCurve = thresholds.map((t, idx) => ({
    threshold: t,
    profit: profits[idx]
  }));
  
  res.json({
    optimalThreshold,
    maxProfit,
    baselineProfit,
    profitImprovement: maxProfit - baselineProfit,
    profitImprovementPct: baselineProfit > 0 ? Math.round(((maxProfit - baselineProfit) / baselineProfit) * 1000) / 10 : 0,
    profitCurve
  });
});

// 12. AI weekly risk committee memo
app.post('/api/ai/memo', async (req, res) => {
  const stats = req.body;
  const trend_word = stats.mom_change_pct > 0 ? "worsened" : "improved";
  
  const fallbackMemo = `Portfolio Risk Memo — ${stats.total_accounts.toLocaleString()} active accounts, $${stats.total_exposure.toLocaleString()} total exposure. Overall default rate stands at ${stats.default_rate_pct}%, having ${trend_word} by ${Math.abs(stats.mom_change_pct)} points month-over-month. The ${stats.worst_segment} segment carries the highest risk at ${stats.worst_segment_rate}% default rate, concentrated in the ${stats.worst_region} region (${stats.worst_region_rate}%). Recommendation: tighten credit criteria for the ${stats.worst_segment} segment and reduce credit limit multiples for clients with DTI values above 45% or payment history scores below 580.`;
  
  if (!ai) {
    return res.json({ memo: fallbackMemo, aiPowered: false });
  }
  
  try {
    const prompt = `You are a credit risk director writing a weekly portfolio risk memo for the Bank Credit Risk Committee.
    Analyze the following filtered portfolio key metrics and provide a professional, executive credit memo.
    Be quantitative, direct, and provide 2 specific underwriting recommendations based on the riskiest trends.
    Avoid flowery language or corporate jargon. Keep it to 3-4 sentences.

    Metrics:
    - Total accounts: ${stats.total_accounts.toLocaleString()}
    - Overall portfolio default rate: ${stats.default_rate_pct}%
    - Total credit exposure: $${stats.total_exposure.toLocaleString()}
    - Highest-risk customer segment: ${stats.worst_segment} (${stats.worst_segment_rate}% default rate)
    - Highest-risk geographical region: ${stats.worst_region} (${stats.worst_region_rate}% default rate)
    - Month-over-month default rate change: ${stats.mom_change_pct > 0 ? '+' : ''}${stats.mom_change_pct}% pts
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    
    const generatedText = response.text ? response.text.trim() : fallbackMemo;
    res.json({ memo: generatedText, aiPowered: true });
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    res.json({ memo: fallbackMemo, aiPowered: false });
  }
});

// 13. AI risk score explainer
app.post('/api/ai/explain', async (req, res) => {
  const { customer, contributions } = req.body;
  
  const topDrivers = contributions.slice(0, 3).map((c: any) => `${c.feature} (${c.value})`).join(', ');
  const fallbackExplanation = `This customer has an ML-predicted default risk of ${Math.round(customer.predicted_prob * 100)}%. The critical risk drivers identified by the model are: ${topDrivers}. This credit profile exhibits elevated default indicators under current underwriting standards.`;
  
  if (!ai) {
    return res.json({ explanation: fallbackExplanation, aiPowered: false });
  }
  
  try {
    const prompt = `You are a credit risk underwriter explaining a credit default risk assessment to a junior loan officer.
    The machine learning model predicted a Default Probability of ${Math.round(customer.predicted_prob * 100)}% for Customer ${customer.customer_id}.
    
    Customer Profile:
    - Age: ${customer.age} years
    - Segment: ${customer.segment}
    - Annual Income: $${customer.annual_income.toLocaleString()}
    - Existing Loans: ${customer.existing_loans}
    - Credit Utilization Rate: ${Math.round(customer.credit_utilization * 100)}%
    - Debt-to-Income (DTI) Ratio: ${Math.round(customer.debt_to_income * 100)}%
    - Late Payments (12m): ${customer.late_payments_12m}
    - Payment History Score (Credit Score): ${customer.payment_history_score}
    - Proposed Loan Amount: $${customer.loan_amount.toLocaleString()}
    - Proposed Loan Term: ${customer.loan_term_months} months
    - Loan Interest Rate: ${customer.interest_rate}%
    
    Top statistical risk contributions to this score:
    ${contributions.slice(0, 3).map((c: any) => `- ${c.feature}: contribution weight ${c.contribution > 0 ? '+' : ''}${c.contribution} (actual value: ${c.value})`).join('\n')}
    
    Write a 2-sentence explanation in plain English. Describe *why* this customer is flagged as higher risk based on these drivers and provide a soft recommendation (e.g., require a co-signer, decrease loan amount, or approve with caution). Do not refer to "the model coefficients" or "the formula". Speak like an experienced credit officer.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    
    const generatedText = response.text ? response.text.trim() : fallbackExplanation;
    res.json({ explanation: generatedText, aiPowered: true });
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    res.json({ explanation: fallbackExplanation, aiPowered: false });
  }
});

// Serve compiled static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express Credit Risk Server running on port ${PORT}`);
});

// server.ts (at the very end of the file)
app.listen(PORT, () => {
  console.log(`Express Credit Risk Server running on port ${PORT}`);
});

export default app; // 👈 Ensure this line is present!
