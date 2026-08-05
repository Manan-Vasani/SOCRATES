import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuthStore } from '../store/useAuthStore'
import { getInitialsAvatar } from '../services/authService'
import { User, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { path: '/practice', label: 'AI Practice' },
    { path: '/community', label: 'Community' },
    { path: '/recordings', label: 'AI Recaps' },
    { path: '/tutors', label: 'Tutors' },
    { path: '/#pricing', label: 'Pricing', isHash: true },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#e5e5e7] transition-all select-none">
      <nav 
        className="max-w-6xl mx-auto px-6 h-14 sm:h-16 flex items-center justify-between text-sm font-semibold text-[#1d1d1f]"
        aria-label="Global navigation"
      >
        <Link to="/" className="hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-lg shrink-0">
          <Logo size="md" />
        </Link>

        {/* Big, Crisp, Beautiful Navigation Links */}
        <div className="hidden md:flex items-center gap-2 text-[#1d1d1f]">
          {navLinks.map((link) => {
            const isActive = !link.isHash && location.pathname === link.path
            return link.isHash ? (
              <a
                key={link.path}
                href={link.path}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-[#3a3a3c] hover:text-[#0066cc] hover:bg-[#0066cc]/5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#0066cc]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-xl text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#0066cc] ${
                  isActive
                    ? 'text-[#0066cc] font-bold bg-[#0066cc]/8'
                    : 'font-semibold text-[#3a3a3c] hover:text-[#0066cc] hover:bg-[#0066cc]/5'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-[#e5e5e7] text-[#1d1d1f] transition-all group cursor-pointer select-none"
                title="My Profile"
              >
                <img
                  src={user.profileImage || user.avatar || getInitialsAvatar(user.fullName || user.name)}
                  alt={user.fullName || user.name}
                  onError={(e) => {
                    e.currentTarget.src = getInitialsAvatar(user.fullName || user.name)
                  }}
                  className="w-8 h-8 rounded-xl object-cover shrink-0 ring-1 ring-black/10"
                />
                <span className="font-bold text-xs sm:text-sm text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors max-w-[140px] truncate">
                  {user.fullName || user.name}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-[#1d1d1f] hover:text-[#0066cc] hover:bg-[#0066cc]/5 transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-4.5 py-2 rounded-full bg-[#0066cc] text-white text-sm font-bold hover:bg-[#0077ed] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] shadow-sm hover:shadow-md"
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
