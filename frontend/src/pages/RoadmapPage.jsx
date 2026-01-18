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
      E: 'bg-cream text-moss border-2 border-moss',
      S: 'bg-sage text-moss border-2 border-moss',
      G: 'bg-leaf text-white border-2 border-moss',
    }
    return colors[category] || colors.E
  }

  const getEffortColor = (effort) => {
    const colors = {
      low: 'text-moss font-bold',
      easy: 'text-moss font-bold',
      medium: 'text-leaf font-bold',
      high: 'text-red-700 font-bold',
    }
    return colors[effort?.toLowerCase()] || colors.medium
  }

  const getEffortBorderColor = (effort) => {
    const colors = {
      low: 'border-l-moss',
      easy: 'border-l-moss',
      medium: 'border-l-leaf',
      high: 'border-l-red-700',
    }
    return colors[effort?.toLowerCase()] || colors.medium
  }

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
          <p className="text-moss mb-8 font-medium">Complete an ESG assessment to generate a roadmap.</p>
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
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border-b-4 border-moss">
          <h1 className="text-4xl md:text-5xl font-black text-moss tracking-tighter uppercase">ESG Action Roadmap</h1>
          <div className="flex space-x-4">
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
            {roadmap.length === 0 && (
              <button
                onClick={handleGenerateRoadmap}
                disabled={generating}
                className="bg-moss text-white px-6 py-2 rounded-sm border-2 border-moss hover:bg-white hover:text-moss font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50"
              >
                {generating ? 'GENERATING...' : 'GENERATE ROADMAP'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-cream border-2 border-moss p-6 rounded-sm shadow-[4px_4px_0px_0px_#778873] mx-4 md:mx-0">
          <p className="text-moss font-medium">
            <strong className="font-black uppercase">Disclaimer:</strong> This roadmap is indicative and based on your ESG assessment. 
            It does not constitute certified ESG advice or regulatory compliance guidance.
          </p>
        </div>

        {generating ? (
          <div className="bg-white p-12 rounded-sm border-2 border-moss text-center mx-4 md:mx-0">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-moss mb-4"></div>
              <p className="text-moss text-xl font-black uppercase tracking-tight">Generating roadmap...</p>
              <p className="text-sage font-bold text-sm mt-2 uppercase">This may take a few moments. Please wait.</p>
            </div>
          </div>
        ) : roadmap.length === 0 ? (
          <div className="bg-white p-12 rounded-sm border-2 border-moss text-center mx-4 md:mx-0 shadow-[4px_4px_0px_0px_#D2DCB6]">
            <p className="text-moss mb-6 font-black text-xl uppercase">No roadmap available for this assessment.</p>
            <div className="mb-6">
              <label className="block text-sm font-black text-moss mb-2 uppercase">Select Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border-2 border-moss rounded-sm bg-cream text-moss font-bold mr-4 focus:outline-none focus:ring-0"
              >
                <option value="30">30 DAYS - QUICK WINS</option>
                <option value="60">60 DAYS - PROCESS IMPROVEMENTS</option>
                <option value="90">90 DAYS - FULL TRANSFORMATION</option>
              </select>
            </div>
            <button
              onClick={handleGenerateRoadmap}
              disabled={generating}
              className="bg-moss text-white px-8 py-3 rounded-sm border-2 border-moss hover:bg-white hover:text-moss font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50"
            >
              {generating ? 'GENERATING...' : `GENERATE ${selectedTimeframe}-DAY ROADMAP`}
            </button>
          </div>
        ) : (
          <div className="space-y-8 mx-4 md:mx-0">
            {Array.from({length: maxPhases}, (_, i) => i + 1).map((phase) => {
              const phaseItems = roadmapByPhase[phase] || []
              if (phaseItems.length === 0) return null

              return (
                <div key={phase} className="bg-white rounded-sm border-2 border-moss p-6 shadow-[4px_4px_0px_0px_#778873]">
                  <h2 className="text-2xl font-black text-moss mb-6 uppercase tracking-tight border-b-2 border-sage pb-2">
                    {getPhaseTitle(phase, selectedTimeframe).toUpperCase()}
                  </h2>
                  <div className="space-y-4">
                    {phaseItems && phaseItems.map((item) => (
                      <div key={item.id} className={`border-l-8 ${getEffortBorderColor(item.effort_level)} pl-6 py-4 bg-cream rounded-r-sm border-y-2 border-r-2 border-moss hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-black text-moss uppercase tracking-tight">{item.action_title}</h3>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-sm text-xs font-black uppercase tracking-tight ${getCategoryColor(item.esg_category)}`}>
                              {item.esg_category}
                            </span>
                            <span className={`text-sm font-black uppercase tracking-tight ${getEffortColor(item.effort_level)}`}>
                              {item.effort_level?.toUpperCase() || 'MEDIUM'} EFFORT
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-800 mb-3 font-medium">{item.description}</p>
                        <p className="text-sm text-moss font-medium">
                          <strong className="font-black uppercase">Responsible:</strong> {item.responsible_role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {/* Generate Another Timeframe Option */}
            <div className="bg-sage bg-opacity-30 p-8 rounded-sm border-2 border-moss text-center shadow-[4px_4px_0px_0px_#A1BC98]">
              <h3 className="text-xl font-black text-moss mb-4 uppercase tracking-tight">Generate Different Timeframe</h3>
              <div className="mb-6">
                <label className="block text-sm font-black text-moss mb-2 uppercase">Select New Timeframe:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border-2 border-moss rounded-sm bg-white text-moss font-bold mr-4 focus:outline-none focus:ring-0"
                >
                  <option value="30">30 DAYS - QUICK WINS</option>
                  <option value="60">60 DAYS - PROCESS IMPROVEMENTS</option>
                  <option value="90">90 DAYS - FULL TRANSFORMATION</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setRoadmap([])
                  handleGenerateRoadmap()
                }}
                disabled={generating}
                className="bg-moss text-white px-8 py-3 rounded-sm border-2 border-moss hover:bg-white hover:text-moss font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50"
              >
                {generating ? 'GENERATING...' : `GENERATE ${selectedTimeframe}-DAY ROADMAP`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

