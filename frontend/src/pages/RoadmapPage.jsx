import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function RoadmapPage() {
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [roadmap, setRoadmap] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('90')

  useEffect(() => {
    loadSnapshots()
  }, [])

  useEffect(() => {
    if (selectedSnapshot) {
      loadRoadmap(selectedSnapshot.id)
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

  const loadRoadmap = async (snapshotId) => {
    try {
      const response = await api.getRoadmap(snapshotId)
      setRoadmap(response.data)
    } catch (error) {
      // Roadmap might not exist yet
      setRoadmap([])
    }
  }

  const handleGenerateRoadmap = async () => {
    if (!selectedSnapshot) return
    setGenerating(true)
    try {
      const response = await api.generateRoadmap({ 
        snapshot_id: selectedSnapshot.id, 
        timeframe: selectedTimeframe 
      })
      setRoadmap(response.data.roadmap)
    } catch (error) {
      console.error('Failed to generate roadmap', error)
      alert('Failed to generate roadmap. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const getPhaseTitle = (phase, timeframe) => {
    if (timeframe === '30') {
      return 'Phase 1: Quick Wins (0-30 days)'
    } else if (timeframe === '60') {
      const titles = {
        1: 'Phase 1: Quick Wins (0-30 days)',
        2: 'Phase 2: Process Improvements (31-60 days)',
      }
      return titles[phase] || `Phase ${phase}`
    } else {
      const titles = {
        1: 'Phase 1: Quick Wins (0-30 days)',
        2: 'Phase 2: Process Improvements (31-60 days)',
        3: 'Phase 3: Structural Changes (61-90 days)',
      }
      return titles[phase] || `Phase ${phase}`
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      E: 'bg-green-100 text-green-800',
      S: 'bg-blue-100 text-blue-800',
      G: 'bg-purple-100 text-purple-800',
    }
    return colors[category] || colors.E
  }

  const getEffortColor = (effort) => {
    const colors = {
      low: 'text-green-600',
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    }
    return colors[effort?.toLowerCase()] || colors.medium
  }

  const getEffortBorderColor = (effort) => {
    const colors = {
      low: 'border-green-500',
      easy: 'border-green-500',
      medium: 'border-yellow-500',
      high: 'border-red-500',
    }
    return colors[effort?.toLowerCase()] || colors.medium
  }

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
          <p className="text-gray-600 mb-8">Complete an ESG assessment to generate a roadmap.</p>
        </div>
      </Layout>
    )
  }

  const maxPhases = selectedTimeframe === '30' ? 1 : selectedTimeframe === '60' ? 2 : 3
  const roadmapByPhase = {}
  for (let i = 1; i <= maxPhases; i++) {
    roadmapByPhase[i] = roadmap.filter(r => r.phase === i)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ESG Action Roadmap</h1>
          <div className="flex space-x-4">
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
            {roadmap.length === 0 && (
              <button
                onClick={handleGenerateRoadmap}
                disabled={generating}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors duration-200"
              >
                {generating ? 'Generating...' : 'Generate Roadmap'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This roadmap is indicative and based on your ESG assessment. 
            It does not constitute certified ESG advice or regulatory compliance guidance.
          </p>
        </div>

        {generating ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Generating roadmap...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a few moments. Please wait.</p>
            </div>
          </div>
        ) : roadmap.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">No roadmap available for this assessment.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg mr-4"
              >
                <option value="30">30 Days - Quick Wins</option>
                <option value="60">60 Days - Process Improvements</option>
                <option value="90">90 Days - Full Transformation</option>
              </select>
            </div>
            <button
              onClick={handleGenerateRoadmap}
              disabled={generating}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors duration-200"
            >
              {generating ? 'Generating...' : `Generate ${selectedTimeframe}-Day Roadmap`}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from({length: maxPhases}, (_, i) => i + 1).map((phase) => {
              const phaseItems = roadmapByPhase[phase] || []
              if (phaseItems.length === 0) return null

              return (
                <div key={phase} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {getPhaseTitle(phase, selectedTimeframe)}
                  </h2>
                  <div className="space-y-4">
                    {phaseItems && phaseItems.map((item) => (
                      <div key={item.id} className={`border-l-4 ${getEffortBorderColor(item.effort_level)} pl-4 py-2 bg-gray-50 rounded-r-lg`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{item.action_title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.esg_category)}`}>
                              {item.esg_category}
                            </span>
                            <span className={`text-sm font-medium ${getEffortColor(item.effort_level)}`}>
                              {item.effort_level?.toUpperCase() || 'MEDIUM'} Effort
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          <strong>Responsible:</strong> {item.responsible_role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {/* Generate Another Timeframe Option */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Different Timeframe</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Timeframe:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg mr-4"
                >
                  <option value="30">30 Days - Quick Wins</option>
                  <option value="60">60 Days - Process Improvements</option>
                  <option value="90">90 Days - Full Transformation</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setRoadmap([])
                  handleGenerateRoadmap()
                }}
                disabled={generating}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {generating ? 'Generating...' : `Generate ${selectedTimeframe}-Day Roadmap`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

