import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Check,
  CheckCircle2,
  Sparkles,
  X,
  Layers,
  TrendingUp,
  Bookmark,
  LogOut,
  Repeat,
  Calendar,
  AlertTriangle,
  Users,
  Lock,
  Tag,
  Upload,
  Trash2,
  Camera,
  ArrowUpRight,
  CreditCard,
  Plus,
  Minus,
  CalendarRange,
  Link as LinkIcon,
} from 'lucide-react'
import { useAuthStore, ProfilePerspective } from '../store/useAuthStore'
import { updateUserProfileApi } from '../services/api'
import { toast } from 'sonner'
import { logoutAuthUser, fetchAuthenticatedUser } from '../services/authService'
import Navbar from '../components/Navbar'
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown'

export interface ProfileSessionItem {
  id: string
  tutorName: string
  studentName: string
  subject: string
  topic?: string
  dateStr: string
  timeStr: string
  duration: number
  fee: number
  isGroupSplit: boolean
  status: 'Upcoming' | 'Completed' | 'Cancelled'
}

const INITIAL_PROFILE_SESSIONS: ProfileSessionItem[] = [
  {
    id: 'sess-101',
    tutorName: 'Dr. Evelyn Reed',
    studentName: 'Alex Mercer',
    subject: 'Algorithms & Data Structures',
    topic: 'Graph Traversals & BFS',
    dateStr: 'Sat, Jul 25, 2026',
    timeStr: '01:30 PM',
    duration: 60,
    fee: 33,
    isGroupSplit: true,
    status: 'Upcoming'
  },
  {
    id: 'sess-102',
    tutorName: 'Marcus Chen',
    studentName: 'Alex Mercer',
    subject: 'Machine Learning',
    topic: 'PyTorch Model Optimization',
    dateStr: 'Sun, Jul 26, 2026',
    timeStr: '11:30 AM',
    duration: 60,
    fee: 65,
    isGroupSplit: false,
    status: 'Upcoming'
  },
  {
    id: 'sess-103',
    tutorName: 'Dr. Evelyn Reed',
    studentName: 'Alex Mercer',
    subject: 'Linear Algebra',
    dateStr: 'Wed, Jul 22, 2026',
    timeStr: '04:00 PM',
    duration: 30,
    fee: 28,
    isGroupSplit: true,
    status: 'Completed'
  }
]

export interface BookmarkedTutor {
  id: string
  name: string
  subject: string
  rating: number
  hourlyRate: number
  avatar: string
  online: boolean
}

export interface BillingLog {
  id: string
  date: string
  amount: number
  description: string
  status: 'Paid' | 'Refunded'
  sessionType: string
}

export interface PayoutLog {
  id: string
  date: string
  amount: number
  status: 'Completed' | 'Pending'
  account: string
}

const MOCK_BOOKMARKED_TUTORS: BookmarkedTutor[] = [
  {
    id: 'tut_101',
    name: 'Dr. Evelyn Reed',
    subject: 'Algorithms & Data Structures',
    rating: 4.98,
    hourlyRate: 65,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    online: true
  },
  {
    id: 'tut_102',
    name: 'Marcus Chen',
    subject: 'Machine Learning',
    rating: 4.95,
    hourlyRate: 55,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    online: true
  },
  {
    id: 'tut_103',
    name: 'Sophia Vance',
    subject: 'Linear Algebra',
    rating: 4.88,
    hourlyRate: 48,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    online: false
  }
]

const MOCK_BILLING_LOGS: BillingLog[] = [
  {
    id: 'TXN-9021',
    date: 'Jul 24, 2026',
    amount: 33.00,
    description: 'Group Split: Algorithms & BFS',
    status: 'Paid',
    sessionType: 'Group Split'
  },
  {
    id: 'TXN-9019',
    date: 'Jul 22, 2026',
    amount: 28.00,
    description: 'Group Split: Linear Algebra',
    status: 'Paid',
    sessionType: 'Group Split'
  },
  {
    id: 'TXN-8984',
    date: 'Jul 15, 2026',
    amount: 65.00,
    description: '1-on-1: Machine Learning foundations',
    status: 'Paid',
    sessionType: 'Private 1-on-1'
  }
]

const MOCK_PAYOUT_LOGS: PayoutLog[] = [
  {
    id: 'PAY-4091',
    date: 'Jul 28, 2026',
    amount: 340.00,
    status: 'Completed',
    account: 'Bank Account (...5678)'
  },
  {
    id: 'PAY-3982',
    date: 'Jul 14, 2026',
    amount: 290.00,
    status: 'Completed',
    account: 'Bank Account (...5678)'
  }
]

export interface AvailabilitySlot {
  id: string
  dayOfWeek: string
  timeStart: string
  timeEnd: string
}

const DAY_OPTIONS: DropdownOption<string>[] = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
]

