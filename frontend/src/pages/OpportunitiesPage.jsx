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

  const handleAddToRoadmap = async (recommendationId) => {
    setActionLoading(prev => ({ ...prev, [recommendationId]: true }))
    try {
      await api.post(`/esg-snapshots/${selectedSnapshot.id}/add_to_roadmap/`, {
        recommendation_id: recommendationId
      })
      alert('Successfully added to execution plan!')
    } catch (error) {
      console.error('Failed to add to roadmap', error)
      alert('Failed to add to execution plan. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [recommendationId]: false }))
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

  const simulateImpact = (recommendation) => {
    alert(`Simulated Impact for "${recommendation.title}":

ESG Score Impact: ${recommendation.esg_impact_points || '+2 to +4 ESG points'}
Business Benefit: ${recommendation.business_benefit || 'Improved ESG performance'}

Note: This is a preview. Actual implementation required for real score changes.`)
  }

  const getCategoryColor = (category) => {
    const colors = {
      E: 'bg-gray-100 text-gray-800 border-gray-200',
      S: 'bg-gray-100 text-gray-800 border-gray-200',
      G: 'bg-gray-100 text-gray-800 border-gray-200',
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
      isTopOpportunity ? 'border-l-gray-500 bg-gray-50' : 'border-l-gray-300'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(recommendation.category)}`}>
            {recommendation.category === 'E' ? 'Environmental' : recommendation.category === 'S' ? 'Social' : 'Governance'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(recommendation.priority)}`}>
            {recommendation.priority.toUpperCase()} Priority
          </span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getCostColor(recommendation.cost_level)}`}>
            Cost: {recommendation.cost_level.toUpperCase()}
          </div>
          {recommendation.risk_reduction && (
            <div className={`text-xs ${getRiskColor(recommendation.risk_reduction)}`}>
              Risk Reduction: {recommendation.risk_reduction.toUpperCase()}
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
      <p className="text-gray-700 mb-3">{recommendation.description}</p>
      
      {/* Why it matters section */}
      {recommendation.why_matters && (
        <div className="bg-gray-50 p-3 rounded mb-3 border-l-4 border-gray-400">
          <p className="text-sm text-gray-800">
            <strong>Why this matters for your business:</strong> {recommendation.why_matters}
          </p>
        </div>
      )}
      
      {/* Impact indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm text-gray-700">
            <strong className="text-gray-700">ESG Impact:</strong> {recommendation.esg_impact_points || '+2 to +4 ESG points'}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm text-gray-700">
            <strong className="text-gray-700">Business Benefit:</strong> {recommendation.business_benefit || recommendation.expected_impact}
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleAddToRoadmap(recommendation.id)}
          disabled={actionLoading[recommendation.id]}
          className="bg-[#C5D89D] text-gray-800 px-4 py-2 rounded-lg hover:bg-[#B5C88D] disabled:opacity-50 text-sm font-medium transition-colors duration-200"
        >
          {actionLoading[recommendation.id] ? 'Adding...' : 'Add to Execution Plan'}
        </button>
        <button
          onClick={() => handleAskAI(recommendation)}
          className="bg-[#C5D89D] text-gray-800 px-4 py-2 rounded-lg hover:bg-[#B5C88D] text-sm font-medium transition-colors duration-200"
        >
          Ask AI How to Implement
        </button>
        <button
          onClick={() => simulateImpact(recommendation)}
          className="bg-[#C5D89D] text-gray-800 px-4 py-2 rounded-lg hover:bg-[#B5C88D] text-sm font-medium transition-colors duration-200"
        >
          Simulate ESG Impact
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
          <Link to="/esg-form" className="bg-[#C5D89D] text-gray-800 px-6 py-3 rounded-lg hover:bg-[#B5C88D] font-medium transition-colors duration-200">
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
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Top 3 Opportunities</h2>
            <p className="text-gray-600 text-sm mb-4">Highest impact, lowest cost, and highest risk reduction opportunities for your business</p>
          </div>
        )}

        {displayedOpportunities.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No opportunities available for this assessment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOpportunities.map((rec) => (
              <OpportunityCard 
                key={rec.id} 
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
            className="bg-[#C5D89D] text-gray-800 px-6 py-3 rounded-lg hover:bg-[#B5C88D] font-medium transition-colors duration-200"
          >
            {showAll ? 'Show Top 3 Opportunities' : `View All Opportunities (${allRecommendations.length})`}
          </button>
        </div>

        {/* Navigation to other sections */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/roadmap"
              className="bg-[#C5D89D] text-gray-800 px-6 py-3 rounded-lg hover:bg-[#B5C88D] font-medium transition-colors duration-200"
            >
              View Execution Plan (WHEN)
            </Link>
            <Link
              to="/chatbot"
              className="bg-[#C5D89D] text-gray-800 px-6 py-3 rounded-lg hover:bg-[#B5C88D] font-medium transition-colors duration-200"
            >
              Get Implementation Help (HOW)
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
