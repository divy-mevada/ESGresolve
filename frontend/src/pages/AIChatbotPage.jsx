import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function AIChatbotPage() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [aiServiceStatus, setAiServiceStatus] = useState(null)
  const messagesEndRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    loadSnapshots()
    checkAiServiceStatus()
    
    // Handle initial message from navigation state
    if (location.state?.initialMessage) {
      setInputMessage(location.state.initialMessage)
      if (location.state?.snapshotId) {
        const snapshot = snapshots.find(s => s.id === location.state.snapshotId)
        if (snapshot) setSelectedSnapshot(snapshot)
      }
    }
  }, [location.state])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAiServiceStatus = async () => {
    try {
      const response = await api.get('/ai/status/')
      setAiServiceStatus(response.data)
    } catch (error) {
      console.error('Failed to check AI service status', error)
    }
  }

  const loadSnapshots = async () => {
    try {
      const response = await api.getSnapshots()
      const data = response.data.results || response.data
      setSnapshots(data)
      if (data.length > 0 && !selectedSnapshot) {
        setSelectedSnapshot(data[0])
      }
    } catch (error) {
      console.error('Failed to load snapshots', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedSnapshot) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Use enhanced AI chatbot endpoint
      const response = await api.post('/ai/chatbot/', {
        query: userMessage,
        snapshot_id: selectedSnapshot.id,
        session_id: sessionId
      })

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        context_used: response.data.context_used
      }
      setMessages(prev => [...prev, aiMessage])

      // Update session ID
      if (response.data.session_id) {
        setSessionId(response.data.session_id)
      }

    } catch (error) {
      console.error('Failed to send message', error)
      
      // Fallback response
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check if the AI service is available.',
        timestamp: new Date().toISOString(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(null)
  }

  const getQuickQuestions = () => [
    "How can I improve my environmental score?",
    "What are the most cost-effective ESG improvements?",
    "How do I implement a safety training program?",
    "What governance policies should I prioritize?",
    "How can I reduce my carbon footprint?",
    "What employee benefits improve social scores?",
    "How do I start waste recycling in my office?",
    "What's the ROI of solar panel installation?"
  ]

  const askQuickQuestion = (question) => {
    setInputMessage(question)
  }

  // AI Service Status Badge
  const AIStatusBadge = () => (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      aiServiceStatus?.service_operational 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      🤖 AI {aiServiceStatus?.service_operational ? 'Online' : 'Offline'}
      {aiServiceStatus?.active_client && (
        <span className="ml-1">({aiServiceStatus.active_client})</span>
      )}
    </div>
  )

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI ESG Assistant</h1>
            <p className="text-gray-600 mt-1">Get personalized ESG guidance powered by AI</p>
          </div>
          <div className="flex items-center space-x-4">
            <AIStatusBadge />
            {snapshots.length > 1 && (
              <select
                value={selectedSnapshot?.id || ''}
                onChange={(e) => {
                  const snapshot = snapshots.find(s => s.id === parseInt(e.target.value))
                  setSelectedSnapshot(snapshot)
                  clearChat() // Clear chat when switching assessments
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
        </div>

        {!selectedSnapshot ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">No ESG Assessment Found</h2>
            <p className="text-gray-600 mb-6">Complete an ESG assessment to start chatting with your AI assistant.</p>
            <a href="/esg-form" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
              Start Assessment
            </a>
          </div>
        ) : (
          <>
            {/* Context Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Assessment Context</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedSnapshot.overall_esg_score.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Overall ESG</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedSnapshot.environmental_score.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Environmental</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedSnapshot.social_score.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Social</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedSnapshot.governance_score.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Governance</div>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-semibold">ESG AI Assistant</h3>
                      <p className="text-sm opacity-90">
                        Powered by {aiServiceStatus?.active_client || 'AI'} • 
                        {aiServiceStatus?.active_model || 'Advanced Model'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearChat}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Clear Chat
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-4">👋</div>
                    <p className="text-lg font-medium mb-2">Hello! I'm your AI ESG Assistant</p>
                    <p className="text-sm">Ask me anything about improving your ESG performance, implementing recommendations, or understanding your scores.</p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.isError
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                      {message.context_used && (
                        <div className="text-xs mt-1 text-gray-500 border-t pt-1">
                          Context: {message.context_used.business_name} • 
                          Overall: {message.context_used.overall_score?.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length === 0 && (
                <div className="border-t p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getQuickQuestions().slice(0, 4).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => askQuickQuestion(question)}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-3">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      aiServiceStatus?.service_operational 
                        ? "Ask me about ESG improvements, implementation steps, costs, or any other questions..."
                        : "AI service is currently offline. Please check your configuration."
                    }
                    disabled={!aiServiceStatus?.service_operational || loading}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
                    rows="2"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || !aiServiceStatus?.service_operational || loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
                
                {!aiServiceStatus?.service_operational && (
                  <div className="mt-2 text-sm text-red-600">
                    ⚠️ AI service is offline. Please configure your API keys in the backend settings.
                  </div>
                )}
              </div>
            </div>

            {/* AI Features Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 AI-Powered Features</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-medium text-gray-800">Personalized Advice</h4>
                  <p className="text-sm text-gray-600">Context-aware recommendations based on your specific ESG scores and business profile</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💡</div>
                  <h4 className="font-medium text-gray-800">Implementation Guidance</h4>
                  <p className="text-sm text-gray-600">Step-by-step instructions for implementing ESG improvements in your business</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <h4 className="font-medium text-gray-800">Cost Analysis</h4>
                  <p className="text-sm text-gray-600">Budget-friendly solutions and ROI calculations for ESG investments</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}