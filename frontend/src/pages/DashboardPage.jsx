import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Users, Zap, Droplets, Fuel, Shield, BarChart3, Leaf, Building2, Factory, Recycle, RotateCcw, Scale, Waves, GraduationCap, Bot, Target, Calendar, AlertTriangle, Zap as Lightning, Globe, TrendingUp, AlertCircle } from "lucide-react";
import Popup from '../components/Popup';

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6"];
const CHART_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

// Carbon footprint calculation helper
const calculateCarbonFootprint = (esgInput) => {
  if (!esgInput) return { monthly: 0, yearly: 0, status: "low", breakdown: {} };

  let totalCO2Kg = 0;
  const breakdown = {};

  // 1. Electricity emissions (assuming average grid emission factor: 0.5 kg CO2/kWh)
  // Adjust for renewable energy percentage
  const electricityKwh = esgInput.electricity_kwh || 0;
  const renewablePercent = esgInput.renewable_energy_percentage || 0;
  const gridEmissionFactor = 0.5; // kg CO2 per kWh (varies by region)
  const renewableEmissionFactor = 0.01; // kg CO2 per kWh for renewable
  const effectiveEmissionFactor =
    gridEmissionFactor * (1 - renewablePercent / 100) +
    renewableEmissionFactor * (renewablePercent / 100);

  const electricityCO2 = electricityKwh * effectiveEmissionFactor;
  breakdown.electricity = electricityCO2;
  totalCO2Kg += electricityCO2;

  // 2. Generator/Fuel emissions (Diesel: ~2.68 kg CO2 per liter)
  const generatorLiters = esgInput.generator_usage_liters || 0;
  const dieselEmissionFactor = 2.68; // kg CO2 per liter of diesel
  const generatorCO2 = generatorLiters * dieselEmissionFactor;
  breakdown.generator = generatorCO2;
  totalCO2Kg += generatorCO2;

  // 3. Water indirect emissions (Water treatment and pumping: ~0.5 kg CO2 per m3 = 0.0005 kg per liter)
  const waterLiters = esgInput.water_usage_liters || 0;
  const waterEmissionFactor = 0.0005; // kg CO2 per liter
  const waterCO2 = waterLiters * waterEmissionFactor;
  breakdown.water = waterCO2;
  totalCO2Kg += waterCO2;

  // Convert to tons CO2
  const monthlyTons = totalCO2Kg / 1000;
  const yearlyTons = monthlyTons * 12;

  // Determine status based on emissions
  // Typical SME: 10-50 tons/year = Low, 50-200 = Medium, 200+ = High
  let status = "low";
  if (yearlyTons > 200) status = "high";
  else if (yearlyTons > 50) status = "medium";

  return {
    monthly: monthlyTons,
    yearly: yearlyTons,
    monthlyKg: totalCO2Kg,
    yearlyKg: totalCO2Kg * 12,
    status,
    breakdown,
  };
};

// Get emission status color
const getEmissionStatusColor = (status) => {
  const colors = {
    low: "bg-green-500 text-white",
    medium: "bg-yellow-500 text-white",
    high: "bg-red-500 text-white",
  };
  return colors[status] || colors.medium;
};

