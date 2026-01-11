import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function ChatbotPage() {
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    loadSnapshots()
  }, [])

  useEffect(() => {
    // Handle initial message from opportunities page
    if (location.state?.initialMessage && selectedSnapshot) {
      setInput(location.state.initialMessage)
      // Auto-send the initial message
      setTimeout(() => {
        handleSendMessage(location.state.initialMessage)
      }, 500)
    }
  }, [location.state, selectedSnapshot])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSnapshots = async () => {
    try {
      const response = await api.getSnapshots()
      const data = response.data.results || response.data
      setSnapshots(data)
      
      // Set selected snapshot from location state or default to first
      if (location.state?.snapshotId) {
        const targetSnapshot = data.find(s => s.id === location.state.snapshotId)
        setSelectedSnapshot(targetSnapshot || data[0])
      } else if (data.length > 0) {
        setSelectedSnapshot(data[0])
      }
    } catch (error) {
      console.error('Failed to load snapshots', error)
    }
  }

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedSnapshot) return

    const userMessage = messageText.trim()
    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const response = await api.chatQuery({
        snapshot_id: selectedSnapshot.id,
        query: userMessage,
        session_id: sessionId
      })
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: response.data.response }
      ])
      if (response.data.session_id) {
        setSessionId(response.data.session_id)
      }
    } catch (error) {
      console.error('Chat query error:', error)
      console.error('Error details:', error.response?.data || error.message)
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `Sorry, I encountered an error: ${error.response?.data?.error || error.message || 'Please try again.'}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const messageText = input
    setInput('')
    await handleSendMessage(messageText)
  }

  const suggestedQuestions = [
    "How do I implement energy efficiency measures?",
    "Generate SOP for employee safety training",
    "What should I focus on this month?",
    "Add this to my roadmap",
    "How do I establish a governance framework?",
    "Mark this action as completed",
  ]

  if (!selectedSnapshot) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assessment Found</h2>
          <p className="text-gray-600 mb-8">Complete an ESG assessment to use the chatbot.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ESG Chatbot</h1>
          {snapshots.length > 1 && (
            <select
              value={selectedSnapshot.id}
              onChange={(e) => {
                const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                setSelectedSnapshot(snapshot)
                setMessages([])
                setSessionId(null)
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

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This chatbot provides indicative guidance based on your ESG assessment. 
            Responses are not certified ESG advice or regulatory compliance guidance.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
          <div className="p-4 border-b bg-green-50">
            <h2 className="font-semibold text-gray-900">🤖 ESG Implementation Assistant</h2>
            <p className="text-sm text-gray-600">State-aware assistant for ESG implementation guidance and action commands</p>
            <div className="mt-2 text-xs text-gray-500">
              📝 Try: "Generate SOP for [topic]" | ➕ "Add this to my roadmap" | 📅 "What should I focus on this month?"
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p className="mb-4">I'm your ESG Implementation Assistant!</p>
                <p className="text-sm mb-4">I can help you:</p>
                <div className="text-sm space-y-1 mb-4">
                  <p>📄 Generate step-by-step SOPs</p>
                  <p>➕ Add actions to your roadmap</p>
                  <p>📅 Prioritize monthly focus areas</p>
                  <p>✅ Track completed actions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Try these commands:</p>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-gray-500">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about implementing recommendations..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

