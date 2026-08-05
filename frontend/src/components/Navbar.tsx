import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuthStore } from '../store/useAuthStore'
import { getInitialsAvatar } from '../services/authService'
import { Sparkles } from 'lucide-react'

export default function Navbar() {
  const { user } = useAuthStore()
  const location = useLocation()

  const navLinks = [
    { path: '/practice', label: 'AI Practice' },
    { path: '/community', label: 'Community' },
    { path: '/recordings', label: 'AI Recaps' },
    { path: '/tutors', label: 'Tutors' },
    { path: '/#pricing', label: 'Pricing', isHash: true },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-[#e5e5e7]/60 transition-all select-none">
      <nav 
        className="max-w-6xl mx-auto h-14 sm:h-16 px-6 flex items-center justify-between transition-all duration-300 transform-gpu"
        aria-label="Global navigation"
      >
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-xl shrink-0"
        >
          <Logo size="md" />
        </Link>

        {/* Clean Nav Links Without Card Background */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = !link.isHash && location.pathname === link.path
            return link.isHash ? (
              <a
                key={link.path}
                href={link.path}
                className="px-4 py-2 rounded-full text-sm font-semibold text-[#1d1d1f] hover:text-[#0066cc] hover:bg-[#0066cc]/5 transition-all duration-150"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm transition-all duration-150 ${
                  isActive
                    ? 'text-[#0066cc] font-bold bg-[#0066cc]/10'
                    : 'font-semibold text-[#1d1d1f] hover:text-[#0066cc] hover:bg-[#0066cc]/5'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* User / Auth Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#f4f4f7] hover:bg-white border border-[#e5e5e7] text-[#1d1d1f] hover:border-[#0066cc]/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
              title="My Profile"
            >
              <img
                src={user.profileImage || user.avatar || getInitialsAvatar(user.fullName || user.name)}
                alt={user.fullName || user.name}
                onError={(e) => {
                  e.currentTarget.src = getInitialsAvatar(user.fullName || user.name)
                }}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-[#0066cc]/20"
              />
              <span className="font-bold text-xs sm:text-sm text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors max-w-[130px] truncate">
                {user.fullName || user.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-full text-sm font-bold text-[#1d1d1f] hover:text-[#0066cc] hover:bg-[#f4f4f7] transition-all duration-200"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0077ed] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-white/90" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
