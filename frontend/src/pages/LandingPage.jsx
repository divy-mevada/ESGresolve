import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">ESG Resolve</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-gray-900 px-4 py-2">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ESG Analytics & Readiness Platform
            <span className="block text-green-600 mt-2">for Small & Medium Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Understand your baseline ESG position, get actionable recommendations, and implement 
            improvements with AI-guided execution. All outputs are indicative and SME-friendly.
          </p>
          <div className="flex justify-center space-x-4">
            {!user && (
              <>
                <Link to="/signup" className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700">
                  Start Free Assessment
                </Link>
                <Link to="/login" className="bg-white text-green-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-green-600 hover:bg-green-50">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">ESG Analytics</h3>
            <p className="text-gray-600">
              Get comprehensive ESG scores with confidence levels. Understand your Environmental, 
              Social, and Governance performance.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 text-4xl mb-4">💡</div>
            <h3 className="text-xl font-semibold mb-2">Actionable Recommendations</h3>
            <p className="text-gray-600">
              Receive practical, prioritized recommendations tailored to your business size and industry.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Chatbot & Roadmap</h3>
            <p className="text-gray-600">
              Get step-by-step implementation guidance and a 30-60-90 day action roadmap.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This platform provides indicative ESG assessments and does not 
            constitute a certified ESG rating or regulatory compliance advice. All outputs are based on 
            provided data and are meant to serve as a baseline understanding.
          </p>
        </div>
      </div>
    </div>
  )
}

