import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, User, Mail, ShieldCheck, Calendar, BookOpen, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/useAuthStore'
import { logoutAuthUser, fetchAuthenticatedUser, getInitialsAvatar } from '../services/authService'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token, setAuth, logout } = useAuthStore()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('socrates_token', tokenFromUrl)
      fetchAuthenticatedUser()
        .then((fetchedUser) => {
          if (fetchedUser) {
            setAuth(fetchedUser, tokenFromUrl)
          }
        })
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname)
        })
    } else if (!token && !user) {
      toast.error('Please log in to view your dashboard')
      navigate('/login')
    }
  }, [token, user, navigate, setAuth])

  const handleLogout = async () => {
    try {
      await logoutAuthUser()
    } catch (error) {
      // Ignore network errors on logout
    } finally {
      logout()
      toast.success('Successfully logged out')
      navigate('/login')
    }
  }

  const displayName = user?.fullName || user?.name || 'Scholar'
  const displayImage =
    user?.profileImage ||
    user?.avatar ||
    getInitialsAvatar(displayName)
  const displayEmail = user?.email || ''
  const provider = user?.provider === 'google' ? 'Google OAuth 2.0' : 'Email & Password'
  const roleDisplay = (user?.role || 'student').toUpperCase()
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently'

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Welcome Header */}
          <div className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <img
                  src={displayImage}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.src = getInitialsAvatar(displayName)
                  }}
                  className="w-20 h-20 rounded-2xl object-cover border border-[#e5e5e5] shadow-sm transform-gpu antialiased"
                />
                {user?.provider === 'google' && (
                  <span
                    className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs border border-[#e5e5e5]"
                    title="Authenticated via Google"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                    Welcome, {displayName}!
                  </h1>
                  <Sparkles className="w-5 h-5 text-[#0066cc]" />
                </div>
                <p className="text-sm text-[#6e6e73]">
                  Member since {joinedDate} • SOCRATES Peer Mentorship Hub
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30] text-sm font-semibold transition-colors cursor-pointer select-none transform-gpu antialiased shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </motion.button>
          </div>

          {/* User Profile Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Name Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#6e6e73] uppercase tracking-wider">
                  Full Name
                </span>
                <p className="text-base font-semibold text-[#1d1d1f] mt-0.5">{displayName}</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#6e6e73] uppercase tracking-wider">
                  Email Address
                </span>
                <p className="text-base font-semibold text-[#1d1d1f] mt-0.5 truncate">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Provider & Role Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#6e6e73] uppercase tracking-wider">
                  Auth Method & Role
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5f7] border border-[#e5e5e5] text-[#1d1d1f]">
                    {provider}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0066cc]/10 text-[#0066cc]">
                    {roleDisplay}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-xs space-y-6">
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Quick Navigation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-5 rounded-2xl border border-[#e5e5e5] hover:border-[#0066cc] bg-[#fafafa] hover:bg-white transition-all text-left group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1d1d1f]">View Full Profile</h3>
                    <p className="text-xs text-[#6e6e73]">Manage subjects, bio, and settings</p>
                  </div>
                </div>
                <span className="text-[#0066cc] font-semibold text-sm">→</span>
              </button>

              <button
                onClick={() => navigate('/tutors')}
                className="p-5 rounded-2xl border border-[#e5e5e5] hover:border-[#0066cc] bg-[#fafafa] hover:bg-white transition-all text-left group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1d1d1f]">Find Tutors & Mentors</h3>
                    <p className="text-xs text-[#6e6e73]">Explore verified peer tutors</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-semibold text-sm">→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
