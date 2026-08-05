import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuthStore } from '../store/useAuthStore'
import { getInitialsAvatar } from '../services/authService'
import { User, LogOut, LayoutDashboard, Video } from 'lucide-react'
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

        <div className="hidden md:flex items-center gap-7 text-[#1d1d1f]/80">
          <Link to="/practice" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">AI Practice</Link>
          <Link to="/community" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Community</Link>
          <Link to="/recordings" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">AI Recaps</Link>
          <Link to="/tutors" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Tutors</Link>
          <a href="/#pricing" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-1 py-1 rounded-full text-[#1d1d1f] hover:opacity-80 transition-all group cursor-pointer select-none"
                title="My Profile"
              >
                <img
                  src={user.profileImage || user.avatar || getInitialsAvatar(user.fullName || user.name)}
                  alt={user.fullName || user.name}
                  onError={(e) => {
                    e.currentTarget.src = getInitialsAvatar(user.fullName || user.name)
                  }}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <span className="font-semibold text-xs text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors max-w-[140px] truncate">
                  {user.fullName || user.name}
                </span>
              </Link>
            </div>
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
