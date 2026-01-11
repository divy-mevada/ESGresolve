import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    // Log error details for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      })
    } else if (error.request) {
      console.error('API Request Error:', {
        message: 'No response received',
        url: error.config?.url
      })
    } else {
      console.error('API Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// API service functions
api.getBusinessProfiles = () => api.get('/business-profiles/')
api.getBusinessProfile = () => api.get('/business-profiles/') // Alias for compatibility
api.createBusinessProfile = (data) => api.post('/business-profiles/', data)
api.updateBusinessProfile = (id, data) => api.put(`/business-profiles/${id}/`, data)

api.getSnapshots = () => api.get('/esg-snapshots/')
api.getSnapshot = (id) => api.get(`/esg-snapshots/${id}/`)
api.getRecommendations = (snapshotId) => api.get(`/esg-snapshots/${snapshotId}/recommendations/`)
api.getRoadmap = (snapshotId) => api.get(`/esg-snapshots/${snapshotId}/roadmap/`)

api.createESGInput = (data) => api.post('/esg-inputs/', data)
api.processESGInput = (id) => api.post(`/esg-inputs/${id}/process/`)

api.generateRoadmap = (data) => api.post('/esg/roadmap/', data)
api.chatQuery = (data) => api.post('/chat/query/', data)
api.generateReport = (snapshotId) => api.get(`/esg/report/?snapshot_id=${snapshotId}`)

// New AI-powered endpoints
api.aiComprehensiveAnalysis = (data) => api.post('/ai/comprehensive-analysis/', data)
api.aiChatbotQuery = (data) => api.post('/ai/chatbot/', data)
api.generateAIReport = (data) => api.post('/ai/report/', data)
api.getAIServiceStatus = () => api.get('/ai/status/')

export { api }
export default api
