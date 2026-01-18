import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function ReportPage() {
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [reportHtml, setReportHtml] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSnapshots()
  }, [])

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
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedSnapshot) return
    setLoading(true)
    try {
      const response = await api.generateReport(selectedSnapshot.id)
      setReportHtml(response.data.report_html)
    } catch (error) {
      console.error('Failed to generate report', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!reportHtml) return
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(reportHtml)
    printWindow.document.close()
    printWindow.print()
  }

  if (!selectedSnapshot) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white border-2 border-moss rounded-sm shadow-[4px_4px_0px_0px_#D2DCB6] max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-moss mb-4 uppercase tracking-tight">No Assessment Found</h2>
          <p className="text-moss/80 mb-8 font-medium">Complete an ESG assessment to generate a report.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-moss uppercase tracking-tighter">ESG Report</h1>
          <div className="flex space-x-4">
            {snapshots.length > 1 && (
              <select
                value={selectedSnapshot.id}
                onChange={(e) => {
                  const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                  setSelectedSnapshot(snapshot)
                  setReportHtml(null)
                }}
                className="px-4 py-2 border-2 border-moss rounded-sm bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#A1BC98] font-medium"
              >
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    Assessment {new Date(snapshot.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
            {!reportHtml && (
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="bg-moss text-white border-2 border-moss px-6 py-2 rounded-sm hover:bg-leaf hover:text-moss hover:shadow-[4px_4px_0px_0px_#D2DCB6] disabled:opacity-50 font-bold uppercase tracking-wider transition-all"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            )}
            {reportHtml && (
              <button
                onClick={handleDownload}
                className="bg-white text-moss border-2 border-moss px-6 py-2 rounded-sm hover:bg-cream hover:shadow-[4px_4px_0px_0px_#A1BC98] font-bold uppercase tracking-wider transition-all"
              >
                Download/Print
              </button>
            )}
          </div>
        </div>

        <div className="bg-cream border-2 border-moss p-4 rounded-sm shadow-[4px_4px_0px_0px_#D2DCB6]">
          <p className="text-sm text-moss font-medium">
            <strong className="font-black uppercase">Disclaimer:</strong> This report is indicative and does not constitute a certified ESG rating 
            or regulatory compliance advice. All outputs are based on provided data.
          </p>
        </div>

        {reportHtml ? (
          <div className="bg-white rounded-sm border-2 border-moss shadow-[8px_8px_0px_0px_#A1BC98] p-8">
            <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
          </div>
        ) : (
          <div className="bg-white p-12 rounded-sm border-2 border-moss shadow-[8px_8px_0px_0px_#A1BC98] text-center">
            <p className="text-moss/80 font-medium mb-6 text-lg">Click "Generate Report" to create your ESG assessment report.</p>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-moss text-white border-2 border-moss px-8 py-3 rounded-sm hover:bg-leaf hover:text-moss hover:shadow-[4px_4px_0px_0px_#D2DCB6] disabled:opacity-50 font-bold uppercase tracking-wider transition-all"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

