import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../utils/api'
import { Bot } from 'lucide-react'

export default function ChatbotPage() {
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [aiStatus, setAiStatus] = useState(null)
  const messagesEndRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    loadSnapshots()
    // Test AI service status
    testAIService()
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

  const testAIService = async () => {
    try {
      const response = await api.getAIServiceStatus()
      setAiStatus(response.data)
      console.log('AI Service Status:', response.data)
    } catch (error) {
      console.error('Failed to check AI service status:', error)
      setAiStatus({ service_operational: false, error: error.message })
    }
  }

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedSnapshot) return

    const userMessage = messageText.trim()
    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Use the AI chatbot endpoint
      const response = await api.aiChatbotQuery({
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
      console.error('AI Chat query error:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      // Fallback to old endpoint if AI fails
      try {
        const fallbackResponse = await api.chatQuery({
          snapshot_id: selectedSnapshot.id,
          query: userMessage,
          session_id: sessionId
        })
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: fallbackResponse.data.response }
        ])
        if (fallbackResponse.data.session_id) {
          setSessionId(fallbackResponse.data.session_id)
        }
      } catch (fallbackError) {
        console.error('Fallback chat error:', fallbackError)
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: `I'm having trouble connecting to the AI service right now. Please try again in a moment, or check if your internet connection is stable.` }
        ])
      }
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
        <div className="text-center py-12 bg-cream rounded-sm border-2 border-moss m-6 shadow-[8px_8px_0px_0px_#778873]">
          <h2 className="text-3xl font-black text-moss mb-4 uppercase tracking-tighter">No Assessment Found</h2>
          <p className="text-moss mb-8 font-medium">Complete an ESG assessment to use the chatbot.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border-b-4 border-moss mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-moss tracking-tighter uppercase">ESG Chatbot</h1>
          {snapshots.length > 1 && (
            <select
              value={selectedSnapshot.id}
              onChange={(e) => {
                const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                setSelectedSnapshot(snapshot)
                setMessages([])
                setSessionId(null)
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

        <div className="bg-cream border-2 border-moss p-6 rounded-sm shadow-[4px_4px_0px_0px_#778873] mb-8">
          <p className="text-moss font-medium">
            <strong className="font-black uppercase">Disclaimer:</strong> This chatbot provides indicative guidance based on your ESG assessment. 
            Responses are not certified ESG advice or regulatory compliance guidance.
          </p>
        </div>

        <div className="bg-white rounded-sm border-2 border-moss shadow-[8px_8px_0px_0px_#D2DCB6] h-[600px] flex flex-col">
          <div className="p-6 border-b-2 border-moss bg-cream">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-black text-moss flex items-center text-xl uppercase tracking-tight">
                  <Bot className="w-6 h-6 mr-3 text-moss" />
                  ESG Implementation Assistant
                </h2>
                <p className="text-sm text-sage font-bold uppercase mt-1">State-aware assistant for ESG implementation guidance and action commands</p>
              </div>
              {aiStatus && (
                <div className={`px-3 py-1 rounded-sm text-xs font-bold uppercase ${
                  aiStatus.service_operational 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {aiStatus.service_operational ? '🤖 AI Connected' : '⚠️ AI Offline'}
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-moss font-medium bg-white p-2 border border-moss rounded-sm inline-block">
              📝 Try: "Generate SOP for [topic]" | ➕ "Add this to my roadmap" | 📅 "What should I focus on this month?"
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-moss py-8">
                <Bot className="w-20 h-20 mx-auto mb-6 text-moss" />
                <p className="mb-4 font-black text-xl uppercase">I'm your ESG Implementation Assistant!</p>
                <p className="text-sm mb-6 font-bold uppercase">I can help you:</p>
                <div className="text-sm space-y-2 mb-8 font-medium">
                  <p className="bg-cream inline-block px-3 py-1 border border-moss rounded-sm">📄 Generate step-by-step SOPs</p>
                  <br/>
                  <p className="bg-cream inline-block px-3 py-1 border border-moss rounded-sm">➕ Add actions to your roadmap</p>
                  <br/>
                  <p className="bg-cream inline-block px-3 py-1 border border-moss rounded-sm">📅 Prioritize monthly focus areas</p>
                  <br/>
                  <p className="bg-cream inline-block px-3 py-1 border border-moss rounded-sm">✅ Track completed actions</p>
                </div>
                <div className="space-y-3 max-w-md mx-auto">
                  <p className="text-sm font-black uppercase">Try these commands:</p>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="block w-full text-left px-4 py-3 bg-white hover:bg-moss hover:text-white border-2 border-moss rounded-sm text-sm font-bold uppercase transition-all duration-200 shadow-[2px_2px_0px_0px_#A1BC98] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
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
                  className={`max-w-[80%] rounded-sm p-4 border-2 border-moss ${
                    msg.role === 'user'
                      ? 'bg-moss text-white shadow-[4px_4px_0px_0px_#A1BC98]'
                      : 'bg-white text-moss shadow-[4px_4px_0px_0px_#D2DCB6]'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream rounded-sm p-4 border-2 border-moss">
                  <p className="text-moss font-black uppercase animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-6 border-t-2 border-moss bg-white">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ASK ABOUT IMPLEMENTING RECOMMENDATIONS..."
                className="flex-1 px-4 py-3 border-2 border-moss rounded-sm focus:outline-none focus:bg-cream placeholder-sage font-bold text-moss uppercase"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-moss text-white px-8 py-3 rounded-sm border-2 border-moss hover:bg-leaf font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#778873] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50"
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

