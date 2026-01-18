import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signup(username, email, password)
    if (result.success) {
      navigate('/business-setup')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleGoogleSuccess = () => {
    navigate('/business-setup')
  }

  const handleGoogleError = (error) => {
    setError(error)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border-2 border-moss shadow-[8px_8px_0px_0px_#A1BC98] rounded-sm p-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-center text-moss mb-2">ESG Resolve</h1>
        <p className="text-center text-moss/70 font-medium mb-8">CREATE YOUR ACCOUNT</p>

        {error && (
          <div className="bg-red-50 border-2 border-red-700 text-red-700 px-4 py-3 rounded-sm mb-4 font-bold">
            {error}
          </div>
        )}

        <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium uppercase tracking-wider">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#D2DCB6] transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#D2DCB6] transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#D2DCB6] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-moss text-white border-2 border-moss py-2 px-4 rounded-sm hover:bg-leaf hover:text-moss hover:shadow-[4px_4px_0px_0px_#D2DCB6] disabled:opacity-50 font-bold uppercase tracking-wider transition-all"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-moss font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-leaf hover:text-moss font-bold underline decoration-2">
            Sign in
          </Link>
        </p>

        <Link to="/" className="block mt-4 text-center text-sm text-moss/60 hover:text-moss font-bold uppercase tracking-wider">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