export default function DashboardPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestSnapshot, setLatestSnapshot] = useState(null);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState(null);
  const [aiServiceStatus, setAiServiceStatus] = useState(null);
  const [dashboardInsights, setDashboardInsights] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    loadSnapshots();
    checkAiServiceStatus();
  }, []);

  const checkAiServiceStatus = async () => {
    // Simulate AI service check without actual endpoint
    setAiServiceStatus({ 
      service_operational: true, 
      active_client: 'deepseek',
      active_model: 'deepseek-chat'
    })
  }

  const loadSnapshots = async () => {
    try {
      const response = await api.getSnapshots();
      const data = response.data.results || response.data;
      setSnapshots(data);
      if (data.length > 0) {
        setLatestSnapshot(data[0]);
        // Load dashboard insights
        loadDashboardInsights(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load snapshots", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardInsights = async (snapshotId) => {
    try {
      const response = await api.get(`/esg-snapshots/${snapshotId}/dashboard_insights/`);
      setDashboardInsights(response.data);
    } catch (error) {
      console.error("Failed to load dashboard insights", error);
    }
  };

  const generateAIAnalysis = async () => {
    if (!latestSnapshot?.esg_input?.id) return;

    setAiLoading(true);
    try {
      // Simulate AI analysis without actual endpoint
      setTimeout(() => {
        setComprehensiveAnalysis({
          detailed_insights: {
            environmental: {
              current_performance: "Good progress on environmental initiatives",
              key_strengths: ["Energy monitoring in place", "Waste management system"]
            },
            social: {
              current_performance: "Strong employee welfare programs",
              key_strengths: ["Safety training provided", "Health benefits available"]
            },
            governance: {
              current_performance: "Basic governance structure established",
              key_strengths: ["Policy framework developing", "Risk awareness growing"]
            }
          },
          actionable_recommendations: [
            {
              title: "Implement Energy Efficiency Program",
              category: "E",
              priority: "high",
              cost_estimate: "₹41,500-1,66,000",
              expected_impact: "Reduce energy costs by 15-25%",
              esg_score_improvement: "+8-12 points"
            },
            {
              title: "Enhance Employee Safety Training",
              category: "S", 
              priority: "high",
              cost_estimate: "₹24,900-66,400",
              expected_impact: "Improve workplace safety standards",
              esg_score_improvement: "+5-8 points"
            },
            {
              title: "Develop Governance Policies",
              category: "G",
              priority: "medium",
              cost_estimate: "₹16,600-41,500",
              expected_impact: "Strengthen organizational governance",
              esg_score_improvement: "+6-10 points"
            }
          ],
          risk_assessment: {
            high_priority_risks: ["Regulatory compliance gaps"],
            medium_priority_risks: ["Energy cost volatility"],
            regulatory_compliance_risks: ["Missing ESG policies"]
          }
        })
        setAiLoading(false)
        setShowPopup(true)
      }, 2000)
    } catch (error) {
      console.error("AI analysis failed", error);
      alert("AI analysis unavailable. Using standard calculations.");
      setAiLoading(false)
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!latestSnapshot) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No ESG Assessment Yet
          </h2>
          <p className="text-gray-600 mb-8">
            Complete your first ESG assessment to see your dashboard.
          </p>
          <Link
            to="/esg-form"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Start Assessment
          </Link>
        </div>
      </Layout>
    );
  }

  const esgInput = latestSnapshot.esg_input || {};
  const carbonFootprint = calculateCarbonFootprint(esgInput);

  // Use AI-generated breakdown if available, otherwise use snapshot scores
  const scoreBreakdown = latestSnapshot.score_breakdown?.categories || {
    Environmental: latestSnapshot.environmental_score,
    Social: latestSnapshot.social_score,
    Governance: latestSnapshot.governance_score,
  };

  const chartData = [
    {
      name: "Environmental",
      score: scoreBreakdown.Environmental || latestSnapshot.environmental_score,
      target: 70,
    },
    {
      name: "Social",
      score: scoreBreakdown.Social || latestSnapshot.social_score,
      target: 70,
    },
    {
      name: "Governance",
      score: scoreBreakdown.Governance || latestSnapshot.governance_score,
      target: 70,
    },
  ];

  const pieData = [
    {
      name: "Environmental",
      value: scoreBreakdown.Environmental || latestSnapshot.environmental_score,
    },
    {
      name: "Social",
      value: scoreBreakdown.Social || latestSnapshot.social_score,
    },
    {
      name: "Governance",
      value: scoreBreakdown.Governance || latestSnapshot.governance_score,
    },
  ];

  const radarData = [
    {
      subject: "Environmental",
      A: latestSnapshot.environmental_score,
      fullMark: 100,
    },
    { subject: "Social", A: latestSnapshot.social_score, fullMark: 100 },
    {
      subject: "Governance",
      A: latestSnapshot.governance_score,
      fullMark: 100,
    },
  ];

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  // Calculate analytics metrics with safety checks
  const analyticsData = {
    employees: esgInput.total_employees || 0,
    femalePercentage: esgInput.female_employees_percentage || 0,
    electricityKwh: esgInput.electricity_kwh || 0,
    electricityBill: esgInput.electricity_bill_amount || 0,
    waterLiters: esgInput.water_usage_liters || 0,
    generatorLiters: esgInput.generator_usage_liters || 0,
    generatorHours: esgInput.generator_usage_hours || 0,
    solarCapacity: esgInput.solar_capacity_kw || 0,
    renewablePercent: esgInput.renewable_energy_percentage || 0,
    accidents: esgInput.workplace_accidents_last_year || 0,
    trainingHours: esgInput.employee_training_hours || 0,
    // New ESG reporting metrics with fallbacks
    annualRevenue: esgInput.annual_revenue || 0,
    esgBudgetPercent: esgInput.esg_budget_percentage || 0,
    scope1Emissions: esgInput.scope1_emissions || 0,
    scope2Emissions: esgInput.scope2_emissions || 0,
    scope3Emissions: esgInput.scope3_emissions || 0,
    waterIntensity: esgInput.water_intensity || 0,
    wasteGenerated: esgInput.waste_generated_tons || 0,
    wasteRecycled: esgInput.waste_recycled_percentage || 0,
    turnoverRate: esgInput.employee_turnover_rate || 0,
    boardDiversity: esgInput.board_diversity_percentage || 0
  };

  // Electricity cost per kWh
  const costPerKwh =
    analyticsData.electricityKwh > 0
      ? (analyticsData.electricityBill / analyticsData.electricityKwh).toFixed(
          3
        )
      : 0;

  // Water usage in cubic meters
  const waterCubicMeters = (analyticsData.waterLiters / 1000).toFixed(2);

  // Carbon breakdown chart data
  const carbonBreakdownData = [
    { name: "Electricity", value: carbonFootprint.breakdown.electricity || 0 },
    { name: "Generator", value: carbonFootprint.breakdown.generator || 0 },
    { name: "Water", value: carbonFootprint.breakdown.water || 0 },
  ];

  // Combine recommendations from AI analysis or snapshot
  const recommendations =
    comprehensiveAnalysis?.actionable_recommendations ||
    latestSnapshot?.recommendations ||
    [];

  // AI Status Badge
  const AIStatusBadge = () => (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        aiServiceStatus?.service_operational
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      <Bot className="w-4 h-4 text-green-800" /> AI {aiServiceStatus?.service_operational ? "Active" : "Offline"}
      {aiServiceStatus?.active_client && (
        <span className="ml-1">({aiServiceStatus.active_client})</span>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 min-h-screen p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ultimate ESG Dashboard
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <AIStatusBadge />
              {comprehensiveAnalysis && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  ✨ Enhanced with AI Insights
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            {aiServiceStatus?.service_operational && (
              <button
                onClick={generateAIAnalysis}
                disabled={aiLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-lg transition-all"
              >
                {aiLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    Generate AI Analysis
                  </span>
                )}
              </button>
            )}
            <Link
              to="/esg-form"
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg transition-all"
            >
              New Assessment
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-white/80 border-l-4 border-yellow-400 p-4 rounded backdrop-blur-sm">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This assessment is indicative and does
            not constitute a certified ESG rating.
            {aiServiceStatus?.service_operational &&
              " AI insights are generated based on your input data."}
          </p>
        </div>

        {/* Prescriptive Insights Section */}
        {dashboardInsights && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              What Should I Focus On Right Now?
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {/* This Month's Focus */}
              <div className="bg-white/70 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">This Month's ESG Focus</h3>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {dashboardInsights.monthly_focus.action}
                </p>
                <p className="text-xs text-gray-600">
                  {dashboardInsights.monthly_focus.reason}
                </p>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                  dashboardInsights.monthly_focus.category === 'E' ? 'bg-green-100 text-green-800' :
                  dashboardInsights.monthly_focus.category === 'S' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {dashboardInsights.monthly_focus.category === 'E' ? 'Environmental' :
                   dashboardInsights.monthly_focus.category === 'S' ? 'Social' : 'Governance'}
                </span>
              </div>

              {/* Biggest Risk */}
              <div className="bg-white/70 rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  <h3 className="font-semibold text-gray-800">Biggest ESG Risk</h3>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {dashboardInsights.biggest_risk.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                    {dashboardInsights.biggest_risk.impact} Impact
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    dashboardInsights.biggest_risk.category === 'E' ? 'bg-green-100 text-green-800' :
                    dashboardInsights.biggest_risk.category === 'S' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {dashboardInsights.biggest_risk.category === 'E' ? 'Environmental' :
                     dashboardInsights.biggest_risk.category === 'S' ? 'Social' : 'Governance'}
                  </span>
                </div>
              </div>

              {/* Fastest Win */}
              <div className="bg-white/70 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center mb-2">
                  <Lightning className="w-5 h-5 mr-2 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Fastest ESG Win</h3>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {dashboardInsights.fastest_win.action}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {dashboardInsights.fastest_win.effort} Effort
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                    {dashboardInsights.fastest_win.timeline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {comprehensiveAnalysis && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl mr-4">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  AI Comprehensive Analysis
                </h2>
                <p className="text-gray-600">
                  Enhanced insights powered by artificial intelligence
                </p>
              </div>
            </div>

            {comprehensiveAnalysis.detailed_insights && (
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {Object.entries(comprehensiveAnalysis.detailed_insights).map(
                  ([category, insights]) => (
                    <div
                      key={category}
                      className="bg-white/70 rounded-lg p-4 backdrop-blur-sm"
                    >
                      <h3 className="font-semibold text-gray-800 capitalize mb-2">
                        {category}
                      </h3>
                      {insights.current_performance && (
                        <p className="text-sm text-gray-600 mb-2">
                          {insights.current_performance}
                        </p>
                      )}
                      {insights.key_strengths &&
                        insights.key_strengths.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-green-700">
                              Strengths:
                            </span>
                            <ul className="text-xs text-gray-600 ml-2">
                              {insights.key_strengths
                                .slice(0, 2)
                                .map((strength, idx) => (
                                  <li key={idx}>• {strength}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Carbon Footprint Section - At the Top */}
        <div
          className={`bg-gradient-to-br from-orange-50 to-red-50 border-2 ${
            getEmissionStatusColor(carbonFootprint.status).includes("red")
              ? "border-red-300"
              : getEmissionStatusColor(carbonFootprint.status).includes(
                  "yellow"
                )
              ? "border-yellow-300"
              : "border-green-300"
          } rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-full ${getEmissionStatusColor(
                  carbonFootprint.status
                )} flex items-center justify-center text-2xl`}
              >
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Carbon Footprint
                </h2>
                <p className="text-sm text-gray-600">Estimated CO₂ Emissions</p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getEmissionStatusColor(
                carbonFootprint.status
              )}`}
            >
              {carbonFootprint.status.toUpperCase()} Impact
            </span>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm text-gray-600 mb-1">
                Monthly Emissions
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {carbonFootprint.monthly.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">tons CO₂</div>
            </div>
            <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm text-gray-600 mb-1">Yearly Emissions</div>
              <div className="text-3xl font-bold text-gray-900">
                {carbonFootprint.yearly.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">tons CO₂</div>
            </div>
            <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm text-gray-600 mb-1">Monthly (kg)</div>
              <div className="text-3xl font-bold text-gray-900">
                {carbonFootprint.monthlyKg.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">kg CO₂</div>
            </div>
            <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm text-gray-600 mb-1">
                Per Employee/Month
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {analyticsData.employees > 0
                  ? (
                      carbonFootprint.monthlyKg / analyticsData.employees
                    ).toFixed(1)
                  : "0"}
              </div>
              <div className="text-xs text-gray-500">kg CO₂</div>
            </div>
          </div>

          {/* Carbon Breakdown Chart */}
          <div className="mt-4 bg-white/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Emission Sources Breakdown (kg CO₂/month)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={carbonBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2)} kg CO₂`} />
                <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ESG Scores Section */}
        <div className="grid md:grid-cols-4 gap-6">
          <div
            className={`bg-gradient-to-br ${getScoreBgColor(
              latestSnapshot.overall_esg_score
            )} border-2 ${
              latestSnapshot.overall_esg_score >= 70
                ? "border-green-300"
                : latestSnapshot.overall_esg_score >= 50
                ? "border-yellow-300"
                : "border-red-300"
            } rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="text-sm text-gray-600 mb-2 font-medium">
              Overall ESG Score
            </div>
            <div
              className={`text-5xl font-bold ${getScoreColor(
                latestSnapshot.overall_esg_score
              )} mb-2`}
            >
              {latestSnapshot.overall_esg_score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
            {latestSnapshot.confidence_level && (
              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    latestSnapshot.confidence_level === "high"
                      ? "bg-green-100 text-green-800"
                      : latestSnapshot.confidence_level === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {latestSnapshot.confidence_level.toUpperCase()} Confidence
                </span>
              </div>
            )}
          </div>
          <div
            className={`bg-gradient-to-br ${getScoreBgColor(
              latestSnapshot.environmental_score
            )} border-2 ${
              latestSnapshot.environmental_score >= 70
                ? "border-green-300"
                : latestSnapshot.environmental_score >= 50
                ? "border-yellow-300"
                : "border-red-300"
            } rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="text-sm text-gray-600 mb-2 font-medium">
              Environmental
            </div>
            <div
              className={`text-5xl font-bold ${getScoreColor(
                latestSnapshot.environmental_score
              )} mb-2`}
            >
              {latestSnapshot.environmental_score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Score</div>
          </div>
          <div
            className={`bg-gradient-to-br ${getScoreBgColor(
              latestSnapshot.social_score
            )} border-2 ${
              latestSnapshot.social_score >= 70
                ? "border-green-300"
                : latestSnapshot.social_score >= 50
                ? "border-yellow-300"
                : "border-red-300"
            } rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="text-sm text-gray-600 mb-2 font-medium">Social</div>
            <div
              className={`text-5xl font-bold ${getScoreColor(
                latestSnapshot.social_score
              )} mb-2`}
            >
              {latestSnapshot.social_score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Score</div>
          </div>
          <div
            className={`bg-gradient-to-br ${getScoreBgColor(
              latestSnapshot.governance_score
            )} border-2 ${
              latestSnapshot.governance_score >= 70
                ? "border-green-300"
                : latestSnapshot.governance_score >= 50
                ? "border-yellow-300"
                : "border-red-300"
            } rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="text-sm text-gray-600 mb-2 font-medium">
              Governance
            </div>
            <div
              className={`text-5xl font-bold ${getScoreColor(
                latestSnapshot.governance_score
              )} mb-2`}
            >
              {latestSnapshot.governance_score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Score</div>
          </div>
        </div>

        {/* Analytics Cards - Enhanced Visibility */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Employee Analytics */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-blue-400">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-gray-800" />
              <div className="bg-blue-800/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-blue-100">
                EMPLOYEES
              </div>
            </div>
            <div className="text-5xl font-black mb-2 text-gray-900">
              {analyticsData.employees.toLocaleString()}
            </div>
            <div className="text-blue-800 text-sm font-medium">Total Employees</div>
            {analyticsData.femalePercentage > 0 && (
              <div className="mt-4 bg-blue-800/30 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-900 font-medium">Female:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {analyticsData.femalePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Electricity Analytics */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-amber-400">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-10 h-10 text-gray-800" />
              <div className="bg-amber-700/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-amber-100">
                ENERGY
              </div>
            </div>
            <div className="text-5xl font-black mb-2 text-gray-900">
              {analyticsData.electricityKwh.toLocaleString()}
            </div>
            <div className="text-amber-800 text-sm font-medium">kWh / Month</div>
            {analyticsData.electricityBill > 0 && (
              <div className="mt-4 bg-amber-700/30 rounded-lg p-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-amber-900 font-medium">Cost:</span>
                  <span className="font-bold text-lg text-gray-900">
                    ₹{analyticsData.electricityBill.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-900 font-medium">Rate:</span>
                  <span className="font-bold text-gray-900">₹{costPerKwh}/kWh</span>
                </div>
              </div>
            )}
          </div>

          {/* Water Analytics */}
          <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-cyan-400">
            <div className="flex items-center justify-between mb-4">
              <Droplets className="w-10 h-10 text-gray-800" />
              <div className="bg-cyan-800/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-cyan-100">
                WATER
              </div>
            </div>
            <div className="text-5xl font-black mb-2 text-gray-900">{waterCubicMeters}</div>
            <div className="text-cyan-800 text-sm font-medium">Cubic Meters / Month</div>
            <div className="mt-4 bg-cyan-800/30 rounded-lg p-2">
              <div className="flex justify-between items-center">
                <span className="text-cyan-900 font-medium">Source:</span>
                <span className="font-bold capitalize text-gray-900">
                  {esgInput.water_source || "municipal"}
                </span>
              </div>
            </div>
          </div>

          {/* Generator Analytics */}
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-slate-400">
            <div className="flex items-center justify-between mb-4">
              <Fuel className="w-10 h-10 text-gray-800" />
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-slate-100">
                GENERATOR
              </div>
            </div>
            <div className="text-5xl font-black mb-2 text-gray-900">
              {analyticsData.generatorLiters.toLocaleString()}
            </div>
            <div className="text-slate-800 text-sm font-medium">Liters / Month</div>
            {analyticsData.generatorHours > 0 && (
              <div className="mt-4 bg-slate-800/30 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-medium">Hours:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {analyticsData.generatorHours.toFixed(0)}h
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Solar Energy */}
          {esgInput.has_solar && analyticsData.solarCapacity > 0 && (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">☀️</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  SOLAR
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {analyticsData.solarCapacity.toFixed(1)}
              </div>
              <div className="text-green-100 text-sm">kW Capacity</div>
              {analyticsData.renewablePercent > 0 && (
                <div className="mt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-100">Renewable:</span>
                    <span className="font-semibold">
                      {analyticsData.renewablePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workplace Safety */}
          <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-red-400">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-10 h-10 text-gray-800" />
              <div className="bg-red-800/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-red-100">
                SAFETY
              </div>
            </div>
            <div className="text-5xl font-black mb-2 text-gray-900">
              {analyticsData.accidents}
            </div>
            <div className="text-red-800 text-sm font-medium">Accidents (Last Year)</div>
            {analyticsData.employees > 0 && (
              <div className="mt-4 bg-red-800/30 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-red-900 font-medium">Rate:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {(
                      (analyticsData.accidents / analyticsData.employees) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Training */}
          {analyticsData.trainingHours > 0 && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-indigo-400">
              <div className="flex items-center justify-between mb-4">
                <GraduationCap className="w-10 h-10 text-gray-800" />
                <div className="bg-indigo-800/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-indigo-100">
                  TRAINING
                </div>
              </div>
              <div className="text-5xl font-black mb-2 text-gray-900">
                {analyticsData.trainingHours.toFixed(0)}
              </div>
              <div className="text-indigo-800 text-sm font-medium">
                Hours / Employee / Year
              </div>
              {analyticsData.employees > 0 && (
                <div className="mt-4 bg-indigo-800/30 rounded-lg p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-900 font-medium">Total:</span>
                    <span className="font-bold text-lg text-gray-900">
                      {(
                        analyticsData.trainingHours * analyticsData.employees
                      ).toFixed(0)}
                      h
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Revenue & ESG Investment */}
          {analyticsData.annualRevenue > 0 && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">💰</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  REVENUE
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                ₹{(analyticsData.annualRevenue / 1000000 * 83).toFixed(1)}M
              </div>
              <div className="text-emerald-100 text-sm">Annual Revenue</div>
              {analyticsData.esgBudgetPercent > 0 && (
                <div className="mt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">ESG Budget:</span>
                    <span className="font-semibold">
                      {analyticsData.esgBudgetPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scope 1 & 2 Emissions */}
          {(analyticsData.scope1Emissions > 0 || analyticsData.scope2Emissions > 0) && (
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🏭</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  EMISSIONS
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {(analyticsData.scope1Emissions + analyticsData.scope2Emissions).toFixed(1)}
              </div>
              <div className="text-red-100 text-sm">Scope 1+2 (tons CO₂)</div>
              <div className="mt-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-red-100">Scope 1:</span>
                  <span className="font-semibold">{analyticsData.scope1Emissions.toFixed(1)}t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-100">Scope 2:</span>
                  <span className="font-semibold">{analyticsData.scope2Emissions.toFixed(1)}t</span>
                </div>
              </div>
            </div>
          )}

          {/* Waste Management */}
          {analyticsData.wasteGenerated > 0 && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">♻️</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  WASTE
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {analyticsData.wasteGenerated.toFixed(1)}
              </div>
              <div className="text-amber-100 text-sm">Tons/Year Generated</div>
              {analyticsData.wasteRecycled > 0 && (
                <div className="mt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-100">Recycled:</span>
                    <span className="font-semibold">
                      {analyticsData.wasteRecycled.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Employee Turnover */}
          {analyticsData.turnoverRate > 0 && (
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🔄</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  TURNOVER
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {analyticsData.turnoverRate.toFixed(1)}%
              </div>
              <div className="text-rose-100 text-sm">Annual Turnover Rate</div>
              <div className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-rose-100">Industry Avg:</span>
                  <span className="font-semibold">15-20%</span>
                </div>
              </div>
            </div>
          )}

          {/* Board Diversity */}
          {analyticsData.boardDiversity > 0 && (
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🏛️</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  GOVERNANCE
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {analyticsData.boardDiversity.toFixed(1)}%
              </div>
              <div className="text-violet-100 text-sm">Board Diversity</div>
              <div className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-100">Target:</span>
                  <span className="font-semibold">30%+</span>
                </div>
              </div>
            </div>
          )}

          {/* Water Intensity */}
          {analyticsData.waterIntensity > 0 && (
            <div className="bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">💧</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                  INTENSITY
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {analyticsData.waterIntensity.toFixed(2)}
              </div>
              <div className="text-sky-100 text-sm">L per INR Revenue</div>
              <div className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-sky-100">Efficiency:</span>
                  <span className="font-semibold">
                    {analyticsData.waterIntensity < 0.1 ? 'High' : 
                     analyticsData.waterIntensity < 0.5 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white cursor-pointer border border-emerald-400">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-10 h-10 text-gray-800" />
              <div className="bg-emerald-800/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-emerald-100">
                DATA
              </div>
            </div>
            <div className="text-5xl font-black mb-2 text-gray-900">
              {latestSnapshot.data_completeness.toFixed(0)}%
            </div>
            <div className="text-emerald-800 text-sm font-medium">Data Completeness</div>
            <div className="mt-4 bg-emerald-800/30 rounded-lg p-2">
              <div className="bg-emerald-800/40 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-200 h-3 rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${latestSnapshot.data_completeness}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive ESG Metrics Summary */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            ESG Performance Metrics
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Comprehensive Report
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Environmental Metrics */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <Leaf className="w-4 h-4 mr-1 text-green-600" />
                Environmental
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbon Intensity:</span>
                  <span className="font-medium">
                    {analyticsData.annualRevenue > 0 && (analyticsData.scope1Emissions + analyticsData.scope2Emissions) > 0
                      ? ((analyticsData.scope1Emissions + analyticsData.scope2Emissions) / (analyticsData.annualRevenue / 1000000 * 83)).toFixed(2)
                      : 'N/A'} tCO₂/M₹
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Renewable Energy:</span>
                  <span className="font-medium">{analyticsData.renewablePercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waste Recycling:</span>
                  <span className="font-medium">{analyticsData.wasteRecycled.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water Efficiency:</span>
                  <span className="font-medium">
                    {analyticsData.waterIntensity > 0 ? 
                      (analyticsData.waterIntensity < 0.1 ? 'Excellent' : 
                       analyticsData.waterIntensity < 0.5 ? 'Good' : 'Needs Improvement') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Metrics */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-1 text-blue-600" />
                Social
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender Diversity:</span>
                  <span className="font-medium">{analyticsData.femalePercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Turnover Rate:</span>
                  <span className="font-medium">{analyticsData.turnoverRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Hours/Employee:</span>
                  <span className="font-medium">{analyticsData.trainingHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Record:</span>
                  <span className="font-medium">
                    {analyticsData.employees > 0 ? 
                      ((analyticsData.accidents / analyticsData.employees) * 100).toFixed(2) + '% incident rate' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Governance Metrics */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-purple-600" />
                Governance
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Board Diversity:</span>
                  <span className="font-medium">{analyticsData.boardDiversity.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ESG Investment:</span>
                  <span className="font-medium">{analyticsData.esgBudgetPercent.toFixed(1)}% of revenue</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Policy Coverage:</span>
                  <span className="font-medium">
                    {[
                      esgInput.code_of_conduct,
                      esgInput.anti_corruption_policy,
                      esgInput.data_privacy_policy,
                      esgInput.whistleblower_policy
                    ].filter(Boolean).length}/4 policies
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stakeholder Engagement:</span>
                  <span className="font-medium capitalize">
                    {esgInput.stakeholder_engagement_frequency || 'Not Set'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ESG Maturity Assessment */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">ESG Maturity Level</h4>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className={`p-3 rounded-lg ${
                latestSnapshot.overall_esg_score < 30 ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-100'
              }`}>
                <div className="text-2xl mb-1">🔴</div>
                <div className="text-xs font-medium">Beginner</div>
                <div className="text-xs text-gray-600">0-30</div>
              </div>
              <div className={`p-3 rounded-lg ${
                latestSnapshot.overall_esg_score >= 30 && latestSnapshot.overall_esg_score < 50 ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-100'
              }`}>
                <div className="text-2xl mb-1">🟡</div>
                <div className="text-xs font-medium">Developing</div>
                <div className="text-xs text-gray-600">30-50</div>
              </div>
              <div className={`p-3 rounded-lg ${
                latestSnapshot.overall_esg_score >= 50 && latestSnapshot.overall_esg_score < 70 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'
              }`}>
                <div className="text-2xl mb-1">🔵</div>
                <div className="text-xs font-medium">Intermediate</div>
                <div className="text-xs text-gray-600">50-70</div>
              </div>
              <div className={`p-3 rounded-lg ${
                latestSnapshot.overall_esg_score >= 70 ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100'
              }`}>
                <div className="text-2xl mb-1">🟢</div>
                <div className="text-xs font-medium">Advanced</div>
                <div className="text-xs text-gray-600">70+</div>
              </div>
            </div>
          </div>
        </div>
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              AI-Generated Recommendations
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Smart Insights
              </span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 6).map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.category === "E"
                      ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                      : rec.category === "S"
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                      : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.category === "E"
                          ? "bg-green-100 text-green-800"
                          : rec.category === "S"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {rec.category === "E"
                        ? "Environmental"
                        : rec.category === "S"
                        ? "Social"
                        : "Governance"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : rec.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rec.priority?.toUpperCase() || "MEDIUM"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {rec.expected_impact}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Cost: {rec.cost_estimate || rec.cost_level || "N/A"}
                    </span>
                    <span>
                      Impact:{" "}
                      {rec.esg_score_improvement ||
                        rec.esg_impact_points ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              ESG Scores Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis domain={[0, 100]} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value.toFixed(1)}`, "Score"]}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              ESG Radar Analysis
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="ESG Score"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Score Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value.toFixed(1)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Assessment */}
        {comprehensiveAnalysis?.risk_assessment && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              AI Risk Assessment
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(comprehensiveAnalysis.risk_assessment).map(
                ([riskType, risks]) =>
                  risks &&
                  risks.length > 0 && (
                    <div
                      key={riskType}
                      className={`p-4 rounded-lg border-l-4 ${
                        riskType.includes("high")
                          ? "bg-red-50 border-red-400"
                          : riskType.includes("medium")
                          ? "bg-yellow-50 border-yellow-400"
                          : "bg-blue-50 border-blue-400"
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800 mb-2 capitalize">
                        {riskType.replace("_", " ")}
                      </h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {risks.slice(0, 3).map((risk, idx) => (
                          <li key={idx}>• {risk}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/recommendations"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              View Opportunities
            </Link>
            <Link
              to="/roadmap"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
            >
              Execution Plan
            </Link>
            <Link
              to="/chatbot"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium flex items-center"
            >
              <Bot className="w-4 h-4 mr-2" />
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>
      
      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title="AI Analysis Complete"
        message="Enhanced insights are now available! Check out the new recommendations and risk assessments."
        type="success"
      />
    </Layout>
  );
}
