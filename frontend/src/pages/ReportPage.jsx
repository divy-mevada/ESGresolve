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
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assessment Found</h2>
          <p className="text-gray-600 mb-8">Complete an ESG assessment to generate a report.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ESG Report</h1>
          <div className="flex space-x-4">
            {snapshots.length > 1 && (
              <select
                value={selectedSnapshot.id}
                onChange={(e) => {
                  const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                  setSelectedSnapshot(snapshot)
                  setReportHtml(null)
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
            {!reportHtml && (
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            )}
            {reportHtml && (
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Download/Print
              </button>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This report is indicative and does not constitute a certified ESG rating 
            or regulatory compliance advice. All outputs are based on provided data.
          </p>
        </div>

        {reportHtml ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">Click "Generate Report" to create your ESG assessment report.</p>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

