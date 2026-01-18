import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const NavLink = ({ to, children }) => (
    <Link 
      to={to} 
      className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-2 rounded-sm ${
        isActive(to) 
          ? 'bg-[#F1F3E0] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
          : 'bg-[#778873] text-white border-black hover:bg-[#F1F3E0] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
      }`}
    >
      {children}
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#F1F3E0] font-sans text-black">
      <nav className="bg-[#778873] border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link to="/dashboard" className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                <div className="w-10 h-10 bg-[#F1F3E0] text-black border-2 border-black flex items-center justify-center font-bold rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  E
                </div>
                ESG RESOLVE
              </Link>
              <div className="hidden md:flex space-x-4 items-center">
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/recommendations">Opportunities</NavLink>
                <NavLink to="/roadmap">Execution Plan</NavLink>
                <NavLink to="/ai-chatbot">AI Assistant</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm font-bold text-white bg-black/20 px-4 py-2 rounded-sm border-2 border-transparent">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="bg-[#F1F3E0] text-black border-2 border-black px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  )
}
