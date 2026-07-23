import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  Award,
  DollarSign,
  Star,
  Clock,
  UserCheck,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  X,
  Layers,
  TrendingUp,
  Bookmark,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { updateUserProfileApi } from '../services/api'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'

export default function Profile() {
  const { user, updateUser, activePerspective, setPerspective, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/')
  }

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    hourlyRate: user?.hourlyRate || 45,
    avatar: user?.avatar || '',
    subjectsText: user?.subjects ? user.subjects.join(', ') : '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        bio: user.bio,
        hourlyRate: user.hourlyRate || 45,
        avatar: user.avatar,
        subjectsText: user.subjects.join(', '),
      })
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const subjectsArr = formData.subjectsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const updatePayload = {
      name: formData.name,
      bio: formData.bio,
      hourlyRate: Number(formData.hourlyRate),
      avatar: formData.avatar,
      subjects: subjectsArr,
    }

    const result = await updateUserProfileApi(updatePayload)
    updateUser(updatePayload)
    setIsSaving(false)

    if (result.success !== false) {
      toast.success('Profile updated successfully!')
      setIsEditModalOpen(false)
    } else {
      toast.info('Profile saved to local state.')
      setIsEditModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/10 selection:text-[#0066cc] pb-20">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,102,204,0.04)_0%,_transparent_60%)] pointer-events-none z-0" />

      {/* Global Navbar */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-10 relative z-10 space-y-8">
        {/* Profile Hero Card */}
        <div className="relative rounded-3xl bg-white border border-[#e5e5e7] p-8 overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* User Details Left */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={user?.name || 'User Avatar'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#0066cc] shadow-md group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-0 right-0 p-2 bg-[#0066cc] hover:bg-[#0077ed] text-white rounded-full shadow-md transition-transform hover:scale-110"
                  title="Change Avatar"
                >
                  <Edit3 size={13} />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-display font-bold tracking-tight text-[#1d1d1f]">
                    {user?.name || 'Alex Rivera'}
                  </h1>
                  {user?.isVerified && (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 text-[#0066cc]"
                      title="Verified Educator & Scholar"
                    >
                      <ShieldCheck size={14} /> Verified
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-[#7a7a7a]">
                  {user?.email || 'alex.rivera@socrates.edu'}
                </p>

                <p className="text-xs text-[#525252] max-w-xl leading-relaxed">
                  {user?.bio ||
                    'Computer Science Scholar & Peer Educator passionate about Data Structures, AI, and Collaborative Problem Solving.'}
                </p>
              </div>
            </div>

            {/* Quick Actions Right */}
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 p-1.5 bg-[#f5f5f7] rounded-2xl border border-[#e0e0e0]">
                <button
                  onClick={() => setPerspective('student')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePerspective === 'student'
                      ? 'bg-[#0066cc] text-white shadow-sm'
                      : 'text-[#525252] hover:text-[#1d1d1f] hover:bg-white/60'
                  }`}
                >
                  <GraduationCap size={14} /> Student View
                </button>

                <button
                  onClick={() => setPerspective('tutor')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePerspective === 'tutor'
                      ? 'bg-[#0066cc] text-white shadow-sm'
                      : 'text-[#525252] hover:text-[#1d1d1f] hover:bg-white/60'
                  }`}
                >
                  <UserCheck size={14} /> Tutor View
                </button>

                <button
                  onClick={() => setPerspective('both')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePerspective === 'both'
                      ? 'bg-[#0066cc] text-white shadow-sm'
                      : 'text-[#525252] hover:text-[#1d1d1f] hover:bg-white/60'
                  }`}
                >
                  <Layers size={14} /> Combined (Both)
                </button>
              </div>

              <div className="text-[11px] text-[#86868b] flex items-center gap-1.5">
                <Clock size={12} /> Member since{' '}
                {new Date(user?.createdAt || Date.now()).toLocaleDateString(
                  'en-US',
                  { month: 'short', year: 'numeric' }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PERSPECTIVE SECTION 1: STUDENT VIEW (IF SELECTED OR BOTH) */}
        {(activePerspective === 'both' || activePerspective === 'student') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-[#0066cc]">
                  Perspective 01
                </span>
                <h2 className="text-xl font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                  <GraduationCap className="text-[#0066cc]" size={22} /> Student
                  & Learner Profile
                </h2>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5e7] text-[#525252]">
                Active Student Status: High Performer
              </span>
            </div>

            {/* Student HUD Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Sessions Completed</span>
                  <BookOpen size={16} className="text-[#0066cc]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  28
                </div>
                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <TrendingUp size={12} /> +4 this week
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>AI Questions Asked</span>
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  142
                </div>
                <div className="text-xs text-[#7a7a7a]">
                  98.2% Socratic resolution rate
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Hours Consumed</span>
                  <Clock size={16} className="text-amber-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  42.5 hrs
                </div>
                <div className="text-xs text-[#7a7a7a]">Across 4 core domains</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Bookmarked Tutors</span>
                  <Bookmark size={16} className="text-[#0066cc]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  6 Tutors
                </div>
                <div className="text-xs text-[#0066cc]">2 Tutors online now</div>
              </div>
            </div>

            {/* Enrolled Subjects & Learning History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                <h3 className="text-base font-display font-semibold text-[#1d1d1f] flex items-center justify-between">
                  <span>Enrolled Learning Subjects</span>
                  <span className="text-xs text-[#7a7a7a] font-normal">
                    4 Active
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user?.subjects && user.subjects.length > 0 ? (
                    user.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-medium text-[#1d1d1f] flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={12} className="text-[#0066cc]" />
                        {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#86868b]">
                      No subjects added yet.
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                <h3 className="text-base font-display font-semibold text-[#1d1d1f]">
                  Recent Study Room History
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs">
                    <div>
                      <div className="font-semibold text-[#1d1d1f]">
                        Algorithms & Data Structures Lounge
                      </div>
                      <div className="text-[#7a7a7a]">
                        Host: Dr. Evelyn Reed • Yesterday
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                      Completed
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs">
                    <div>
                      <div className="font-semibold text-[#1d1d1f]">
                        Linear Algebra Foundations
                      </div>
                      <div className="text-[#7a7a7a]">
                        Host: Marcus Chen • 3 days ago
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PERSPECTIVE SECTION 2: TUTOR VIEW (IF SELECTED OR BOTH) */}
        {(activePerspective === 'both' || activePerspective === 'tutor') && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-[#0066cc]">
                  Perspective 02
                </span>
                <h2 className="text-xl font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                  <UserCheck className="text-emerald-600" size={22} /> Verified
                  Tutor & Instructor Profile
                </h2>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                Accepting Students • ${user?.hourlyRate || 45}/hr
              </span>
            </div>

            {/* Tutor HUD Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Hourly Rate</span>
                  <DollarSign size={16} className="text-emerald-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  ${user?.hourlyRate || 45}
                  <span className="text-xs font-normal text-[#7a7a7a]">
                    /hr
                  </span>
                </div>
                <div className="text-xs text-[#7a7a7a]">
                  Standard Tutoring Rate
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Average Rating</span>
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  4.96
                </div>
                <div className="text-xs text-[#7a7a7a]">From 54 student reviews</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Total Students Taught</span>
                  <UserCheck size={16} className="text-[#0066cc]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  86 Students
                </div>
                <div className="text-xs text-emerald-600">
                  100% On-time attendance
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-medium uppercase tracking-wider">
                  <span>Tutoring Earnings</span>
                  <Award size={16} className="text-purple-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  $3,840
                </div>
                <div className="text-xs text-[#7a7a7a]">Escrow released cleanly</div>
              </div>
            </div>

            {/* Teaching Domains & Verified Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                <h3 className="text-base font-display font-semibold text-[#1d1d1f] flex items-center justify-between">
                  <span>Teaching Expertise Domains</span>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-xs text-[#0066cc] hover:underline"
                  >
                    Edit Subjects
                  </button>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user?.subjects && user.subjects.length > 0 ? (
                    user.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0066cc]/10 border border-[#0066cc]/20 text-xs font-semibold text-[#0066cc] flex items-center gap-1.5"
                      >
                        <Sparkles size={12} /> {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#86868b]">
                      No subjects configured.
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                <h3 className="text-base font-display font-semibold text-[#1d1d1f]">
                  Verified Instructor Badges
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7]">
                    <ShieldCheck className="text-emerald-600" size={20} />
                    <div>
                      <div className="font-semibold text-[#1d1d1f]">
                        Stanford CS Academic Credential Verified
                      </div>
                      <div className="text-[#7a7a7a]">
                        Official Transcripts & Degree Audit Confirmed
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7]">
                    <Star className="text-amber-500" size={20} />
                    <div>
                      <div className="font-semibold text-[#1d1d1f]">
                        Top 5% Rated Peer Instructor
                      </div>
                      <div className="text-[#7a7a7a]">
                        Maintained &gt;4.9 Rating for 6+ Consecutive Months
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sign Out Action Section at the bottom of the page */}
        <section className="pt-8 border-t border-[#e5e5e7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-display font-semibold text-[#1d1d1f]">Account Session</h4>
            <p className="text-xs text-[#7a7a7a]">Sign out of your active SOCRATES session on this browser.</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <LogOut size={15} />
            Sign Out of Account
          </button>
        </section>
      </main>

      {/* EDIT PROFILE LIGHT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 text-[#1d1d1f]">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <h3 className="text-lg font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                <Edit3 size={18} className="text-[#0066cc]" /> Edit SOCRATES
                Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#525252] font-semibold block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#525252] font-semibold block">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#525252] font-semibold block">
                    Hourly Tutoring Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRate: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#525252] font-semibold block">
                    Teaching / Learning Subjects (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.subjectsText}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectsText: e.target.value })
                    }
                    placeholder="Algorithms, Python, React"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#525252] font-semibold block">
                  Bio / Statement
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e5e5e7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5e7] text-[#1d1d1f] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium transition-all shadow-md shadow-[#0066cc]/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
