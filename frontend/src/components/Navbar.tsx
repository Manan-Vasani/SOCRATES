import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuthStore } from '../store/useAuthStore'
import { User, LogOut, LayoutDashboard } from 'lucide-react'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e0e0e0]/60 transition-all select-none">
      <nav 
        className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-xs font-normal text-[#1d1d1f]"
        aria-label="Global navigation"
      >
        <Link to="/" className="hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-lg">
          <Logo size="sm" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[#1d1d1f]/80">
          <a href="/#why-socrates" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Why SOCRATES</a>
          <a href="/#ai-tutor" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">AI Tutor</a>
          <a href="/#how-it-works" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">How It Works</a>
          <Link to="/tutors" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Tutors</Link>
          <a href="/#pricing" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 text-[#1d1d1f] hover:text-[#0066cc] transition-colors group cursor-pointer"
              title="View Profile"
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="font-semibold text-xs text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors max-w-[140px] truncate">
                {user.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="hover:text-[#0066cc] transition-colors font-medium focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] text-white font-medium hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
