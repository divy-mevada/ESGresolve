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
      E: 'bg-green-100 text-green-800 border-green-200',
      S: 'bg-blue-100 text-blue-800 border-blue-200',
      G: 'bg-purple-100 text-purple-800 border-purple-200',
    }
    return colors[category] || colors.E
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[priority] || colors.medium
  }

  const getCostColor = (cost) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    }
    return colors[cost] || colors.medium
  }

  const getRiskColor = (risk) => {
    const colors = {
      high: 'text-red-600 font-semibold',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    }
    return colors[risk] || colors.medium
  }

  const OpportunityCard = ({ recommendation, isTopOpportunity = false }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
      isTopOpportunity ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(recommendation.category)}`}>
            {recommendation.category === 'E' ? 'Environmental' : recommendation.category === 'S' ? 'Social' : 'Governance'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(recommendation.priority)}`}>
            {(recommendation.priority || 'medium').toUpperCase()} Priority
          </span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getCostColor(recommendation.cost_level || recommendation.cost_estimate)}`}>
            Cost: {recommendation.cost_estimate || (recommendation.cost_level || 'medium').toUpperCase()}
          </div>
          {recommendation.risk_reduction && (
            <div className={`text-xs ${getRiskColor(recommendation.risk_reduction)}`}>
              Risk Reduction: {(recommendation.risk_reduction || 'medium').toUpperCase()}
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
      <p className="text-gray-700 mb-3">{recommendation.description}</p>
      
      {/* Why it matters section */}
      {recommendation.why_matters && (
        <div className="bg-blue-50 p-3 rounded mb-3 border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <strong>Why this matters for your business:</strong> {recommendation.why_matters}
          </p>
        </div>
      )}
      
      {/* Impact indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 p-3 rounded border">
          <p className="text-sm text-gray-700">
            <strong className="text-green-700">ESG Impact:</strong> {recommendation.esg_impact || recommendation.esg_impact_points || '+2 to +4 ESG points'}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded border">
          <p className="text-sm text-gray-700">
            <strong className="text-blue-700">Business Benefit:</strong> {recommendation.roi_estimate || recommendation.business_benefit || recommendation.expected_impact || 'Improved ESG performance'}
          </p>
        </div>
        {recommendation.time_estimate && (
          <div className="bg-yellow-50 p-3 rounded border">
            <p className="text-sm text-gray-700">
              <strong className="text-yellow-700">Time Estimate:</strong> {recommendation.time_estimate}
            </p>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleAddToRoadmap(recommendation.id, recommendation)}
          disabled={actionLoading[recommendation.id || Math.random()]}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
        >
          {actionLoading[recommendation.id || Math.random()] ? 'Adding...' : 'Add to Execution Plan'}
        </button>
        <button
          onClick={() => handleAskAI(recommendation)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Ask AI How to Implement
        </button>
        <button
          onClick={() => simulateImpact(recommendation)}
          disabled={actionLoading[`sim_${recommendation.id || Math.random()}`]}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
        >
          {actionLoading[`sim_${recommendation.id || Math.random()}`] ? 'Simulating...' : 'Simulate ESG Impact'}
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">Loading...</div>
      </Layout>
    )
  }

  if (!selectedSnapshot) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assessment Found</h2>
          <p className="text-gray-600 mb-6">Complete an ESG assessment to discover improvement opportunities.</p>
          <Link to="/esg-form" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
            Start Assessment
          </Link>
        </div>
      </Layout>
    )
  }

  const displayedOpportunities = showAll ? allRecommendations : topOpportunities

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESG Opportunities</h1>
            <p className="text-gray-600 mt-1">Discover what you should consider doing to improve your ESG performance</p>
          </div>
          {snapshots.length > 1 && (
            <select
              value={selectedSnapshot.id}
              onChange={(e) => {
                const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                setSelectedSnapshot(snapshot)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  Assessment {new Date(snapshot.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>Decision Support:</strong> These opportunities are ranked by ESG impact, cost-effectiveness, and risk reduction. 
            Each recommendation explains why it matters for your specific business situation.
          </p>
        </div>

        {!showAll && topOpportunities.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Top 3 Opportunities</h2>
            <p className="text-gray-600 text-sm mb-4">Focus on these high-impact actions first. Click "View All" to see more options.</p>
          </div>
        )}

        {displayedOpportunities.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No opportunities available for this assessment.</p>
          </div>
        ) : (
          <div className="space-y-4">
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
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium flex items-center space-x-2"
          >
            <span>{showAll ? 'Show Top 3 Opportunities' : `View All Opportunities (${allRecommendations.length})`}</span>
            <span className="text-lg">{showAll ? '↑' : '↓'}</span>
          </button>
        </div>

        {/* Navigation to other sections */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/roadmap"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              View Execution Plan (WHEN)
            </Link>
            <Link
              to="/chatbot"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
            >
              Get Implementation Help (HOW)
            </Link>
          </div>
        </div>
      </div>

      {/* AI Impact Simulation Modal */}
      {showSimulation && simulationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Impact Simulation: {simulationData.recommendation.title}
                </h3>
                <button
                  onClick={() => setShowSimulation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Expected ESG Score Improvements</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Environmental: {simulationData.score_improvements?.environmental || 'N/A'}</div>
                    <div>Social: {simulationData.score_improvements?.social || 'N/A'}</div>
                    <div>Governance: {simulationData.score_improvements?.governance || 'N/A'}</div>
                    <div className="font-semibold">Overall: {simulationData.score_improvements?.overall || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <h5 className="font-semibold text-blue-800">Timeline</h5>
                    <p className="text-sm">{simulationData.timeline || 'N/A'}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <h5 className="font-semibold text-yellow-800">Confidence</h5>
                    <p className="text-sm capitalize">{simulationData.confidence || 'Medium'}</p>
                  </div>
                </div>

                {simulationData.business_benefits && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Business Benefits</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {simulationData.business_benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {simulationData.implementation_steps && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Implementation Steps</h4>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                      {simulationData.implementation_steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSimulation(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAddToRoadmap(simulationData.recommendation.id || Math.random())
                    setShowSimulation(false)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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