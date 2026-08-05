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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e5e5e7]/60 transition-all select-none">
      <nav 
        className="max-w-6xl mx-auto px-6 h-14 sm:h-16 flex items-center justify-between text-sm font-semibold text-[#1d1d1f]"
        aria-label="Global navigation"
      >
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-xl shrink-0"
        >
          <Logo size="md" />
        </Link>

        {/* Luxurious Navigation Links Capsule Track */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#f4f4f7] border border-[#e5e5e7] transform-gpu select-none">
          {navLinks.map((link) => {
            const isActive = !link.isHash && location.pathname === link.path
            return link.isHash ? (
              <a
                key={link.path}
                href={link.path}
                className="px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-[#525255] hover:text-[#0066cc] hover:bg-white transition-colors duration-150 ease-out transform-gpu select-none"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold transition-colors duration-150 ease-out transform-gpu select-none ${
                  isActive
                    ? 'bg-[#0066cc] text-white shadow-xs'
                    : 'text-[#525255] hover:text-[#0066cc] hover:bg-white'
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
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-[#3a3a3c] hover:text-[#0066cc] hover:bg-[#f4f4f7] transition-all duration-200"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#0066cc] via-[#0077ed] to-[#0055b3] text-white text-xs sm:text-sm font-bold hover:shadow-[0_6px_20px_rgba(0,102,204,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-[#0066cc]/25 flex items-center gap-1.5"
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
