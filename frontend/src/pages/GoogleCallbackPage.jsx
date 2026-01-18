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
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center p-8 border-2 border-moss rounded-sm bg-white shadow-[4px_4px_0px_0px_#D2DCB6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moss mx-auto mb-4"></div>
        <p className="text-moss font-bold uppercase tracking-wider">Completing Google sign in...</p>
      </div>
    </div>
  )
}