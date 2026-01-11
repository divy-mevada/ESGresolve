import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[DEBUG] AuthProvider initializing...')
    const token = localStorage.getItem('token')
    console.log('[DEBUG] Token from localStorage:', token ? `${token.substring(0, 10)}...` : 'null')
    
    if (token) {
      console.log('[DEBUG] Setting authorization header')
      api.defaults.headers.common['Authorization'] = `Token ${token}`
      // Optionally fetch user data
      setUser({ token })
      console.log('[DEBUG] User set with token')
    } else {
      console.log('[DEBUG] No token found, user remains null')
    }
    setLoading(false)
    console.log('[DEBUG] AuthProvider initialization complete')
  }, [])

  const login = async (username, password) => {
    try {
      console.log('[DEBUG] Attempting login with:', { username, passwordProvided: !!password })
      const response = await api.post('/auth/login/', { username, password })
      console.log('[DEBUG] Login response:', response.data)
      
      const { token, user } = response.data
      
      if (!token) {
        console.error('[DEBUG] No token received from server')
        return { success: false, error: 'No authentication token received' }
      }
      
      console.log('[DEBUG] Storing token and setting user')
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Token ${token}`
      setUser({ ...user, token })
      
      console.log('[DEBUG] Login successful')
      return { success: true }
    } catch (error) {
      console.error('[DEBUG] Login error:', error)
      console.error('[DEBUG] Error response:', error.response?.data)
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Login failed' 
      }
    }
  }

  const signup = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register/', { username, email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Token ${token}`
      setUser({ ...user, token })
      return { success: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.response?.data?.error || 'Signup failed' }
    }
  }

  const googleLogin = async (authCode) => {
    try {
      console.log('[DEBUG] Attempting Google login with auth code')
      const response = await api.post('/auth/google/', { code: authCode })
      console.log('[DEBUG] Google login response:', response.data)
      
      const { token, user } = response.data
      
      if (!token) {
        console.error('[DEBUG] No token received from Google login')
        return { success: false, error: 'No authentication token received' }
      }
      
      console.log('[DEBUG] Storing Google token and setting user')
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Token ${token}`
      setUser({ ...user, token })
      
      console.log('[DEBUG] Google login successful')
      return { success: true }
    } catch (error) {
      console.error('[DEBUG] Google login error:', error)
      console.error('[DEBUG] Error response:', error.response?.data)
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Google login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}