import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuthStore } from '../store/useAuthStore'
import { getInitialsAvatar } from '../services/authService'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { name: 'AI Practice', path: '/practice' },
    { name: 'Community', path: '/community' },
    { name: 'AI Recaps', path: '/recordings' },
    { name: 'Tutors', path: '/tutors' },
    { name: 'Pricing', path: '/#pricing' },
  ]

  const isProfileActive = location.pathname === '/profile' || location.pathname === '/dashboard'

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#e0e0e0]/60 transition-all select-none">
      <nav 
        className="max-w-6xl mx-auto px-6 h-13 flex items-center justify-between text-xs font-normal text-[#1d1d1f]"
        aria-label="Global navigation"
      >
        <Link to="/" className="hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-lg">
          <Logo size="sm" />
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isPricing = link.path === '/#pricing'
            const isActive = isPricing
              ? location.pathname === '/' && location.hash === '#pricing'
              : location.pathname === link.path

            if (isPricing) {
              return (
                <a
                  key={link.path}
                  href={link.path}
                  className={`text-xs font-semibold transition-colors duration-150 select-none transform-gpu ${
                    isActive
                      ? 'text-[#0066cc]'
                      : 'text-[#1d1d1f]/80 hover:text-[#0066cc]'
                  }`}
                >
                  {link.name}
                </a>
              )
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-semibold transition-colors duration-150 select-none transform-gpu ${
                  isActive
                    ? 'text-[#0066cc]'
                    : 'text-[#1d1d1f]/80 hover:text-[#0066cc]'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 text-[#1d1d1f] transition-all group cursor-pointer select-none"
                title="My Profile"
              >
                <img
                  src={user.profileImage || user.avatar || getInitialsAvatar(user.fullName || user.name)}
                  alt={user.fullName || user.name}
                  onError={(e) => {
                    e.currentTarget.src = getInitialsAvatar(user.fullName || user.name)
                  }}
                  className={`w-8 h-8 rounded-full object-cover shrink-0 border ${
                    isProfileActive ? 'border-[#0066cc]' : 'border-transparent'
                  }`}
                />
                <span className={`text-xs font-semibold max-w-[140px] truncate transition-colors ${
                  isProfileActive ? 'text-[#0066cc]' : 'text-[#1d1d1f] group-hover:text-[#0066cc]'
                }`}>
                  {user.fullName || user.name}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="hover:text-[#0066cc] transition-colors font-semibold focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] text-white font-semibold hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] shadow-sm"
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
