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
    <div className="min-h-screen bg-cream font-sans text-moss selection:bg-leaf selection:text-white">
      {/* Navigation */}
      <nav className="bg-moss text-cream border-b-4 border-leaf sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sage text-moss flex items-center justify-center font-bold rounded-sm">
                E
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white">
                ESG RESOLVE
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="bg-sage text-moss px-6 py-2 rounded-sm font-bold hover:bg-white transition-all shadow-md"
                >
                  DASHBOARD
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sage hover:text-white font-medium transition-colors uppercase text-sm tracking-wider">
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-sage text-moss px-6 py-2 rounded-sm font-bold hover:bg-white transition-all shadow-md"
                  >
                    GET STARTED
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-moss text-sage px-4 py-1 rounded-sm mb-8 border border-leaf">
            <span className="text-xs font-bold uppercase tracking-widest">System Update: AI Roadmap 2.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-moss mb-8 tracking-tighter leading-tight">
            ESG ANALYTICS <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-leaf to-moss">FOR THE BOLD</span>
          </h1>
          <p className="text-xl md:text-2xl text-moss/80 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Institutional-grade ESG readiness. 
            Actionable intelligence. 
            <span className="block mt-2 font-bold text-moss">Zero fluff.</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {!user && (
              <>
                <Link 
                  to="/signup" 
                  className="group bg-moss text-cream px-8 py-4 rounded-sm text-lg font-bold hover:bg-leaf transition-all flex items-center shadow-[4px_4px_0px_0px_#A1BC98] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-moss"
                >
                  START ASSESSMENT
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login" 
                  className="bg-transparent text-moss px-8 py-4 rounded-sm text-lg font-bold border-2 border-moss hover:bg-moss hover:text-cream transition-all"
                >
                  SIGN IN
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<BarChart3 className="w-8 h-8" />}
            title="PRECISION ANALYTICS"
            description="Scoring across Environment, Social, and Governance pillars with calculated confidence vectors."
          />
          <FeatureCard 
            icon={<Lightbulb className="w-8 h-8" />}
            title="STRATEGIC INTELLIGENCE"
            description="Prioritized recommendations tailored specifically to your operational footprint and industry sector."
          />
          <FeatureCard 
            icon={<Bot className="w-8 h-8" />}
            title="AI ORCHESTRATION"
            description="Deploy a step-by-step execution plan managed by our intelligent compliance neural network."
          />
        </div>

        {/* Disclaimer */}
        <div className="mt-32 bg-white border-l-4 border-moss p-8 shadow-lg flex items-start space-x-6">
          <ShieldCheck className="text-leaf w-12 h-12 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-black text-moss mb-2 uppercase text-sm tracking-widest">Compliance Protocol</h4>
            <p className="text-moss/70 leading-relaxed font-medium">
              This platform provides indicative ESG assessments. Outputs serve as a baseline for internal development. 
              Not legal advice. Proceed with diligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group bg-white p-8 border-2 border-transparent hover:border-moss transition-all duration-300 shadow-md hover:shadow-[8px_8px_0px_0px_#778873]">
      <div className="bg-cream text-moss w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-moss group-hover:text-cream transition-colors rounded-sm">
        {icon}
      </div>
      <h3 className="text-xl font-black text-moss mb-4 tracking-tight">{title}</h3>
      <p className="text-moss/70 leading-relaxed font-medium">
        {description}
      </p>
      <div className="mt-8 flex items-center text-leaf font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase text-sm tracking-wider">
        <span>Explore</span>
        <ArrowRight className="ml-2 w-4 h-4" />
      </div>
    </div>
  )
}
