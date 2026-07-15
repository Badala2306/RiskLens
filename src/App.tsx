import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  User,
  Sliders,
  DollarSign,
  TrendingDown,
  RefreshCw,
  Search,
  Sparkles,
  Award,
  Settings,
  HelpCircle,
  FileText,
  Percent,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'optimizer' | 'model' | 'simulator' | 'lookup' | 'memo'>('overview');

  // Sidebar Filter States
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['Retail', 'Small Business', 'Premium', 'Student']);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['North', 'South', 'East', 'West', 'Central']);
  const [selectedScoreBands, setSelectedScoreBands] = useState<string[]>(['Excellent (750+)', 'Good (650-749)', 'Fair (550-649)', 'Poor (<550)']);

  // Shared Data States
  const [stats, setStats] = useState<any>(null);
  const [segmentStats, setSegmentStats] = useState<any[]>([]);
  const [regionStats, setRegionStats] = useState<any[]>([]);
  const [utilizationStats, setUtilizationStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [scoreStats, setScoreStats] = useState<any[]>([]);
  const [highRiskAccounts, setHighRiskAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Model Metrics State
  const [metrics, setMetrics] = useState<any>(null);

  // Optimizer States
  const [costDefault, setCostDefault] = useState<number>(25000);
  const [costRejection, setCostRejection] = useState<number>(5000);
  const [optimizerResults, setOptimizerResults] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);

  // Customer Lookup States
  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [searchId, setSearchId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerContributions, setCustomerContributions] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [explaining, setExplaining] = useState(false);
  const [explanationAiPowered, setExplanationAiPowered] = useState(false);

  // AI Memo States
  const [aiMemo, setAiMemo] = useState<string>('');
  const [generatingMemo, setGeneratingMemo] = useState(false);
  const [memoAiPowered, setMemoAiPowered] = useState(false);

  // What-If Simulator States
  const [simAge, setSimAge] = useState<number>(35);
  const [simIncome, setSimIncome] = useState<number>(65000);
  const [simCreditScore, setSimCreditScore] = useState<number>(680);
  const [simUtilization, setSimUtilization] = useState<number>(35); // in %
  const [simDti, setSimDti] = useState<number>(28); // in %
  const [simLatePayments, setSimLatePayments] = useState<number>(0);
  const [simEmployment, setSimEmployment] = useState<number>(6);
  const [simLoanAmount, setSimLoanAmount] = useState<number>(15000);
  const [simInterestRate, setSimInterestRate] = useState<number>(11.5);
  const [simResult, setSimResult] = useState<any>(null);

  // Constants
  const segmentsList = ['Retail', 'Small Business', 'Premium', 'Student'];
  const regionsList = ['North', 'South', 'East', 'West', 'Central'];
  const scoreBandsList = ['Excellent (750+)', 'Good (650-749)', 'Fair (550-649)', 'Poor (<550)'];

  // Toggle filter item
  const toggleSegment = (seg: string) => {
    setSelectedSegments(prev =>
      prev.includes(seg) ? prev.filter(item => item !== seg) : [...prev, seg]
    );
  };

  const toggleRegion = (reg: string) => {
    setSelectedRegions(prev =>
      prev.includes(reg) ? prev.filter(item => item !== reg) : [...prev, reg]
    );
  };

  const toggleScoreBand = (band: string) => {
    setSelectedScoreBands(prev =>
      prev.includes(band) ? prev.filter(item => item !== band) : [...prev, band]
    );
  };

  // Build query string
  const getQueryString = () => {
    const params = new URLSearchParams();
    selectedSegments.forEach(s => params.append('segments', s));
    selectedRegions.forEach(r => params.append('regions', r));
    selectedScoreBands.forEach(b => params.append('scoreBands', b));
    return params.toString();
  };

  // Fetch core analytics based on active filters
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const qs = getQueryString();
      const [resStats, resSeg, resReg, resUtil, resTrend, resScore, resHighRisk] = await Promise.all([
        fetch(`/api/portfolio/stats?${qs}`).then(r => r.json()),
        fetch(`/api/portfolio/segment-stats?${qs}`).then(r => r.json()),
        fetch(`/api/portfolio/region-stats?${qs}`).then(r => r.json()),
        fetch(`/api/portfolio/utilization-stats?${qs}`).then(r => r.json()),
        fetch(`/api/portfolio/trend-stats?${qs}`).then(r => r.json()),
        fetch(`/api/portfolio/score-stats?${qs}`).then(r => r.json()),
        fetch('/api/portfolio/high-risk-accounts').then(r => r.json())
      ]);

      setStats(resStats);
      setSegmentStats(resSeg);
      setRegionStats(resReg);
      setUtilizationStats(resUtil);
      setTrendStats(resTrend);
      setScoreStats(resScore);
      setHighRiskAccounts(resHighRisk);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch static model metrics on mount
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/portfolio/metrics').then(r => r.json());
      setMetrics(res);
    } catch (err) {
      console.error('Error fetching model metrics:', err);
    }
  };

  // Fetch customer IDs list for search
  const fetchCustomerIds = async () => {
    try {
      const res = await fetch('/api/portfolio/customer-ids').then(r => r.json());
      setCustomerIds(res);
      if (res.length > 0) {
        setSearchId(res[0]);
      }
    } catch (err) {
      console.error('Error fetching customer IDs:', err);
    }
  };

  // Run business threshold optimizer
  const runOptimizer = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/model/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costDefault, costRejection })
      }).then(r => r.json());
      setOptimizerResults(res);
    } catch (err) {
      console.error('Error optimizing threshold:', err);
    } finally {
      setOptimizing(false);
    }
  };

  // Search a single customer
  const handleCustomerSearch = async (custId: string) => {
    if (!custId) return;
    setLookupLoading(true);
    setAiExplanation('');
    try {
      const res = await fetch(`/api/portfolio/lookup/${custId}`).then(r => r.json());
      if (res.error) {
        alert(res.error);
        return;
      }
      setSelectedCustomer(res.customer);
      setCustomerContributions(res.contributions);
    } catch (err) {
      console.error('Error fetching customer data:', err);
    } finally {
      setLookupLoading(false);
    }
  };

  // Generate AI Weekly Memo
  const generateMemo = async () => {
    if (!stats || segmentStats.length === 0 || regionStats.length === 0) return;
    setGeneratingMemo(true);
    setAiMemo('');
    
    // Find worst segment and region
    const worstSeg = segmentStats[0];
    const worstReg = regionStats[0];
    
    // Calculate month over month change from trends
    let momChange = 0;
    if (trendStats.length >= 2) {
      momChange = Math.round((trendStats[trendStats.length - 1].default_rate_pct - trendStats[trendStats.length - 2].default_rate_pct) * 10) / 10;
    }

    try {
      const res = await fetch('/api/ai/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_accounts: stats.total_accounts,
          default_rate_pct: stats.default_rate_pct,
          total_exposure: stats.total_exposure,
          worst_segment: worstSeg ? worstSeg.segment : 'N/A',
          worst_segment_rate: worstSeg ? worstSeg.default_rate_pct : 0,
          worst_region: worstReg ? worstReg.region : 'N/A',
          worst_region_rate: worstReg ? worstReg.default_rate_pct : 0,
          mom_change_pct: momChange
        })
      }).then(r => r.json());
      setAiMemo(res.memo);
      setMemoAiPowered(res.aiPowered);
    } catch (err) {
      console.error('Error generating AI memo:', err);
    } finally {
      setGeneratingMemo(false);
    }
  };

  // Generate AI Customer Risk Explanation
  const generateExplanation = async () => {
    if (!selectedCustomer || customerContributions.length === 0) return;
    setExplaining(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: selectedCustomer,
          contributions: customerContributions
        })
      }).then(r => r.json());
      setAiExplanation(res.explanation);
      setExplanationAiPowered(res.aiPowered);
    } catch (err) {
      console.error('Error explaining customer risk:', err);
    } finally {
      setExplaining(false);
    }
  };

  // Run What-If Local risk predictor
  const calculateWhatIf = () => {
    // Recreate the exact backend risk scoring logic locally for absolute instantaneous UI feedback
    const normScore = simCreditScore;
    const normUtil = simUtilization / 100;
    const normDti = simDti / 100;
    const normLate = simLatePayments;
    const normIncome = simIncome;
    const normEmployment = simEmployment;
    const normRate = simInterestRate;

    const z = -1.5
      + (1 - normScore / 850) * 4.4
      + normUtil * 3.1
      + normDti * 2.5
      + normLate * 0.75
      + (normRate / 30) * 1.3
      - (normIncome / 150000) * 1.0
      - (normEmployment / 30) * 0.7;

    const predicted_prob = Math.round((1 / (1 + Math.exp(-z))) * 1000) / 1000;
    
    let recommendation = 'Approved';
    let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    let rawColor = 'emerald';
    
    if (predicted_prob >= 0.40) {
      recommendation = 'Rejected';
      color = 'text-rose-600 bg-rose-50 border-rose-200';
      rawColor = 'rose';
    } else if (predicted_prob >= 0.18) {
      recommendation = 'Approve with Caution';
      color = 'text-amber-600 bg-amber-50 border-amber-200';
      rawColor = 'amber';
    }

    setSimResult({
      probability: predicted_prob,
      recommendation,
      color,
      rawColor
    });
  };

  // Run on mount
  useEffect(() => {
    fetchMetrics();
    fetchCustomerIds();
  }, []);

  // Run whenever filters change
  useEffect(() => {
    fetchAnalytics();
  }, [selectedSegments, selectedRegions, selectedScoreBands]);

  // Run optimizer when costs or stats change
  useEffect(() => {
    if (stats) {
      runOptimizer();
    }
  }, [costDefault, costRejection, stats]);

  // Run what-if whenever inputs change
  useEffect(() => {
    calculateWhatIf();
  }, [simAge, simIncome, simCreditScore, simUtilization, simDti, simLatePayments, simEmployment, simLoanAmount, simInterestRate]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Row */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-500 text-white p-2 rounded-lg font-bold tracking-tight text-xl flex items-center justify-center shadow-md shadow-rose-950/40">
            RL
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              RiskLens <span className="ml-2 text-xs px-2 py-0.5 bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30 rounded-full">CREDIT RISK INTEL</span>
            </h1>
            <p className="text-xs text-slate-400">Risk Monitoring, Predictive ML Model Validation & AI Automation Engine</p>
          </div>
        </div>

        {/* Info indicators */}
        <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Production ML Core Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Gemini LLM Connected</span>
          </div>
          <div className="px-3 py-1 bg-slate-800 text-slate-300 font-mono rounded-md border border-slate-700">
            Model v1.8.0-Logistic
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Filter Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950/60 border-r border-slate-800 p-6 flex flex-col space-y-6 shrink-0">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
              <Settings className="w-3.5 h-3.5 mr-1.5" /> Core Parameters
            </h2>
            <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              Filter the portfolio database below. All visualizations, statistics, and expected profit optimizations update instantly.
            </div>
          </div>

          {/* Segment Selector */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>Segment</span>
              <button 
                onClick={() => setSelectedSegments(selectedSegments.length === segmentsList.length ? [] : segmentsList)} 
                className="text-[10px] text-rose-400 hover:underline"
              >
                {selectedSegments.length === segmentsList.length ? 'Clear All' : 'Select All'}
              </button>
            </h3>
            <div className="space-y-1.5">
              {segmentsList.map(seg => (
                <label key={seg} className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(seg)}
                    onChange={() => toggleSegment(seg)}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/30 w-4 h-4"
                  />
                  <span>{seg}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Region Selector */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>Region</span>
              <button 
                onClick={() => setSelectedRegions(selectedRegions.length === regionsList.length ? [] : regionsList)} 
                className="text-[10px] text-rose-400 hover:underline"
              >
                {selectedRegions.length === regionsList.length ? 'Clear All' : 'Select All'}
              </button>
            </h3>
            <div className="space-y-1.5">
              {regionsList.map(reg => (
                <label key={reg} className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(reg)}
                    onChange={() => toggleRegion(reg)}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/30 w-4 h-4"
                  />
                  <span>{reg}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Credit Score Band Selector */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>Credit Quality Band</span>
              <button 
                onClick={() => setSelectedScoreBands(selectedScoreBands.length === scoreBandsList.length ? [] : scoreBandsList)} 
                className="text-[10px] text-rose-400 hover:underline"
              >
                {selectedScoreBands.length === scoreBandsList.length ? 'Clear All' : 'Select All'}
              </button>
            </h3>
            <div className="space-y-1.5">
              {scoreBandsList.map(band => (
                <label key={band} className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedScoreBands.includes(band)}
                    onChange={() => toggleScoreBand(band)}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/30 w-4 h-4"
                  />
                  <span>{band}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            <p>Database: <span className="font-mono text-slate-400">credit_risk.db</span></p>
            <p className="mt-1">Records: <span className="font-mono text-slate-400">2,000 active</span></p>
            <p className="mt-1">Last Sync: <span className="font-mono text-slate-400">Real-time</span></p>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-6 lg:p-8 flex flex-col space-y-6 overflow-x-hidden">
          
          {/* Filter Status Info Line (if nothing selected) */}
          {(!selectedSegments.length || !selectedRegions.length || !selectedScoreBands.length) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3 text-amber-200 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>You have cleared some filter dimensions. Please check at least one option in each filter category in the sidebar to visualize portfolio data.</span>
            </div>
          )}

          {/* Quick Metrics Row */}
          {stats && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Exposure</p>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-white mt-1">${stats.total_exposure.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Sum of filtered active accounts</p>
                </div>
                <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-lg border border-blue-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Portfolio Default Rate</p>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-rose-400 mt-1">{stats.default_rate_pct}%</h3>
                  <p className="text-[10px] text-slate-500 mt-1">{stats.total_defaults} accounts defaulted</p>
                </div>
                <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Exposure at Default (EAD)</p>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-200 mt-1">${stats.exposure_at_default.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Capital loss on defaulted portfolio</p>
                </div>
                <div className="bg-slate-800 text-slate-300 p-2.5 rounded-lg border border-slate-700">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Avg Credit Score</p>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-emerald-400 mt-1">{stats.avg_payment_score}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Payment history rating (300-850)</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/20">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </section>
          )}

          {/* Navigation Tabs Bar */}
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex flex-wrap gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 ${activeTab === 'overview' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>📊 Portfolio Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 ${activeTab === 'optimizer' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="flex items-center">
                📈 Profit Optimizer
                <span className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 bg-rose-500/15 text-rose-400 rounded-full border border-rose-500/30">BUSINESS</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('model')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 ${activeTab === 'model' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>🤖 Model Validation</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 ${activeTab === 'simulator' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>🔮 What-If Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 ${activeTab === 'lookup' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>🔍 Customer Lookup</span>
            </button>
            <button
              onClick={() => setActiveTab('memo')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 ${activeTab === 'memo' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="flex items-center">
                📝 AI Risk Memo
                <span className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 bg-rose-500/15 text-rose-400 rounded-full border border-rose-500/30 flex items-center space-x-0.5">
                  <Sparkles className="w-2 h-2" />
                  <span>GEMINI</span>
                </span>
              </span>
            </button>
          </div>

          {/* TAB 1: Portfolio Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Row charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Default rate by segment */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[320px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Default Rate by Customer Segment</h3>
                    <p className="text-xs text-slate-400">Segment defaults compared to total exposure</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={segmentStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="segment" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => `${tick}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${value}%`, 'Default Rate']}
                        />
                        <Bar dataKey="default_rate_pct" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Default rate by region */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[320px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Default Rate by Region</h3>
                    <p className="text-xs text-slate-400">Concentration of portfolio default risk by region</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="region" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => `${tick}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${value}%`, 'Default Rate']}
                        />
                        <Bar dataKey="default_rate_pct" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Middle Row Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Monthly Application Trend */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[320px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Monthly Default Rate Trend</h3>
                    <p className="text-xs text-slate-400">Chronological trend over the last 24 months of loans</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => `${tick}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${value}%`, 'Default Rate']}
                        />
                        <Line type="monotone" dataKey="default_rate_pct" stroke="#e11d48" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Risk Banding by Utilization */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[320px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Risk Banding by Credit Utilization</h3>
                    <p className="text-xs text-slate-400">Empirical default rate across behavioral credit utilization bands</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={utilizationStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="utilization_band" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => `${tick}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${value}%`, 'Default Rate']}
                        />
                        <Bar dataKey="default_rate_pct" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Row - High Risk Accounts */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top 10 Flagged Active Accounts (Potential Default Risk)</h3>
                    <p className="text-xs text-slate-400">Current active accounts ranked by model predictive risk, requiring aggressive underwriting review</p>
                  </div>
                  <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-semibold">
                    HIGH-RISK ACTION QUEUE
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-3 px-4">Customer ID</th>
                        <th className="py-3 px-4">Segment</th>
                        <th className="py-3 px-4">Region</th>
                        <th className="py-3 px-4 text-right">Credit Util</th>
                        <th className="py-3 px-4 text-right">DTI</th>
                        <th className="py-3 px-4 text-right">Credit Score</th>
                        <th className="py-3 px-4 text-right">Loan Amount</th>
                        <th className="py-3 px-4 text-right">Predict Risk</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {highRiskAccounts.slice(0, 10).map(acc => (
                        <tr key={acc.customer_id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-white">{acc.customer_id}</td>
                          <td className="py-2.5 px-4">{acc.segment}</td>
                          <td className="py-2.5 px-4 text-slate-400">{acc.region}</td>
                          <td className="py-2.5 px-4 text-right text-rose-400">{Math.round(acc.credit_utilization * 100)}%</td>
                          <td className="py-2.5 px-4 text-right text-amber-400">{Math.round(acc.debt_to_income * 100)}%</td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold">{acc.payment_history_score}</td>
                          <td className="py-2.5 px-4 text-right font-semibold">${acc.loan_amount.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              {(acc.predicted_prob * 100).toFixed(1)}% Risk
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setSearchId(acc.customer_id);
                                handleCustomerSearch(acc.customer_id);
                                setActiveTab('lookup');
                              }}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white px-2 py-1 rounded text-slate-300 font-medium flex items-center mx-auto"
                            >
                              <span>Audit Profile</span>
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Business Threshold Optimizer */}
          {activeTab === 'optimizer' && (
            <div className="space-y-6">
              
              {/* Top Intro Section */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-rose-500" /> Model Profit & Loss (P&L) Threshold Optimizer
                  </h3>
                  <p className="text-sm text-slate-300">
                    Standard ML models output probabilities, but businesses make binary decisions (approve/reject). Instead of using a blind, standard 0.5 decision threshold, this tool calculates the optimal threshold that maximizes portfolio expected net profit based on cost of a default versus cost of rejection (lost interest opportunity).
                  </p>
                </div>
                
                {/* Cost Sliders Box */}
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-4 shrink-0 min-w-[260px]">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                      <span>Cost per Default (loss on loan)</span>
                      <span className="text-rose-400 font-bold">${costDefault.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={5000}
                      max={80000}
                      step={1000}
                      value={costDefault}
                      onChange={(e) => setCostDefault(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                      <span>Cost per Rejection (missed opportunity)</span>
                      <span className="text-amber-400 font-bold">${costRejection.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={1000}
                      max={15000}
                      step={250}
                      value={costRejection}
                      onChange={(e) => setCostRejection(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Optimizer Outcome KPI Cards */}
              {optimizerResults && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Optimal Decision Cutoff</p>
                      <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">
                        {(optimizerResults.optimalThreshold * 100).toFixed(0)}% <span className="text-xs font-normal text-slate-400">Risk Threshold</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        Approve applications with predicted risk <span className="font-semibold">less than {(optimizerResults.optimalThreshold * 100).toFixed(0)}%</span>. Reject others. This minimizes potential default costs while saving interest income.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Net Max Portfolio Profit</p>
                      <h3 className="text-3xl font-extrabold text-white mt-2">
                        ${optimizerResults.maxProfit.toLocaleString()}
                      </h3>
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        Baseline profit at blind 0.5 threshold: <span className="font-semibold text-slate-400">${optimizerResults.baselineProfit.toLocaleString()}</span>. Utilizing this dynamic cutoff boosts profit.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Risk-Adjusted Value Added</p>
                      <h3 className="text-3xl font-extrabold text-rose-400 mt-2">
                        +${optimizerResults.profitImprovement.toLocaleString()}
                      </h3>
                      <div className="mt-3 flex items-center space-x-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg p-2 text-xs">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Dynamic P&L optimization increases returns by <strong className="font-bold">{optimizerResults.profitImprovementPct}%</strong> over a static 0.5 ML threshold.</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Profit Curve Visualization */}
              {optimizerResults && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col h-[350px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Net Portfolio Profit Curve by Risk Threshold</h3>
                    <p className="text-xs text-slate-400">Profit peaks at the mathematically optimal decision cutoff point</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={optimizerResults.profitCurve} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="threshold" stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => `$${(tick / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          labelFormatter={(label) => `Decision Threshold: ${(label * 100).toFixed(0)}%`}
                          formatter={(value: any) => [`$${value.toLocaleString()}`, 'Net Profit']}
                        />
                        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                        <ReferenceLine x={optimizerResults.optimalThreshold} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `Optimal Cutoff: ${(optimizerResults.optimalThreshold * 100).toFixed(0)}%`, position: 'top', fill: '#f43f5e', fontSize: 10 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Model Validation */}
          {activeTab === 'model' && (
            <div className="space-y-6">
              
              {/* Performance Summary Grid */}
              {metrics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Logistic Regression Card */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-300">Logistic Regression</h4>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          PRODUCTION CHAMPION
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Evaluated on a 25% stratified test split. The champion model due to higher overall ROC-AUC performance and balanced predictive metrics.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">ROC-AUC</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[0].roc_auc}</h5>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Recall</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[0].recall}</h5>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Precision</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[0].precision}</h5>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">F1-Score</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[0].f1}</h5>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Random Forest Card */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-300">Random Forest Classifier</h4>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          CHALLENGER
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Tuned with 300 estimators, max depth of 8, and balanced class weights. Evaluated alongside the Logistic core.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">ROC-AUC</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[1].roc_auc}</h5>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Recall</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[1].recall}</h5>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Precision</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[1].precision}</h5>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          <p className="text-[10px] font-medium text-slate-400 uppercase">F1-Score</p>
                          <h5 className="text-lg font-bold text-white mt-1">{metrics.results[1].f1}</h5>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confusion Matrix Card */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-300 mb-3">Logistic Confusion Matrix</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Visualizing actual default vs predicted default outcomes (0.5 prediction cut-off threshold on test split).
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 font-mono text-center text-xs">
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-sans">True Neg (TN)</p>
                          <p className="text-base font-bold text-emerald-400 mt-1">{metrics.results[0].confusion_matrix.tn}</p>
                          <span className="text-[8px] text-slate-500">Correct Approvals</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-sans">False Pos (FP)</p>
                          <p className="text-base font-bold text-rose-400 mt-1">{metrics.results[0].confusion_matrix.fp}</p>
                          <span className="text-[8px] text-slate-500">Unsafe Approvals</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-sans">False Neg (FN)</p>
                          <p className="text-base font-bold text-amber-400 mt-1">{metrics.results[0].confusion_matrix.fn}</p>
                          <span className="text-[8px] text-slate-500">Missed Interests</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-sans">True Pos (TP)</p>
                          <p className="text-base font-bold text-emerald-400 mt-1">{metrics.results[0].confusion_matrix.tp}</p>
                          <span className="text-[8px] text-slate-500">Correct Rejections</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Feature Importance Row */}
              {metrics && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col h-[380px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Global Credit Risk Drivers (Feature Importance)</h3>
                    <p className="text-xs text-slate-400">How much weight the machine learning model assigns to each risk driver globally</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={metrics.feature_importance} 
                        layout="vertical"
                        margin={{ top: 5, right: 15, left: 35, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                        <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Weight / Influence']}
                        />
                        <Bar dataKey="importance" fill="#ec4899" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: What-If Simulator */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col lg:flex-row gap-8">
                
                {/* Input Parameters Box */}
                <div className="flex-1 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Applicant Credit Attributes</h3>
                    <p className="text-xs text-slate-400 mt-1">Adjust individual attributes to see the simulated default risk update in real-time</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Income */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Annual Income ($)</span>
                        <span className="text-slate-400 font-mono font-bold">${simIncome.toLocaleString()}</span>
                      </label>
                      <input
                        type="range"
                        min={15000}
                        max={250000}
                        step={1000}
                        value={simIncome}
                        onChange={(e) => setSimIncome(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Credit Score */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Payment History Score (FICO)</span>
                        <span className="text-slate-400 font-mono font-bold">{simCreditScore}</span>
                      </label>
                      <input
                        type="range"
                        min={300}
                        max={850}
                        step={5}
                        value={simCreditScore}
                        onChange={(e) => setSimCreditScore(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Utilization */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Credit Utilization Ratio (%)</span>
                        <span className="text-slate-400 font-mono font-bold">{simUtilization}%</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={simUtilization}
                        onChange={(e) => setSimUtilization(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* DTI */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Debt-to-Income (DTI) Ratio (%)</span>
                        <span className="text-slate-400 font-mono font-bold">{simDti}%</span>
                      </label>
                      <input
                        type="range"
                        min={2}
                        max={110}
                        step={1}
                        value={simDti}
                        onChange={(e) => setSimDti(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Late Payments */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Late Payments (Last 12m)</span>
                        <span className="text-slate-400 font-mono font-bold">{simLatePayments}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={simLatePayments}
                        onChange={(e) => setSimLatePayments(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Employment */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Employment Years</span>
                        <span className="text-slate-400 font-mono font-bold">{simEmployment} years</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={1}
                        value={simEmployment}
                        onChange={(e) => setSimEmployment(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Loan Amount */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Proposed Loan Amount ($)</span>
                        <span className="text-slate-400 font-mono font-bold">${simLoanAmount.toLocaleString()}</span>
                      </label>
                      <input
                        type="range"
                        min={1000}
                        max={300000}
                        step={5000}
                        value={simLoanAmount}
                        onChange={(e) => setSimLoanAmount(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1.5">
                        <span>Offered Interest Rate (%)</span>
                        <span className="text-slate-400 font-mono font-bold">{simInterestRate}%</span>
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={30}
                        step={0.5}
                        value={simInterestRate}
                        onChange={(e) => setSimInterestRate(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                  </div>
                </div>

                {/* Simulated Outcome Display */}
                {simResult && (
                  <div className="w-full lg:w-80 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between text-center space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Simulated Outcome</h4>
                      <p className="text-xs text-slate-500">Calculated instantly by Logistic Core</p>
                    </div>

                    <div className="py-4 space-y-2">
                      <p className="text-xs text-slate-400">Expected Probability of Default</p>
                      <h3 className={`text-5xl font-extrabold tracking-tight ${simResult.rawColor === 'rose' ? 'text-rose-400' : simResult.rawColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {(simResult.probability * 100).toFixed(1)}%
                      </h3>
                      
                      {/* Meter bar */}
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-3 border border-slate-700/50">
                        <div 
                          className={`h-full ${simResult.rawColor === 'rose' ? 'bg-rose-500' : simResult.rawColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, simResult.probability * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border text-sm font-bold ${simResult.color}`}>
                      <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1">Recommended Decision</p>
                      <p className="text-base font-extrabold">{simResult.recommendation}</p>
                    </div>

                    <div className="text-[10px] text-slate-500 leading-relaxed text-left bg-slate-950 p-2.5 rounded border border-slate-800/40">
                      <strong>Audit Note:</strong> Standard threshold is set to 50%. The model optimal profit-focused threshold is {(optimizerResults?.optimalThreshold * 100).toFixed(0)}%. Any applicant above the threshold should be reviewed with severe caution.
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 5: Customer Lookup */}
          {activeTab === 'lookup' && (
            <div className="space-y-6">
              
              {/* Search bar */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Individual Customer Risk Profiler & Explainer</h3>
                  <p className="text-xs text-slate-400">Search any active or defaulted customer account to analyze local risk contributions and get an AI audit narrative</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="relative w-48">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. CUST100025"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                      className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 w-full font-mono font-semibold"
                    />
                  </div>
                  <button
                    onClick={() => handleCustomerSearch(searchId)}
                    disabled={lookupLoading}
                    className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
                  >
                    <span>Analyze</span>
                  </button>
                </div>
              </div>

              {selectedCustomer ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column - Customer Details */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono">{selectedCustomer.customer_id}</h4>
                          <span className="text-[10px] text-slate-400">Application Date: {selectedCustomer.application_date}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${selectedCustomer.default_flag === 1 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                          {selectedCustomer.default_flag === 1 ? 'DEFAULTED' : 'ACTIVE / CURRENT'}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Age</span>
                          <span className="font-semibold text-slate-200">{selectedCustomer.age} years</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Segment</span>
                          <span className="font-semibold text-slate-200">{selectedCustomer.segment}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Region</span>
                          <span className="font-semibold text-slate-200">{selectedCustomer.region}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Annual Income</span>
                          <span className="font-semibold text-emerald-400">${selectedCustomer.annual_income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Payment Score (FICO)</span>
                          <span className="font-semibold text-slate-200">{selectedCustomer.payment_history_score}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Credit Utilization</span>
                          <span className="font-semibold text-rose-400">{Math.round(selectedCustomer.credit_utilization * 100)}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">DTI Ratio</span>
                          <span className="font-semibold text-amber-400">{Math.round(selectedCustomer.debt_to_income * 100)}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Late Payments (12m)</span>
                          <span className="font-semibold text-slate-200">{selectedCustomer.late_payments_12m}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Proposed Loan</span>
                          <span className="font-semibold text-slate-200">${selectedCustomer.loan_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Interest Rate</span>
                          <span className="font-semibold text-slate-200">{selectedCustomer.interest_rate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Predicted Default Probability</p>
                      <h4 className="text-2xl font-black text-rose-400">{(selectedCustomer.predicted_prob * 100).toFixed(1)}%</h4>
                    </div>
                  </div>

                  {/* Middle Column - Local SHAP Feature Contribution Chart */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[400px] lg:col-span-2">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Predictive Feature Contributions (Local SHAP Values)</h3>
                      <p className="text-xs text-slate-400">How much each feature shifted this customer's risk probability relative to the average portfolio baseline</p>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={customerContributions}
                          layout="vertical"
                          margin={{ top: 5, right: 15, left: 45, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                          <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                            labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                            formatter={(value: any) => [`${value > 0 ? '+' : ''}${value}`, 'Risk Contribution Weight']}
                          />
                          <Bar 
                            dataKey="contribution" 
                            radius={[4, 4, 4, 4]}
                          >
                            {customerContributions.map((entry, index) => (
                              <rect
                                key={`rect-${index}`}
                                fill={entry.contribution > 0 ? '#f43f5e' : '#10b981'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Explainer Narrative trigger */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">AI-generated underwriting narrative explains this risk structure in plain English.</p>
                      <button
                        onClick={generateExplanation}
                        disabled={explaining}
                        className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{explaining ? 'Analyzing...' : 'Generate AI Risk Explanation'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-slate-950 p-12 rounded-xl border border-slate-800 text-center text-slate-400">
                  <User className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p>Please enter a customer ID in the search box above to audit individual risk profiles and get SHAP waterfall metrics.</p>
                </div>
              )}

              {/* Render AI explanation */}
              {aiExplanation && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5 text-rose-500 animate-pulse" /> AI Underwriting Narrative for Customer {selectedCustomer.customer_id}
                    </h4>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${explanationAiPowered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {explanationAiPowered ? '🟢 Gemini 3.5 Flash Live' : '⚪ Offline Analytical Template'}
                    </span>
                  </div>
                  <blockquote className="text-sm text-slate-200 border-l-2 border-rose-500 pl-4 py-1.5 leading-relaxed font-serif italic">
                    {aiExplanation}
                  </blockquote>
                </div>
              )}

            </div>
          )}

          {/* TAB 6: AI Weekly Memo */}
          {activeTab === 'memo' && (
            <div className="space-y-6">
              
              {/* Trigger panel */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-rose-500" /> Automated Risk Committee Weekly Memo Generator
                  </h3>
                  <p className="text-xs text-slate-300">
                    Saves time for risk analysts by compiling current filtered metrics, identifying regional and segment concentration curves, tracking MoM trends, and summarizing underwriting recommendations into a pristine, committee-ready plain English memo.
                  </p>
                </div>

                <button
                  onClick={generateMemo}
                  disabled={generatingMemo || !stats}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-md flex items-center space-x-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{generatingMemo ? 'Synthesizing...' : 'Generate Committee Memo'}</span>
                </button>
              </div>

              {/* Render AI Memo */}
              {aiMemo ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">MEMORANDUM</h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">To: Bank Chief Risk Officer & Underwriting Policy Board</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${memoAiPowered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {memoAiPowered ? '🟢 Gemini 3.5 Flash Live' : '⚪ Offline Analytical Template'}
                    </span>
                  </div>

                  <div className="text-sm text-slate-200 font-serif leading-relaxed italic border-l-4 border-rose-500 pl-6 py-1">
                    {aiMemo}
                  </div>

                  <div className="text-xs text-slate-500 text-right uppercase tracking-wider font-semibold font-mono">
                    Prepared by RiskLens Intelligent Agent Core
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-12 rounded-xl border border-slate-800 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p>Click "Generate Committee Memo" to dynamically compile a comprehensive portfolio risk analysis using generative AI.</p>
                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