const generateTimeOptions = (): DropdownOption<string>[] => {
  const options: DropdownOption<string>[] = []
  let current = 9 * 60 // 9:00 AM in minutes
  const end = 21 * 60 // 9:00 PM in minutes

  const minutesToTime = (totalMin: number): string => {
    const normalized = totalMin % 1440
    let hours = Math.floor(normalized / 60)
    const minutes = normalized % 60
    const modifier = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    if (hours === 0) hours = 12
    const hStr = hours < 10 ? `0${hours}` : `${hours}`
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`
    return `${hStr}:${mStr} ${modifier}`
  }

  while (current <= end) {
    const timeStr = minutesToTime(current)
    options.push({ value: timeStr, label: timeStr })
    current += 10
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

const ACADEMIC_LEVEL_OPTIONS: DropdownOption<string>[] = [
  { value: 'High School', label: 'High School' },
  { value: 'Undergraduate', label: 'Undergraduate' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Other', label: 'Other' },
]

const DURATION_OPTIONS: DropdownOption<number>[] = [
  { value: 60, label: '60 Min' },
  { value: 30, label: '30 Min' },
  { value: 20, label: '20 Min' },
]

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { id: 'av-1', dayOfWeek: 'Monday', timeStart: '09:00 AM', timeEnd: '11:00 AM' },
  { id: 'av-2', dayOfWeek: 'Wednesday', timeStart: '02:00 PM', timeEnd: '04:30 PM' },
  { id: 'av-3', dayOfWeek: 'Friday', timeStart: '10:00 AM', timeEnd: '12:00 PM' }
]


export const getStoredProfileSessions = (): ProfileSessionItem[] => {
  try {
    const stored = localStorage.getItem('socrates_booked_sessions')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error(e)
  }
  return INITIAL_PROFILE_SESSIONS
}

export const saveStoredProfileSessions = (sessions: ProfileSessionItem[]) => {
  try {
    localStorage.setItem('socrates_booked_sessions', JSON.stringify(sessions))
  } catch (e) {
    console.error(e)
  }
}

export default function Profile() {
  const { user, token, setAuth, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token && !user) {
      toast.error('Please log in to view your profile')
      navigate('/login')
    }
  }, [token, user, navigate])

  const handleLogout = async () => {
    try {
      await logoutAuthUser()
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      logout()
      toast.success('Signed out successfully')
      navigate('/login')
    }
  }

  // Active Role/Perspective derived directly from user object (defaulting to 'both')
  const userRole = user?.role || 'both'
  const [viewPerspective, setViewPerspective] = useState<ProfilePerspective>(
    userRole === 'both' ? 'student' : (userRole === 'admin' ? 'both' : (userRole as ProfilePerspective))
  )

  // Sync perspective if user.role changes
  useEffect(() => {
    if (user?.role && user.role !== 'admin') {
      setViewPerspective(user.role === 'both' ? 'student' : (user.role as ProfilePerspective))
    }
  }, [user?.role])

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)


  const [formData, setFormData] = useState({
    name: user?.fullName || user?.name || '',
    phone: (user as any)?.phone || '',
    role: user?.role || 'both',
    bio: user?.bio || '',
    hourlyRate: user?.hourlyRate || 45,
    avatar: user?.avatar || '',
    subjectsText: user?.subjects ? user.subjects.join(', ') : '',
    learningSubjectsText: (user as any)?.learningSubjects ? (user as any).learningSubjects.join(', ') : '',
    academicLevel: (user as any)?.academicLevel || 'Undergraduate',
    education: (user as any)?.education || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }))
        toast.success('New profile photo selected! Click Save to apply.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }))
    toast.info('Profile photo removed')
  }

  // Booked Sessions State & Cancellation System
  const [sessions, setSessions] = useState<ProfileSessionItem[]>(() => getStoredProfileSessions())
  const [sessionFilter, setSessionFilter] = useState<'Upcoming' | 'Completed'>('Upcoming')
  const [cancellingSession, setCancellingSession] = useState<ProfileSessionItem | null>(null)

  const [availability, setAvailability] = useState<AvailabilitySlot[]>(DEFAULT_AVAILABILITY)
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 'Monday', timeStart: '09:00 AM' })
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [bookmarkedTutors, setBookmarkedTutors] = useState<BookmarkedTutor[]>(MOCK_BOOKMARKED_TUTORS)

  const calculateEndTime = (startStr: string, durationMin: number): string => {
    const timeToMinutes = (timeStr: string): number => {
      const [time, modifier] = timeStr.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (modifier === 'PM' && hours !== 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }

    const minutesToTime = (totalMin: number): string => {
      const normalized = totalMin % 1440
      let hours = Math.floor(normalized / 60)
      const minutes = normalized % 60
      const modifier = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      if (hours === 0) hours = 12
      const hStr = hours < 10 ? `0${hours}` : `${hours}`
      const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`
      return `${hStr}:${mStr} ${modifier}`
    }

    const startMin = timeToMinutes(startStr)
    const endMin = startMin + durationMin
    return minutesToTime(endMin)
  }

  const getAvailabilityTimeOptions = (): DropdownOption<string>[] => {
    const timeToMinutes = (timeStr: string): number => {
      const [time, modifier] = timeStr.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (modifier === 'PM' && hours !== 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }

    return TIME_OPTIONS.map((option) => {
      const newStart = timeToMinutes(option.value)
      const newEnd = newStart + selectedDuration

      const hasConflict = availability.some((slot) => {
        if (slot.dayOfWeek !== newSlot.dayOfWeek) return false
        const existStart = timeToMinutes(slot.timeStart)
        const existEnd = timeToMinutes(slot.timeEnd)
        return newStart < (existEnd + 20) && newEnd > (existStart - 20)
      })

      return {
        ...option,
        disabled: hasConflict
      }
    })
  }

  const handleAddAvailability = () => {
    const timeToMinutes = (timeStr: string): number => {
      const [time, modifier] = timeStr.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (modifier === 'PM' && hours !== 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }

    const minutesToTime = (totalMin: number): string => {
      const normalized = totalMin % 1440
      let hours = Math.floor(normalized / 60)
      const minutes = normalized % 60
      const modifier = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      if (hours === 0) hours = 12
      const hStr = hours < 10 ? `0${hours}` : `${hours}`
      const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`
      return `${hStr}:${mStr} ${modifier}`
    }

    const startMin = timeToMinutes(newSlot.timeStart)
    const endMin = startMin + selectedDuration
    const timeEndStr = minutesToTime(endMin)

    // Check if duplicate or conflict exists (must have at least 20 minutes break)
    const hasConflict = availability.some((slot) => {
      if (slot.dayOfWeek !== newSlot.dayOfWeek) return false
      const existStart = timeToMinutes(slot.timeStart)
      const existEnd = timeToMinutes(slot.timeEnd)
      return startMin < (existEnd + 20) && endMin > (existStart - 20)
    })

    if (hasConflict) {
      toast.error('This slot overlaps or is too close (less than 20-min break) to an existing slot!')
      return
    }

    const newSlotItem: AvailabilitySlot = {
      id: `av-${Date.now()}`,
      dayOfWeek: newSlot.dayOfWeek,
      timeStart: newSlot.timeStart,
      timeEnd: timeEndStr
    }

    setAvailability(prev => [...prev, newSlotItem])
    toast.success(`Slot added: ${newSlot.timeStart} - ${timeEndStr}`)

    // Auto-advance start time by duration + 20 min break
    const nextStartMin = startMin + selectedDuration + 20
    const limitMin = 21 * 60 // 09:00 PM max start
    if (nextStartMin <= limitMin) {
      const nextStartStr = minutesToTime(nextStartMin)
      setNewSlot(prev => ({ ...prev, timeStart: nextStartStr }))
    }
  }

  const handleRemoveAvailability = (id: string) => {
    setAvailability(prev => prev.filter(av => av.id !== id))
    toast.success('Availability slot removed')
  }

  const handleRemoveBookmark = (id: string) => {
    setBookmarkedTutors(prev => prev.filter(t => t.id !== id))
    toast.success('Tutor removed from bookmarks')
  }

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isEditModalOpen || cancellingSession) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isEditModalOpen, cancellingSession])

  const confirmCancelSession = () => {
    if (!cancellingSession) return
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== cancellingSession.id)
      saveStoredProfileSessions(updated)
      return updated
    })
    toast.success('Session Cancelled Successfully', {
      description: `Your reservation on ${cancellingSession.dateStr} at ${cancellingSession.timeStr} has been cancelled. Full refund of $${cancellingSession.fee} issued.`,
    })
    setCancellingSession(null)
  }

  const filteredSessions = sessions.filter((s) => s.status === sessionFilter)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: (user as any).phone || '',
        role: user.role,
        bio: user.bio,
        hourlyRate: user.hourlyRate || 45,
        avatar: user.avatar,
        subjectsText: user.subjects.join(', '),
        learningSubjectsText: (user as any).learningSubjects ? (user as any).learningSubjects.join(', ') : '',
        academicLevel: (user as any).academicLevel || 'Undergraduate',
        education: (user as any).education || '',
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
      phone: formData.phone,
      role: formData.role as 'student' | 'tutor' | 'both',
      bio: formData.bio,
      hourlyRate: Number(formData.hourlyRate),
      avatar: formData.avatar,
      subjects: formData.role === 'student' ? (user?.subjects || []) : subjectsArr,
      learningSubjects: (user as any)?.learningSubjects || [],
      academicLevel: formData.academicLevel,
      education: formData.education,
    }

    const result = await updateUserProfileApi(updatePayload)
    updateUser(updatePayload)
    if (updatePayload.role) {
      setViewPerspective(updatePayload.role === 'both' ? 'student' : (updatePayload.role as ProfilePerspective))
    }
    setIsSaving(false)

    if (result.success !== false) {
      toast.success('Profile updated successfully!')
      setIsEditModalOpen(false)
    } else {
      toast.info('Profile saved to local state.')
      setIsEditModalOpen(false)
    }
  }

  const getLearningSubjects = (): string[] => {
    if (user?.role === 'both') {
      return (user as any).learningSubjects || []
    }
    return user?.subjects || []
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim()) return

    const trimmed = newSubject.trim()
    const currentSubjects = getLearningSubjects()

    if (currentSubjects.includes(trimmed)) {
      toast.error('Subject is already enrolled!')
      return
    }

    const updatedSubjects = [...currentSubjects, trimmed]
    const updatePayload = user?.role === 'both'
      ? { learningSubjects: updatedSubjects }
      : { subjects: updatedSubjects }

    const result = await updateUserProfileApi(updatePayload)
    updateUser(updatePayload)
    setNewSubject('')
    toast.success(`Enrolled in subject: ${trimmed}`)
  }

  const handleRemoveSubject = async (subjectToRemove: string) => {
    const currentSubjects = getLearningSubjects()
    const updatedSubjects = currentSubjects.filter((s) => s !== subjectToRemove)
    const updatePayload = user?.role === 'both'
      ? { learningSubjects: updatedSubjects }
      : { subjects: updatedSubjects }

    const result = await updateUserProfileApi(updatePayload)
    updateUser(updatePayload)
    toast.success(`Removed subject: ${subjectToRemove}`)
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
              <div className="relative group shrink-0">
                <img
                  src={user?.profileImage || user?.avatar || ''}
                  alt={user?.fullName || user?.name || 'User Profile'}
                  className="w-32 h-32 rounded-full object-cover border border-[#e5e5e7] shadow-xs antialiased"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-display font-bold tracking-tight text-[#1d1d1f]">
                    {user?.fullName || user?.name || 'Scholar'}
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

                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="text-[#7a7a7a]">
                    {user?.email}
                  </span>
                  <span className="text-[#e0e0e0]">•</span>
                  {userRole === 'student' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#0066cc] font-semibold">
                      Student Account
                    </span>
                  )}
                  {userRole === 'tutor' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                      Tutor Account
                    </span>
                  )}
                  {userRole === 'both' && (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-semibold flex items-center gap-1">
                      <Repeat size={11} /> Peer-to-Peer Account (Both)
                    </span>
                  )}
                </div>

                {user?.bio ? (
                  <p className="text-xs sm:text-sm text-[#48484a] max-w-2xl leading-relaxed break-words font-normal">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-xs text-[#86868b] italic">
                    No bio added yet. Click Edit Profile to add one.
                  </p>
                )}
              </div>
            </div>

            {/* Account Role Selector / Edit Trigger Right */}
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium text-xs transition-all shadow-md shadow-[#0066cc]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              </div>

              {/* View Perspective Toggles (For Hybrid Users) */}
              {userRole === 'both' && (
                <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl border border-[#e0e0e0] transform-gpu">
                  <button
                    onClick={() => setViewPerspective('student')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none ${
                      viewPerspective === 'student'
                        ? 'bg-[#0066cc] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#1d1d1f]'
                    }`}
                  >
                    Student View
                  </button>
                  <button
                    onClick={() => setViewPerspective('tutor')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none ${
                      viewPerspective === 'tutor'
                        ? 'bg-[#0066cc] text-white shadow-xs'
                        : 'text-[#525252] hover:text-[#1d1d1f]'
                    }`}
                  >
                    Tutor View
                  </button>
                </div>
              )}

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

        {/* BOOKED SESSIONS & SCHEDULE MANAGEMENT SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
            <div>
              <h2 className="text-xl font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                <Calendar className="text-[#0066cc]" size={22} /> My Booked Tutoring Sessions
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSessionFilter('Upcoming')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none transform-gpu ${
                  sessionFilter === 'Upcoming'
                    ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-xs'
                    : 'bg-white border-[#e5e5e7] text-[#525252] hover:bg-[#f5f5f7]'
                }`}
              >
                Upcoming ({sessions.filter((s) => s.status === 'Upcoming').length})
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('Completed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none transform-gpu ${
                  sessionFilter === 'Completed'
                    ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-xs'
                    : 'bg-white border-[#e5e5e7] text-[#525252] hover:bg-[#f5f5f7]'
                }`}
              >
                Completed ({sessions.filter((s) => s.status === 'Completed').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[190px] items-start">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl bg-white border space-y-3.5 transition-all shadow-xs relative overflow-hidden ${
                    session.isGroupSplit
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-[#e5e5e7] hover:border-[#0066cc]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-[#1d1d1f]">
                          {session.dateStr}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#0066cc]/10 text-[#0066cc] font-bold text-xs">
                          {session.timeStr}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[#525252] flex items-center gap-1.5 pt-0.5">
                        <BookOpen size={13} className="text-[#0066cc]" />
                        <span>Subject: <strong className="text-[#1d1d1f] font-semibold">{session.subject}</strong></span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
                      session.isGroupSplit
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {session.isGroupSplit ? <Users size={11} /> : <Lock size={11} />}
                      {session.isGroupSplit ? 'Group Split (50% Off)' : 'Private 1-on-1'}
                    </span>
                  </div>

                  {session.topic && (
                    <div className="p-2.5 rounded-xl bg-[#fafafc] border border-[#f0f0f2] text-xs text-[#525252] flex items-start gap-1.5">
                      <Tag size={12} className="text-[#0066cc] shrink-0 mt-0.5" />
                      <span>Topic: <strong className="text-[#1d1d1f] font-medium">{session.topic}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f2] text-xs">
                    <div className="text-[#7a7a7a]">
                      {viewPerspective === 'tutor' ? (
                        <span>Student: <strong className="text-[#1d1d1f] font-semibold">{session.studentName}</strong></span>
                      ) : (
                        <span>Tutor: <strong className="text-[#1d1d1f] font-semibold">{session.tutorName}</strong></span>
                      )}
                      <span className="ml-2 text-[#a1a1a6]">({session.duration} min • ${session.fee})</span>
                    </div>

                    {session.status === 'Upcoming' ? (
                      <button
                        type="button"
                        onClick={() => setCancellingSession(session)}
                        className="w-[130px] py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs select-none hover:shadow-xs inline-flex items-center justify-center gap-1 shrink-0"
                      >
                        <X size={12} /> Cancel Session
                      </button>
                    ) : (
                      <span className="w-[130px] py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-xs inline-flex items-center justify-center gap-1 select-none shrink-0">
                        <Check size={12} className="text-emerald-600 shrink-0" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 rounded-2xl bg-white border border-[#e5e5e7] text-center space-y-2">
                <Calendar className="mx-auto text-[#a1a1a6]" size={32} />
                <h4 className="text-sm font-bold text-[#1d1d1f]">No {sessionFilter.toLowerCase()} sessions found</h4>
                <p className="text-xs text-[#7a7a7a]">
                  {sessionFilter === 'Upcoming' ? 'You have no active tutoring reservations.' : 'No completed tutoring session history.'}
                </p>
                {sessionFilter === 'Upcoming' && (
                  <Link
                    to="/tutors"
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all"
                  >
                    Browse Tutors & Book Session
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* PERSPECTIVE SECTION 1: STUDENT VIEW */}
        {viewPerspective === 'student' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div>
                <h2 className="text-xl font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                  <GraduationCap className="text-[#0066cc]" size={22} /> Student Dashboard
                </h2>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0066cc] font-semibold">
                Student Account Status: Active
              </span>
            </div>

            {/* Student HUD Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Sessions Completed</span>
                  <BookOpen size={16} className="text-[#0066cc]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">28</div>
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp size={12} /> +4 this week
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>AI Questions Asked</span>
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">142</div>
                <div className="text-xs text-[#7a7a7a] font-medium">98.2% Socratic resolution</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Hours Consumed</span>
                  <Clock size={16} className="text-amber-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">42.5 hrs</div>
                <div className="text-xs text-[#7a7a7a] font-medium">Across 4 core domains</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-[#0066cc]/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Bookmarked Tutors</span>
                  <Bookmark size={16} className="text-[#0066cc]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">{bookmarkedTutors.length}</div>
                <div className="text-xs text-[#0066cc] font-medium">{bookmarkedTutors.filter(t => t.online).length} online now</div>
              </div>
            </div>

            {/* Enrolled Subjects & Bookmarked Tutors & Study History Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Enrolled Subjects & Study Rooms (7 cols) */}
              <div className="md:col-span-7 space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                  <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center justify-between">
                    <span>Enrolled Learning Subjects</span>
                    <span className="text-xs text-[#7a7a7a] font-normal">{getLearningSubjects().length} Active</span>
                  </h3>

                  {/* Inline Form to Add Learning Subject */}
                  <form onSubmit={handleAddSubject} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Add a subject (e.g. Chemistry)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] placeholder-[#86868b]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-bold transition-colors cursor-pointer select-none"
                    >
                      Add
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {getLearningSubjects().length > 0 ? (
                      getLearningSubjects().map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={12} className="text-[#0066cc]" />
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub)}
                            className="text-[#7a7a7a] hover:text-red-600 transition-colors ml-1 cursor-pointer"
                            title="Remove Subject"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#86868b] italic">No learning subjects added yet.</span>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                  <h3 className="text-base font-display font-bold text-[#1d1d1f]">Recent Study Room History</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs">
                      <div>
                        <div className="font-bold text-[#1d1d1f]">Algorithms & Data Structures Lounge</div>
                        <div className="text-[#7a7a7a] font-medium">Host: Dr. Evelyn Reed • Yesterday</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shrink-0">Completed</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs">
                      <div>
                        <div className="font-bold text-[#1d1d1f]">Linear Algebra Foundations</div>
                        <div className="text-[#7a7a7a] font-medium">Host: Marcus Chen • 3 days ago</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shrink-0">Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Bookmarked Tutors (5 cols) */}
              <div className="md:col-span-5">
                <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs min-h-[352px]">
                  <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center justify-between">
                    <span>Bookmarked Tutors</span>
                    <span className="text-xs text-[#7a7a7a] font-normal">{bookmarkedTutors.length} Saved</span>
                  </h3>
                  <div className="space-y-3">
                    {bookmarkedTutors.length > 0 ? (
                      bookmarkedTutors.map((tutor) => (
                        <div key={tutor.id} className="flex items-center justify-between p-3 rounded-xl bg-[#fafafc] border border-[#e5e5e7] hover:border-[#0066cc]/30 transition-colors gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <img src={tutor.avatar} alt={tutor.name} className="w-10 h-10 rounded-full object-cover border border-[#e5e5e7] antialiased" />
                              {tutor.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[#1d1d1f] truncate">{tutor.name}</div>
                              <div className="text-[10px] text-[#7a7a7a] truncate font-medium">{tutor.subject}</div>
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold pt-0.5">
                                <Star size={10} className="fill-amber-500" />
                                <span>{tutor.rating}</span>
                                <span className="text-[#a1a1a6] font-normal">•</span>
                                <span className="text-[#0066cc] font-extrabold">${tutor.hourlyRate}/hr</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Link to={`/tutors/${tutor.id}/schedule`} className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-[#0066cc] transition-colors" title="Schedule Session">
                              <CalendarRange size={13} />
                            </Link>
                            <button type="button" onClick={() => handleRemoveBookmark(tutor.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors cursor-pointer" title="Remove Bookmark">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-[#86868b] text-xs italic">
                        No bookmarked tutors. Browse and bookmark tutors from the main directory!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Billing & Split Payments History logs */}
            <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
              <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                <CreditCard className="text-[#0066cc]" size={18} /> Billing & Split Payments Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e5e7] text-[#7a7a7a] font-bold">
                      <th className="pb-3 pr-4 font-semibold">Transaction ID</th>
                      <th className="pb-3 px-4 font-semibold">Date</th>
                      <th className="pb-3 px-4 font-semibold">Description</th>
                      <th className="pb-3 px-4 font-semibold">Session Type</th>
                      <th className="pb-3 px-4 font-semibold">Amount</th>
                      <th className="pb-3 pl-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_BILLING_LOGS.map((log) => (
                      <tr key={log.id} className="border-b border-[#f0f0f2]/80 hover:bg-[#fafafc] transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-[#1d1d1f]">{log.id}</td>
                        <td className="py-3.5 px-4 text-[#525252] font-medium">{log.date}</td>
                        <td className="py-3.5 px-4 text-[#1d1d1f] font-medium">{log.description}</td>
                        <td className="py-3.5 px-4 text-[#525252] font-medium">{log.sessionType}</td>
                        <td className="py-3.5 px-4 text-[#0066cc] font-extrabold">${log.amount.toFixed(2)}</td>
                        <td className="py-3.5 pl-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* PERSPECTIVE SECTION 2: TUTOR VIEW */}
        {viewPerspective === 'tutor' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div>
                <h2 className="text-xl font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                  <UserCheck className="text-emerald-600" size={22} /> Tutor Dashboard
                </h2>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                Accepting Students • ${user?.hourlyRate || 45}/hr
              </span>
            </div>

            {/* Tutor HUD Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Hourly Rate</span>
                  <DollarSign size={16} className="text-emerald-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">
                  ${user?.hourlyRate || 45}
                  <span className="text-xs font-normal text-[#7a7a7a]">/hr</span>
                </div>
                <div className="text-xs text-[#7a7a7a] font-medium">Standard Tutoring Rate</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Average Rating</span>
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">4.96</div>
                <div className="text-xs text-[#7a7a7a] font-medium">From 54 student reviews</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Students Taught</span>
                  <UserCheck size={16} className="text-[#0066cc]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">86</div>
                <div className="text-xs text-emerald-600 font-medium">100% On-time attendance</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e5e5e7] space-y-2 hover:border-emerald-500/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between text-[#7a7a7a] text-xs font-bold uppercase tracking-wider">
                  <span>Tutoring Earnings</span>
                  <Award size={16} className="text-purple-600" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1d1d1f]">$3,840</div>
                <div className="text-xs text-[#7a7a7a] font-medium">Escrow released cleanly</div>
              </div>
            </div>

            {/* Teaching Domains, Credentials, and Availability Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Teaching Expertise & verified badges (6 cols) */}
              <div className="md:col-span-6 space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                  <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center justify-between">
                    <span>Teaching Expertise Domains</span>
                    <button onClick={() => setIsEditModalOpen(true)} className="text-xs text-[#0066cc] hover:underline font-bold cursor-pointer">
                      Edit Subjects
                    </button>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user?.subjects && user.subjects.length > 0 ? (
                      user.subjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0066cc]/10 border border-[#0066cc]/20 text-xs font-bold text-[#0066cc] flex items-center gap-1.5"
                        >
                          <Sparkles size={12} /> {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#86868b] italic">No subjects configured.</span>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
                  <h3 className="text-base font-display font-bold text-[#1d1d1f]">Verified Instructor Badges</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7]">
                      <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
                      <div>
                        <div className="font-bold text-[#1d1d1f]">Stanford CS Academic Credential Verified</div>
                        <div className="text-[#7a7a7a] font-medium">Official Transcripts & Degree Audit Confirmed</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7]">
                      <Star className="text-amber-500 shrink-0" size={20} />
                      <div>
                        <div className="font-bold text-[#1d1d1f]">Top 5% Rated Peer Instructor</div>
                        <div className="text-[#7a7a7a] font-medium">Maintained &gt;4.9 Rating for 6+ Months</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Availability Scheduler (6 cols) */}
              <div className="md:col-span-6">
                <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs min-h-[352px]">
                  <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                    <Clock className="text-[#0066cc]" size={18} /> Manage Availability Hours
                  </h3>
                  
                  {/* Availability Creator Form */}
                  <div className="p-3.5 rounded-xl bg-[#fafafc] border border-[#e5e5e7] space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#7a7a7a] uppercase mb-1">Day</label>
                        <CustomDropdown<string>
                          options={DAY_OPTIONS}
                          value={newSlot.dayOfWeek}
                          onChange={(val: string) => setNewSlot(prev => ({ ...prev, dayOfWeek: val }))}
                          className="w-full"
                          buttonClassName="!py-2 !px-2.5 w-full justify-between bg-white text-xs font-bold border border-[#e5e5e7] !rounded-lg"
                          align="center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#7a7a7a] uppercase mb-1">Start Time</label>
                        <CustomDropdown<string>
                          options={getAvailabilityTimeOptions()}
                          value={newSlot.timeStart}
                          onChange={(val: string) => setNewSlot(prev => ({ ...prev, timeStart: val }))}
                          className="w-full"
                          buttonClassName="!py-2 !px-2.5 w-full justify-between bg-white text-xs font-bold border border-[#e5e5e7] !rounded-lg"
                          align="center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#7a7a7a] uppercase mb-1">End Time</label>
                        <div className="w-full py-2 px-3.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-lg text-xs font-bold text-[#7a7a7a] h-[34px] flex items-center select-none">
                          {calculateEndTime(newSlot.timeStart, selectedDuration)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#7a7a7a] uppercase mb-1">Session</label>
                        <CustomDropdown<number>
                          options={DURATION_OPTIONS}
                          value={selectedDuration}
                          onChange={(val: number) => setSelectedDuration(val)}
                          className="w-full"
                          buttonClassName="!py-2 !px-2.5 w-full justify-between bg-white text-xs font-bold border border-[#e5e5e7] !rounded-lg"
                          align="center"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAvailability}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer select-none"
                    >
                      Add Availability Slot
                    </button>
                  </div>

                  {/* Active Slots list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#7a7a7a] uppercase tracking-wider block">Active Configured Slots</span>
                    {availability.length > 0 ? (
                      <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {availability.map((av) => (
                          <div key={av.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e5e5e7] hover:border-emerald-500/25 transition-colors gap-3 text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px]">
                                {av.dayOfWeek.slice(0, 3)}
                              </span>
                              <span className="text-[#1d1d1f] font-mono font-medium">{av.timeStart} - {av.timeEnd}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAvailability(av.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-[#7a7a7a] hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#86868b] italic">No active availability slots configured.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings & Payout logs */}
            <div className="p-6 rounded-2xl bg-white border border-[#e5e5e7] space-y-4 shadow-xs">
              <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                <DollarSign className="text-emerald-600" size={18} /> Tutor Earnings & Payout Records
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e5e7] text-[#7a7a7a] font-bold">
                      <th className="pb-3 pr-4 font-semibold">Reference ID</th>
                      <th className="pb-3 px-4 font-semibold">Payout Date</th>
                      <th className="pb-3 px-4 font-semibold">Destination Account</th>
                      <th className="pb-3 px-4 font-semibold">Amount</th>
                      <th className="pb-3 pl-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PAYOUT_LOGS.map((log) => (
                      <tr key={log.id} className="border-b border-[#f0f0f2]/80 hover:bg-[#fafafc] transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-[#1d1d1f]">{log.id}</td>
                        <td className="py-3.5 px-4 text-[#525252] font-medium">{log.date}</td>
                        <td className="py-3.5 px-4 text-[#1d1d1f] font-medium">{log.account}</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-extrabold">${log.amount.toFixed(2)}</td>
                        <td className="py-3.5 pl-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold text-xs transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            <LogOut size={15} />
            Sign Out of Account
          </button>
        </section>
      </main>

      {/* EDIT PROFILE LIGHT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-4 relative shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 text-[#1d1d1f] transform-gpu antialiased">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <h3 className="text-lg font-display font-bold text-[#1d1d1f] flex items-center gap-2">
                <Edit3 size={18} className="text-[#0066cc]" /> Edit Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#525252] font-semibold block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>

              {/* Profile Photo Manager */}
              <div className="space-y-2 bg-[#f8f9fa] p-4 rounded-2xl border border-[#e5e5e7]">
                <label className="text-[#1d1d1f] font-semibold block text-xs">
                  Profile Photo
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=0066cc&color=fff`}
                      alt="Avatar Preview"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=0066cc&color=fff`
                      }}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0066cc] shadow-xs bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>

                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-[#f0f0f2] border border-[#e5e5e7] text-[#6e6e73] hover:text-[#1d1d1f] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none ml-auto"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{showUrlInput ? 'Hide URL' : 'Use Image URL'}</span>
                    </button>
                  </div>
                </div>

                {showUrlInput && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e0] text-[#1d1d1f] text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.role === 'student' && (
                  <>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[#525252] font-semibold block">
                        Academic Level
                      </label>
                      <CustomDropdown<string>
                        options={ACADEMIC_LEVEL_OPTIONS}
                        value={formData.academicLevel}
                        onChange={(val: string) => setFormData({ ...formData, academicLevel: val })}
                        className="w-full"
                        buttonClassName="!py-2.5 !px-4 w-full justify-between bg-[#f5f5f7] text-xs font-bold border border-[#e0e0e0] !rounded-xl text-[#1d1d1f]"
                        align="center"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#1d1d1f]">
                          Learning Goals / Bio
                        </label>
                        <span
                          className={`text-[10px] transition-colors ${
                            formData.bio.length >= 250
                              ? 'text-red-500 font-bold'
                              : 'text-[#7a7a7a] font-medium'
                          }`}
                        >
                          {formData.bio.length}/250 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={250}
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        placeholder="Describe what you want to achieve..."
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] focus:bg-white transition-colors resize-none min-h-[84px]"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'tutor' && (
                  <>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
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
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-[#525252] font-semibold block">
                        Teaching Subjects
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
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[#525252] font-semibold block">
                        Education / Degree
                      </label>
                      <input
                        type="text"
                        value={formData.education}
                        onChange={(e) =>
                          setFormData({ ...formData, education: e.target.value })
                        }
                        placeholder="e.g. BS in Computer Science, Stanford University"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#1d1d1f]">
                          Tutor Bio / Statement
                        </label>
                        <span
                          className={`text-[10px] transition-colors ${
                            formData.bio.length >= 250
                              ? 'text-red-500 font-bold'
                              : 'text-[#7a7a7a] font-medium'
                          }`}
                        >
                          {formData.bio.length}/250 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={250}
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        placeholder="Describe your tutoring style and experience..."
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] focus:bg-white transition-colors resize-none min-h-[84px]"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'both' && (
                  <>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
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
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-[#525252] font-semibold block">
                        Teaching Subjects
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
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[#525252] font-semibold block">
                        Academic Level
                      </label>
                      <CustomDropdown<string>
                        options={ACADEMIC_LEVEL_OPTIONS}
                        value={formData.academicLevel}
                        onChange={(val: string) => setFormData({ ...formData, academicLevel: val })}
                        className="w-full"
                        buttonClassName="!py-2.5 !px-4 w-full justify-between bg-[#f5f5f7] text-xs font-bold border border-[#e0e0e0] !rounded-xl text-[#1d1d1f]"
                        align="center"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[#525252] font-semibold block">
                        Education / Degree
                      </label>
                      <input
                        type="text"
                        value={formData.education}
                        onChange={(e) =>
                          setFormData({ ...formData, education: e.target.value })
                        }
                        placeholder="e.g. BS in Computer Science, Stanford University"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#1d1d1f]">
                          Bio / Statement
                        </label>
                        <span
                          className={`text-[10px] transition-colors ${
                            formData.bio.length >= 250
                              ? 'text-red-500 font-bold'
                              : 'text-[#7a7a7a] font-medium'
                          }`}
                        >
                          {formData.bio.length}/250 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={250}
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        placeholder="Write a short summary about your academic background and learning goals..."
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] focus:bg-white transition-colors resize-none min-h-[84px]"
                      />
                    </div>
                  </>
                )}
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
      {/* CANCEL SESSION CONFIRMATION MODAL */}
      <AnimatePresence>
        {cancellingSession && (
          <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 py-8 sm:py-12 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs -z-10"
              onClick={() => setCancellingSession(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-5 shadow-2xl relative text-[#1d1d1f] transform-gpu select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">
                    Cancel Tutoring Session?
                  </h3>
                  <p className="text-xs text-[#7a7a7a]">
                    Confirm cancellation for {cancellingSession.dateStr} at {cancellingSession.timeStr}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-2 text-xs text-red-950">
                <div className="font-semibold flex items-center justify-between">
                  <span>Session: {cancellingSession.subject}</span>
                  <span className="font-bold">${cancellingSession.fee}</span>
                </div>
                <p className="text-[#525252] leading-relaxed">
                  Cancelling will remove this reservation from your schedule and notify {userRole === 'tutor' ? cancellingSession.studentName : cancellingSession.tutorName}. A full refund of ${cancellingSession.fee} will be issued to your payment method.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0f0f2]">
                <button
                  type="button"
                  onClick={() => setCancellingSession(null)}
                  className="px-4 py-2 rounded-xl border border-[#e5e5e7] hover:bg-[#f5f5f7] text-xs font-semibold text-[#525252] transition-colors cursor-pointer select-none"
                >
                  Keep Session
                </button>
                <button
                  type="button"
                  onClick={confirmCancelSession}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-md text-white text-xs font-semibold transition-all shadow-xs cursor-pointer select-none"
                >
                  Yes, Cancel Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
