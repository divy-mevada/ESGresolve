import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  BarChart3, 
  Lightbulb, 
  Bot, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-emerald-600 p-1.5 rounded-lg mr-2">
                <BarChart3 className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                ESG<span className="text-emerald-600">Resolve</span>
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="bg-emerald-600 text-white px-5 py-2 rounded-full font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-emerald-200"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-emerald-600 text-white px-5 py-2 rounded-full font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-emerald-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-6">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">New: AI Roadmap 2.0</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            ESG Analytics & Readiness 
            <span className="block text-emerald-600 mt-2">for Emerging Businesses</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transition from baseline to ESG excellence. Get actionable recommendations 
            and implement improvements with institutional-grade AI guidance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {!user && (
              <>
                <Link 
                  to="/signup" 
                  className="group bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-emerald-700 transition-all flex items-center shadow-lg shadow-emerald-100"
                >
                  Start Free Assessment
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login" 
                  className="bg-white text-slate-700 px-8 py-4 rounded-xl text-lg font-bold border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-28 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<BarChart3 className="w-8 h-8" />}
            title="ESG Analytics"
            description="Comprehensive scoring across Environment, Social, and Governance pillars with data-driven confidence levels."
          />
          <FeatureCard 
            icon={<Lightbulb className="w-8 h-8" />}
            title="Actionable Strategy"
            description="Receive prioritized recommendations tailored specifically to your industry size and operational footprint."
          />
          <FeatureCard 
            icon={<Bot className="w-8 h-8" />}
            title="AI Roadmap"
            description="Deploy a step-by-step 30-60-90 day execution plan managed by our intelligent compliance assistant."
          />
        </div>

        {/* Disclaimer */}
        <div className="mt-24 bg-white border border-slate-200 p-8 rounded-2xl flex items-start space-x-4 shadow-sm">
          <ShieldCheck className="text-emerald-600 w-10 h-10 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900 mb-1 uppercase text-xs tracking-widest">Compliance Notice</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              This platform provides indicative ESG assessments and does not constitute a certified ESG rating or legal regulatory advice. 
              All outputs are intended to serve as a baseline for internal development and continuous improvement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
      <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex items-center text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Learn more</span>
        <ArrowRight className="ml-2 w-4 h-4" />
      </div>
    </div>
  )
}
