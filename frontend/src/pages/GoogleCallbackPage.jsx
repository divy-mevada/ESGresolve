import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { googleLogin } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      if (error) {
        console.error('Google OAuth error:', error)
        navigate('/login?error=google_auth_failed')
        return
      }

      if (code) {
        try {
          // Exchange code for token via backend
          const result = await googleLogin(code)
          if (result.success) {
            navigate('/dashboard')
          } else {
            navigate('/login?error=' + encodeURIComponent(result.error))
          }
        } catch (error) {
          console.error('Google login error:', error)
          navigate('/login?error=google_login_failed')
        }
      } else {
        navigate('/login?error=no_auth_code')
      }
    }

    handleCallback()
  }, [navigate, googleLogin])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing Google sign in...</p>
      </div>
    </div>
  )
}