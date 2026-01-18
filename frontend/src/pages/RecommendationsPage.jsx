import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function RecommendationsPage() {
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [topOpportunities, setTopOpportunities] = useState([])
  const [allRecommendations, setAllRecommendations] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [simulationData, setSimulationData] = useState(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadSnapshots()
  }, [])

  useEffect(() => {
    if (selectedSnapshot) {
      loadOpportunities(selectedSnapshot.id)
    }
  }, [selectedSnapshot])

  const loadSnapshots = async () => {
    try {
      const response = await api.getSnapshots()
      const data = response.data.results || response.data
      setSnapshots(data)
      if (data.length > 0) {
        setSelectedSnapshot(data[0])
      }
    } catch (error) {
      console.error('Failed to load snapshots', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOpportunities = async (snapshotId) => {
    try {
      // Load top 3 opportunities
      const topResponse = await api.get(`/esg-snapshots/${snapshotId}/top_opportunities/`)
      setTopOpportunities(topResponse.data)
      
      // Load all recommendations for "View All" functionality
      const allResponse = await api.getRecommendations(snapshotId)
      setAllRecommendations(allResponse.data)
    } catch (error) {
      console.error('Failed to load opportunities', error)
      // Fallback to regular recommendations
      const response = await api.getRecommendations(snapshotId)
      setAllRecommendations(response.data)
      setTopOpportunities(response.data.slice(0, 3))
    }
  }

  const handleAddToRoadmap = async (recommendationId, recommendation = null) => {
    const loadingKey = recommendationId || Math.random()
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
    try {
      const payload = {}
      
      // If it's a database recommendation, send the ID
      if (recommendationId && typeof recommendationId === 'number') {
        payload.recommendation_id = recommendationId
      } 
      // If it's an AI-generated opportunity, send the full data
      else if (recommendation) {
        payload.recommendation = recommendation
      }
      
      await api.post(`/esg-snapshots/${selectedSnapshot.id}/add_to_roadmap/`, payload)
      alert('Successfully added to execution plan!')
    } catch (error) {
      console.error('Failed to add to roadmap', error)
      alert('Failed to add to execution plan. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleAskAI = (recommendation) => {
    // Navigate to chatbot with recommendation context
    const context = `How do I implement: ${recommendation.title}? ${recommendation.description}`
    navigate('/chatbot', { 
      state: { 
        initialMessage: context,
        snapshotId: selectedSnapshot.id 
      }
    })
  }

  const simulateImpact = async (recommendation) => {
    setActionLoading(prev => ({ ...prev, [`sim_${recommendation.id || Math.random()}`]: true }))
    try {
      const response = await api.post(`/esg-snapshots/${selectedSnapshot.id}/simulate_impact/`, {
        recommendation: {
          title: recommendation.title,
          description: recommendation.description,
          category: recommendation.category
        }
      })
      setSimulationData({ ...response.data, recommendation })
      setShowSimulation(true)
    } catch (error) {
      console.error('Failed to simulate impact', error)
      alert('Failed to simulate impact. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`sim_${recommendation.id || Math.random()}`]: false }))
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      E: 'bg-cream text-moss border-2 border-moss',
      S: 'bg-sage text-moss border-2 border-moss',
      G: 'bg-leaf text-white border-2 border-moss',
    }
    return colors[category] || colors.E
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-moss text-white border-2 border-moss',
      medium: 'bg-leaf text-white border-2 border-moss',
      low: 'bg-sage text-moss border-2 border-moss',
    }
    return colors[priority] || colors.medium
  }

  const getCostColor = (cost) => {
    const colors = {
      low: 'text-moss font-bold',
      medium: 'text-leaf font-bold',
      high: 'text-red-700 font-bold',
    }
    return colors[cost] || colors.medium
  }

  const getRiskColor = (risk) => {
    const colors = {
      high: 'text-red-700 font-black',
      medium: 'text-leaf font-bold',
      low: 'text-moss font-bold',
    }
    return colors[risk] || colors.medium
  }

  const OpportunityCard = ({ recommendation, isTopOpportunity = false }) => (
    <div className={`bg-white p-6 rounded-sm border-2 border-moss shadow-[4px_4px_0px_0px_#778873] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none mb-6`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-sm text-sm font-black uppercase tracking-tight ${getCategoryColor(recommendation.category)}`}>
            {recommendation.category === 'E' ? 'Environmental' : recommendation.category === 'S' ? 'Social' : 'Governance'}
          </span>
          <span className={`px-3 py-1 rounded-sm text-sm font-black uppercase tracking-tight ${getPriorityColor(recommendation.priority)}`}>
            {(recommendation.priority || 'medium').toUpperCase()} Priority
          </span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-black uppercase tracking-tight ${getCostColor(recommendation.cost_level || recommendation.cost_estimate)}`}>
            Cost: {recommendation.cost_estimate || (recommendation.cost_level || 'medium').toUpperCase()}
          </div>
          {recommendation.risk_reduction && (
            <div className={`text-xs uppercase tracking-tight ${getRiskColor(recommendation.risk_reduction)}`}>
              Risk Reduction: {(recommendation.risk_reduction || 'medium').toUpperCase()}
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-black text-moss mb-2 uppercase tracking-tight">{recommendation.title}</h3>
      <p className="text-gray-800 mb-4 font-medium border-l-4 border-sage pl-4 py-1">{recommendation.description}</p>
      
      {/* Why it matters section */}
      {recommendation.why_matters && (
        <div className="bg-cream p-4 rounded-sm mb-4 border-2 border-leaf">
          <p className="text-sm text-moss font-medium">
            <strong className="font-black uppercase block mb-1">Why this matters:</strong> {recommendation.why_matters}
          </p>
        </div>
      )}
      
      {/* Impact indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3 rounded-sm border-2 border-moss">
          <p className="text-sm text-gray-800">
            <strong className="text-moss font-black uppercase block mb-1">ESG Impact:</strong> {recommendation.esg_impact || recommendation.esg_impact_points || '+2 to +4 ESG points'}
          </p>
        </div>
        <div className="bg-sage p-3 rounded-sm border-2 border-moss">
          <p className="text-sm text-moss">
            <strong className="text-moss font-black uppercase block mb-1">Business Benefit:</strong> {recommendation.roi_estimate || recommendation.business_benefit || recommendation.expected_impact || 'Improved ESG performance'}
          </p>
        </div>
        {recommendation.time_estimate && (
          <div className="bg-cream p-3 rounded-sm border-2 border-moss">
            <p className="text-sm text-gray-800">
              <strong className="text-moss font-black uppercase block mb-1">Time Estimate:</strong> {recommendation.time_estimate}
            </p>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleAddToRoadmap(recommendation.id, recommendation)}
          disabled={actionLoading[recommendation.id || Math.random()]}
          className="bg-moss text-white px-5 py-2 rounded-sm border-2 border-moss hover:bg-white hover:text-moss font-black uppercase tracking-tight text-sm transition-all duration-200 disabled:opacity-50"
        >
          {actionLoading[recommendation.id || Math.random()] ? 'Adding...' : 'Add to Execution Plan'}
        </button>
        <button
          onClick={() => handleAskAI(recommendation)}
          className="bg-leaf text-white px-5 py-2 rounded-sm border-2 border-leaf hover:bg-white hover:text-leaf font-black uppercase tracking-tight text-sm transition-all duration-200"
        >
          Ask AI How to Implement
        </button>
        <button
          onClick={() => simulateImpact(recommendation)}
          disabled={actionLoading[`sim_${recommendation.id || Math.random()}`]}
          className="bg-cream text-moss px-5 py-2 rounded-sm border-2 border-moss hover:bg-moss hover:text-white font-black uppercase tracking-tight text-sm disabled:opacity-50 transition-all duration-200"
        >
          {actionLoading[`sim_${recommendation.id || Math.random()}`] ? 'Simulating...' : 'Simulate ESG Impact'}
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-cream">
          <div className="text-2xl font-black text-moss animate-pulse">LOADING...</div>
        </div>
      </Layout>
    )
  }

  if (!selectedSnapshot) {
    return (
      <Layout>
        <div className="text-center py-12 bg-cream rounded-sm border-2 border-moss m-6 shadow-[8px_8px_0px_0px_#778873]">
          <h2 className="text-3xl font-black text-moss mb-4 uppercase tracking-tighter">No Assessment Found</h2>
          <p className="text-moss mb-8 font-medium">Complete an ESG assessment to discover improvement opportunities.</p>
          <Link to="/esg-form" className="bg-moss text-white px-8 py-4 rounded-sm border-2 border-moss hover:bg-white hover:text-moss font-black uppercase tracking-tight transition-all duration-300 shadow-[4px_4px_0px_0px_#D2DCB6] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
            Start Assessment
          </Link>
        </div>
      </Layout>
    )
  }

  const displayedOpportunities = showAll ? allRecommendations : topOpportunities

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border-b-4 border-moss">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-moss tracking-tighter uppercase">ESG Opportunities</h1>
            <p className="text-leaf font-bold mt-2 uppercase tracking-tight">Strategic actions to elevate your ESG performance</p>
          </div>
          {snapshots.length > 1 && (
            <select
              value={selectedSnapshot.id}
              onChange={(e) => {
                const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                setSelectedSnapshot(snapshot)
              }}
              className="px-4 py-2 border-2 border-moss rounded-sm bg-cream text-moss font-bold focus:outline-none focus:ring-0"
            >
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  ASSESSMENT {new Date(snapshot.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bg-cream border-2 border-moss p-6 rounded-sm shadow-[4px_4px_0px_0px_#778873] mx-4 md:mx-0">
          <p className="text-moss font-medium">
            <strong className="font-black uppercase">Decision Support:</strong> These opportunities are ranked by ESG impact, cost-effectiveness, and risk reduction. 
            Each recommendation explains why it matters for your specific business situation.
          </p>
        </div>

        {!showAll && topOpportunities.length > 0 && (
          <div className="bg-moss p-6 rounded-sm border-2 border-moss mx-4 md:mx-0 shadow-[4px_4px_0px_0px_#D2DCB6]">
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Top 3 Opportunities</h2>
            <p className="text-sage font-medium text-sm mb-4 uppercase">Focus on these high-impact actions first. Click "View All" to see more options.</p>
          </div>
        )}

        {displayedOpportunities.length === 0 ? (
          <div className="bg-white p-12 rounded-sm border-2 border-moss text-center mx-4 md:mx-0">
            <p className="text-moss font-bold text-xl uppercase">No opportunities available for this assessment.</p>
          </div>
        ) : (
          <div className="space-y-6 mx-4 md:mx-0">
            {displayedOpportunities.map((rec, index) => (
              <OpportunityCard 
                key={rec.id || `opportunity-${index}`} 
                recommendation={rec} 
                isTopOpportunity={!showAll && topOpportunities.includes(rec)}
              />
            ))}
          </div>
        )}

        {/* Toggle between top 3 and all opportunities */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-white text-moss border-2 border-moss px-8 py-4 rounded-sm hover:bg-moss hover:text-white font-black uppercase tracking-tight flex items-center space-x-2 transition-all duration-300 shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            <span>{showAll ? 'Show Top 3 Opportunities' : `View All Opportunities (${allRecommendations.length})`}</span>
            <span className="text-xl font-bold">{showAll ? '↑' : '↓'}</span>
          </button>
        </div>

        {/* Navigation to other sections */}
        <div className="bg-sage bg-opacity-30 p-8 rounded-sm border-2 border-moss mx-4 md:mx-0">
          <h3 className="text-2xl font-black text-moss mb-6 uppercase tracking-tight">Next Steps</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/roadmap"
              className="bg-moss text-white px-6 py-3 rounded-sm border-2 border-moss hover:bg-white hover:text-moss font-black uppercase tracking-tight transition-all duration-200 shadow-[4px_4px_0px_0px_#A1BC98] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              View Execution Plan (WHEN)
            </Link>
            <Link
              to="/chatbot"
              className="bg-leaf text-white px-6 py-3 rounded-sm border-2 border-leaf hover:bg-white hover:text-leaf font-black uppercase tracking-tight transition-all duration-200 shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Get Implementation Help (HOW)
            </Link>
          </div>
        </div>
      </div>

      {/* AI Impact Simulation Modal */}
      {showSimulation && simulationData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-sm border-4 border-moss max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_#D2DCB6]">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6 border-b-2 border-sage pb-4">
                <h3 className="text-2xl font-black text-moss uppercase tracking-tight">
                  Impact Simulation: {simulationData.recommendation.title}
                </h3>
                <button
                  onClick={() => setShowSimulation(false)}
                  className="text-moss hover:text-red-600 font-black text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-cream p-6 rounded-sm border-2 border-moss">
                  <h4 className="font-black text-moss uppercase mb-4 text-lg">Expected ESG Score Improvements</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                    <div className="bg-white p-2 border border-moss rounded-sm">Environmental: <span className="font-bold">{simulationData.score_improvements?.environmental || 'N/A'}</span></div>
                    <div className="bg-white p-2 border border-moss rounded-sm">Social: <span className="font-bold">{simulationData.score_improvements?.social || 'N/A'}</span></div>
                    <div className="bg-white p-2 border border-moss rounded-sm">Governance: <span className="font-bold">{simulationData.score_improvements?.governance || 'N/A'}</span></div>
                    <div className="bg-moss text-white p-2 border border-moss rounded-sm">Overall: <span className="font-bold">{simulationData.score_improvements?.overall || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-sm border-2 border-moss">
                    <h5 className="font-black text-moss uppercase mb-2">Timeline</h5>
                    <p className="text-sm font-medium">{simulationData.timeline || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-sm border-2 border-moss">
                    <h5 className="font-black text-moss uppercase mb-2">Confidence</h5>
                    <p className="text-sm font-medium uppercase">{simulationData.confidence || 'Medium'}</p>
                  </div>
                </div>

                {simulationData.business_benefits && (
                  <div className="bg-white p-4 rounded-sm border-2 border-leaf">
                    <h4 className="font-black text-moss uppercase mb-3">Business Benefits</h4>
                    <ul className="list-disc list-inside text-sm space-y-2 text-gray-800 font-medium">
                      {simulationData.business_benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {simulationData.implementation_steps && (
                  <div className="bg-white p-4 rounded-sm border-2 border-moss">
                    <h4 className="font-black text-moss uppercase mb-3">Implementation Steps</h4>
                    <ol className="list-decimal list-inside text-sm space-y-2 text-gray-800 font-medium">
                      {simulationData.implementation_steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end space-x-4 border-t-2 border-sage pt-6">
                <button
                  onClick={() => setShowSimulation(false)}
                  className="px-6 py-2 text-moss border-2 border-moss rounded-sm hover:bg-cream font-bold uppercase"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAddToRoadmap(simulationData.recommendation.id || Math.random())
                    setShowSimulation(false)
                  }}
                  className="px-6 py-2 bg-moss text-white border-2 border-moss rounded-sm hover:bg-leaf font-bold uppercase shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Add to Execution Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
