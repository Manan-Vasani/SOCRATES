import { AnimatePresence, motion, Variants } from 'framer-motion'
import {
    ArrowLeft,
    Atom,
    BookOpen,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Code2,
    Cpu,
    Globe,
    GraduationCap,
    Layers,
    Lock,
    ShieldCheck,
    Sigma,
    Sparkles,
    Star,
    Target,
    Terminal,
    User,
    Users,
    X,
    Zap
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import CustomDropdown from '../components/CustomDropdown'
import Navbar from '../components/Navbar'
import { createTutorBookingApi, fetchTutorBookingsApi, fetchTutorDetailsApi } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getStoredProfileSessions, ProfileSessionItem, saveStoredProfileSessions } from './Profile'

function TutorScheduleSkeleton() {
  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 space-y-8 animate-pulse">
      {/* Top Header & Legend Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-36 h-4 bg-[#e5e5e7] rounded-md" />
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-[#e5e5e7]">
          <div className="w-20 h-3 bg-[#e5e5e7] rounded-sm" />
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e5e5e7]" />
            <div className="w-8 h-3 bg-[#e5e5e7] rounded-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e5e5e7]" />
            <div className="w-12 h-3 bg-[#e5e5e7] rounded-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e5e5e7]" />
            <div className="w-10 h-3 bg-[#e5e5e7] rounded-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e5e5e7]" />
            <div className="w-11 h-3 bg-[#e5e5e7] rounded-sm" />
          </div>
        </div>
      </div>

      {/* Tutor Profile Banner Skeleton */}
      <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#e5e5e7] shrink-0" />
          <div className="space-y-2">
            <div className="w-48 h-6 bg-[#e5e5e7] rounded-lg" />
            <div className="w-36 h-4 bg-[#e5e5e7] rounded-md" />
            <div className="w-28 h-4 bg-[#e5e5e7] rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-6 bg-[#e5e5e7] rounded-xl" />
          <div className="w-24 h-6 bg-[#e5e5e7] rounded-xl" />
          <div className="w-16 h-6 bg-[#e5e5e7] rounded-xl" />
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#f0f0f2] gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-5 h-5 bg-[#e5e5e7] rounded-md shrink-0" />
            <div className="w-44 h-6 bg-[#e5e5e7] rounded-lg" />
            <div className="w-28 h-6 bg-[#e5e5e7] rounded-full border border-[#e5e5e7] shrink-0" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-[#e5e5e7] rounded-xl" />
            <div className="w-8 h-8 bg-[#e5e5e7] rounded-xl" />
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-3 text-center pb-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 bg-[#e5e5e7] rounded-md mx-auto w-8" />
          ))}
        </div>

        {/* 35 Calendar Cells Skeleton */}
        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="w-full h-20 sm:h-24 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] p-3 flex flex-col justify-between">
              <div className="w-5 h-4 bg-[#e5e5e7] rounded-md" />
              <div className="w-12 h-3 bg-[#e5e5e7] rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mock Tutor Dataset (fallback for route lookup)
const MOCK_TUTORS = [
  {
    id: 'tut_101',
    name: 'Dr. Evelyn Reed',
    subject: 'Algorithms & Data Structures',
    experience: '8+ yrs exp • Stanford PhD',
    rating: 4.98,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 65,
    subjects: ['Algorithms', 'Data Structures', 'Python', 'C++'],
    bio: 'Specialized in Graph Theory, Dynamic Programming, and High-Performance Algorithm Design for CS majors.'
  },
  {
    id: 'tut_102',
    name: 'Marcus Chen',
    subject: 'Linear Algebra & AI Foundations',
    experience: '6+ yrs exp • MIT Alum',
    rating: 4.95,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 55,
    subjects: ['Linear Algebra', 'PyTorch', 'Machine Learning', 'Python'],
    bio: 'Passionate about demystifying Matrix Decompositions, Vector Calculus, and Deep Learning models.'
  },
  {
    id: 'tut_103',
    name: 'Sophia Williams',
    subject: 'Quantum Mechanics & Physics',
    experience: '10+ yrs exp • Cambridge Postdoc',
    rating: 5.0,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 70,
    subjects: ['Quantum Physics', 'Calculus', 'Thermodynamics'],
    bio: 'Theoretical Physicist helping university students master Quantum Computing and Electromagnetism.'
  },
  {
    id: 'tut_104',
    name: 'Alexandre Dubois',
    subject: 'Full-Stack React & Node Systems',
    experience: '7+ yrs exp • Senior Staff Engineer',
    rating: 4.92,
    reviews: 76,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 60,
    subjects: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    bio: 'Building real-world scalable web applications, TypeScript architecture, and cloud database backends.'
  },
  {
    id: 'tut_105',
    name: 'Priya Sharma',
    subject: 'Statistics & Data Science',
    experience: '5+ yrs exp • UC Berkeley MS',
    rating: 4.97,
    reviews: 115,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 50,
    subjects: ['Statistics', 'Data Science', 'Python', 'R'],
    bio: 'Expert in Applied Probability, Hypothesis Testing, Pandas, Data Visualization, and Econometrics.'
  },
  {
    id: 'tut_106',
    name: 'David Vance',
    subject: 'Organic Chemistry & Biochemistry',
    experience: '9+ yrs exp • Johns Hopkins MD',
    rating: 4.99,
    reviews: 184,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 65,
    subjects: ['Organic Chemistry', 'Biochemistry', 'MCAT Prep'],
    bio: 'Helping pre-med and chemistry scholars conquer Reaction Mechanisms, Synthesis, and Spectroscopy.'
  }
]

const MOCK_STUDENT_NAMES = [
  'Sarah Jenkins',
  'Alex Rivera',
  'Elena Rostova',
  'Michael Chang',
  'David Miller',
  'Sophia Chen'
]

function getDurationMaxMembers(durationMin: number): number {
  if (durationMin === 20) return 3
  if (durationMin === 30) return 4
  return 5
}

interface TimeSlot {
  time: string
  subject: string
  topic?: string
  availableDurations?: string
  isBooked: boolean
  bookedBy?: string
  allowGroupSplit?: boolean
  durationMin?: number
  currentMembers?: number
  maxMembers?: number
}

interface DaySchedule {
  date: number
  dayOfWeek: number
  fullDateStr: string
  status: 'green' | 'yellow' | 'red' | 'past'
  label: string
  isPast: boolean
  slots: TimeSlot[]
}

function getSubjectIcon(sub: string) {
  const lower = sub.toLowerCase()
  if (lower.includes('python')) return <Terminal size={14} className="text-[#0066cc]" />
  if (lower.includes('algebra') || lower.includes('math') || lower.includes('calculus')) {
    return <Sigma size={14} className="text-[#0066cc]" />
  }
  if (lower.includes('machine') || lower.includes('ai') || lower.includes('torch')) {
    return <Sparkles size={14} className="text-[#0066cc]" />
  }
  if (lower.includes('structure') || lower.includes('algorithm') || lower.includes('data')) {
    return <Layers size={14} className="text-[#0066cc]" />
  }
  if (lower.includes('c++') || lower.includes('code') || lower.includes('system')) {
    return <Code2 size={14} className="text-[#0066cc]" />
  }
  if (lower.includes('react') || lower.includes('web') || lower.includes('frontend')) {
    return <Atom size={14} className="text-[#0066cc]" />
  }
  if (lower.includes('physics') || lower.includes('quantum')) {
    return <Cpu size={14} className="text-[#0066cc]" />
  }
  return <BookOpen size={14} className="text-[#0066cc]" />
}

export default function TutorSchedule() {
  const { tutorId } = useParams<{ tutorId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [backendTutor, setBackendTutor] = useState<any | null>(null)
  const [backendBookings, setBackendBookings] = useState<any[]>([])

  // Find Tutor by ID with backend state fallback
  const tutor = useMemo(() => {
    if (backendTutor) {
      return {
        id: backendTutor._id || backendTutor.id || tutorId,
        name: backendTutor.name,
        subject: backendTutor.subject,
        experience: backendTutor.experience,
        rating: typeof backendTutor.rating === 'number' ? backendTutor.rating : parseFloat(backendTutor.rating) || 4.98,
        reviews: backendTutor.reviews || '142 reviews',
        image: backendTutor.image,
        hourlyRate: backendTutor.hourlyRate || 65,
        rate20Min: backendTutor.rate20Min || 15,
        rate30Min: backendTutor.rate30Min || 25,
        subjects: backendTutor.subjects || [backendTutor.subject.split(' ')[0], 'Computer Science', 'Tutorials'],
        bio: backendTutor.bio || `${backendTutor.experience} specializing in ${backendTutor.subject}.`
      }
    }

    if (!tutorId) return MOCK_TUTORS[0]
    const searchKey = String(tutorId).toLowerCase()
    
    // Direct match or alias match
    const found = MOCK_TUTORS.find(t => {
      const idLower = t.id.toLowerCase()
      const rawNum = idLower.replace('tut_', '')
      return (
        idLower === searchKey ||
        searchKey === rawNum ||
        searchKey.includes(idLower) ||
        searchKey.includes(rawNum)
      )
    })

    return found || MOCK_TUTORS[0]
  }, [tutorId, backendTutor])

  // Current Month State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)) // July 2026
  const [hoveredDay, setHoveredDay] = useState<DaySchedule | null>(null)
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<20 | 30 | 60>(60)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [bookingTopic, setBookingTopic] = useState('')
  const [allowGroupSplitBooking, setAllowGroupSplitBooking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [groupSplitModalSlot, setGroupSplitModalSlot] = useState<{ day: DaySchedule; slot: TimeSlot } | null>(null)
  const [bookingRefreshKey, setBookingRefreshKey] = useState(0)
  const [joinedSlotKeys, setJoinedSlotKeys] = useState<Set<string>>(new Set())
  const hoverTimeoutRef = React.useRef<any>(null)

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (selectedDay || groupSplitModalSlot) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedDay, groupSplitModalSlot])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    async function loadBackendData() {
      if (tutorId) {
        const [tData, bData] = await Promise.all([
          fetchTutorDetailsApi(tutorId),
          fetchTutorBookingsApi(tutorId)
        ])
        if (isMounted) {
          if (tData) setBackendTutor(tData)
          if (bData && Array.isArray(bData)) setBackendBookings(bData)
        }
      }
      if (isMounted) {
        setTimeout(() => setIsLoading(false), 200)
      }
    }

    loadBackendData()
    return () => { isMounted = false }
  }, [tutorId])

  const handleCellMouseEnter = (day: DaySchedule) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredDay(day)
  }

  const handleCellMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDay(null)
    }, 450)
  }

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }

  const handlePopoverMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDay(null)
    }, 300)
  }

  // Generate Calendar Days for Current Month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: (DaySchedule | null)[] = []

    // Padding empty cells for days before start of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null)
    }

    // Populate month days with deterministic mock schedules
    const today = new Date(2026, 6, 23) // Current simulated date (July 23, 2026)

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dayOfWeek = (firstDayIndex + dayNum - 1) % 7
      const dateObj = new Date(year, month, dayNum)
      const isPast = dateObj < today
      
      // Deterministic availability pattern
      let status: 'green' | 'yellow' | 'red' | 'past' = 'green'
      let label = 'High Availability'

      if (isPast) {
        status = 'past'
        label = 'Session Closed (Unavailable)'
      } else if (dayOfWeek === 0) { // Sunday
        status = 'red'
        label = 'Fully Booked'
      } else if (dayNum % 5 === 0 || dayNum % 7 === 0) {
        status = 'yellow'
        label = 'Limited Slots (1-2 Left)'
      } else if (dayNum % 3 === 0) {
        status = 'green'
        label = 'High Availability (4+ Slots)'
      }

      // Generate slots
      const slots: TimeSlot[] = []
      const availableSubjects = tutor.subjects

      const slotTimes = status === 'green' 
        ? ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM']
        : status === 'yellow'
        ? ['10:00 AM', '01:30 PM', '04:00 PM']
        : ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM']

      const mockTopics = ['Graph Traversals & BFS', 'Dynamic Programming Prep', 'Tree Recursion & Heaps']
      slotTimes.forEach((time, idx) => {
        const isSlotBooked = status === 'red' || (status === 'yellow' && idx === 1)
        // Dynamic realistic balance: mix of Group Split (yellow) and Private 1-on-1 (red)
        const allowGroup = isSlotBooked ? (dayNum + idx) % 3 !== 0 : true
        const topic = isSlotBooked && idx % 2 === 0 ? mockTopics[(dayNum + idx) % mockTopics.length] : undefined
        const durationMin = idx % 3 === 0 ? 20 : idx % 3 === 1 ? 30 : 60
        const maxMembers = getDurationMaxMembers(durationMin)
        const currentMembers = isSlotBooked && allowGroup ? ((dayNum + idx) % maxMembers) + 1 : 1

        slots.push({
          time,
          subject: isSlotBooked ? availableSubjects[idx % availableSubjects.length] : '',
          topic,
          availableDurations: '20, 30, 60 min',
          isBooked: isSlotBooked,
          bookedBy: isSlotBooked ? MOCK_STUDENT_NAMES[(dayNum + idx) % MOCK_STUDENT_NAMES.length] : undefined,
          allowGroupSplit: allowGroup,
          durationMin,
          maxMembers,
          currentMembers
        })
      })

      const dateString = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })

      days.push({
        date: dayNum,
        dayOfWeek,
        fullDateStr: dateString,
        status,
        label,
        isPast,
        slots
      })
    }

    return days
  }, [currentDate, tutor])

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDay || !selectedSlot) return

    if (bookingTopic.length > 250) {
      toast.error('Learning Topic cannot exceed 250 characters', {
        description: `Please trim your text by ${bookingTopic.length - 250} characters before confirming.`,
      })
      return
    }

    setIsSubmitting(true)
    const calculatedFee = selectedDuration === 20 
      ? ((tutor as any).rate20Min || 15)
      : selectedDuration === 30
      ? ((tutor as any).rate30Min || 25)
      : tutor.hourlyRate;
    const activeSubject = selectedSubject || tutor.subjects[0] || 'General Session'

    const res = await createTutorBookingApi(tutor.id, {
      studentName: 'Alex Mercer',
      date: selectedDay.fullDateStr,
      time: selectedSlot.time,
      subject: activeSubject,
      duration: selectedDuration,
      topic: bookingTopic,
      fee: calculatedFee
    })

    setIsSubmitting(false)
    selectedSlot.isBooked = true
    selectedSlot.bookedBy = 'Alex Mercer'
    selectedSlot.subject = activeSubject
    selectedSlot.topic = bookingTopic ? bookingTopic.trim() : undefined
    selectedSlot.allowGroupSplit = allowGroupSplitBooking

    toast.success(`Session Booked with ${tutor.name}!`, {
      description: `${selectedDay.fullDateStr} at ${selectedSlot.time} (${selectedDuration} min • $${calculatedFee} • ${selectedSlot.subject} • ${allowGroupSplitBooking ? 'Group Enabled' : 'Private Session'})`
    })

    if (res?.success) {
      setBackendBookings(prev => [...prev, {
        tutorId: tutor.id,
        studentName: 'Alex Mercer',
        date: selectedDay.fullDateStr,
        time: selectedSlot.time,
        subject: selectedSlot.subject,
        duration: selectedDuration,
        fee: calculatedFee
      }])
    }

    // Save booked session to localStorage so Profile page updates instantly
    const newProfileSession: ProfileSessionItem = {
      id: `sess-${Date.now()}`,
      tutorName: tutor.name,
      studentName: 'Alex Mercer',
      subject: selectedSlot.subject,
      topic: bookingTopic ? bookingTopic.trim() : undefined,
      dateStr: selectedDay.fullDateStr,
      timeStr: selectedSlot.time,
      duration: selectedDuration,
      fee: calculatedFee,
      isGroupSplit: allowGroupSplitBooking,
      status: 'Upcoming'
    }
    const storedSessions = getStoredProfileSessions()
    saveStoredProfileSessions([newProfileSession, ...storedSessions])

    setBookingRefreshKey(prev => prev + 1)
    setSelectedDay(null)
    setSelectedSlot(null)
    setBookingTopic('')
  }

  const monthYearHeader = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.02
      }
    }
  }

  const cardVariants: Variants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-dvh bg-[#fafafc] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/10 selection:text-[#0066cc] pb-24" style={{ minHeight: '100dvh' }}>
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,102,204,0.035)_0%,_transparent_60%)] pointer-events-none z-0" />

      {/* Global Navbar */}
      <Navbar />

      {isLoading ? (
        <TutorScheduleSkeleton />
      ) : (
        <motion.main 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-6xl mx-auto px-6 pt-8 space-y-8"
        >
        {/* Back Link & Header */}
        <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/tutors')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0066cc] hover:underline cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Tutors List
          </button>

          {/* Legend Badges */}
          <div className="flex items-center gap-4 text-xs font-medium bg-white px-4 py-2 rounded-2xl border border-[#e5e5e7] shadow-xs">
            <span className="text-[#7a7a7a]">Status Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a1a1a6]" />
              <span className="text-[#7a7a7a]">Past</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[#1d1d1f]">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[#1d1d1f]">Limited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-[#1d1d1f]">Booked</span>
            </div>
          </div>
        </motion.div>

        {/* Tutor Info Banner */}
        <motion.div 
          variants={cardVariants}
          className="bg-white rounded-3xl border border-[#e5e5e7] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative select-none"
        >
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 z-10">
            {/* Avatar with Ring */}
            <div className="relative shrink-0">
              <img 
                src={tutor.image} 
                alt={tutor.name} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-[#0066cc]/25 border-2 border-white shadow-md shrink-0 transform-gpu"
              />
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">{tutor.name}</h1>
                <span title="Verified Educator" className="inline-flex items-center shrink-0">
                  <ShieldCheck size={20} className="text-[#0066cc]" />
                </span>
              </div>

              <p className="text-[13px] text-[#6e6e73] font-medium leading-snug">
                {tutor.experience}
              </p>

              {/* Rating & Rate Display */}
              <div className="flex items-center gap-2.5 pt-1 text-xs flex-wrap">
                <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/25 px-2 py-0.5 rounded-lg text-xs font-semibold">
                  <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                  <span>{tutor.rating}</span>
                </div>
                <span className="text-xs text-[#6e6e73] font-normal">
                  ({String(tutor.reviews || '142').replace(/\s*reviews\s*/gi, '').trim()} reviews)
                </span>
                <span className="text-[#d2d2d7]">•</span>
                <span className="text-[#0066cc] font-extrabold text-sm tracking-tight">
                  ${tutor.hourlyRate}<span className="text-xs text-[#6e6e73] font-normal">/hr</span>
                </span>
              </div>
            </div>
          </div>

          {/* Subject Badges */}
          <div className="flex flex-wrap gap-1.5 z-10 md:max-w-[40%] md:justify-end items-center">
            {tutor.subjects.map(sub => (
              <span 
                key={sub} 
                className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] border border-[#e5e5e7] text-xs font-medium text-[#525252]"
              >
                {sub}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Monthly Calendar View */}
        <motion.div variants={cardVariants} className="bg-white rounded-3xl border border-[#e5e5e7] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Month Header Controls & Timezone Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f0f0f2] pb-6 gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CalendarIcon size={20} className="text-[#0066cc]" />
              <h2 className="text-lg sm:text-xl font-semibold text-[#1d1d1f] tracking-tight">{monthYearHeader} Schedule</h2>
              <span className="px-2.5 py-1 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 text-xs font-semibold text-[#0066cc] flex items-center gap-1.5 shrink-0">
                <Globe size={13} className="text-[#0066cc]" />
                <span>IST (UTC+5:30)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-2 rounded-xl border border-[#e5e5e7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-2 rounded-xl border border-[#e5e5e7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#7a7a7a] tracking-wider uppercase pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-20 sm:h-24 rounded-2xl bg-[#fafafc] border border-[#f0f0f2]/60"
                  />
                )
              }

              // Color styles based on status
              const statusStyles = {
                green: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/80 hover:border-emerald-300 cursor-pointer',
                yellow: 'bg-amber-50/70 border-amber-200/80 text-amber-950 hover:bg-amber-100/80 hover:border-amber-300 cursor-pointer',
                red: 'bg-red-50/60 border-red-200 text-red-950 cursor-not-allowed opacity-80',
                past: 'bg-[repeating-linear-gradient(45deg,#f5f5f7,#f5f5f7_6px,#e8e8ed_6px,#e8e8ed_12px)] border-[#d2d2d7] text-[#8e8e93] opacity-60 cursor-not-allowed'
              }

              const badgeStyles = {
                green: 'bg-emerald-500',
                yellow: 'bg-amber-500',
                red: 'bg-red-600',
                past: 'bg-gray-400'
              }

              const openSlotsCount = day.slots.filter((s) => !s.isBooked).length
              let computedStatus: 'green' | 'yellow' | 'red' | 'past' = day.status
              if (!day.isPast) {
                if (openSlotsCount === 0) {
                  computedStatus = 'red'
                } else if (openSlotsCount < day.slots.length) {
                  computedStatus = 'yellow'
                } else {
                  computedStatus = 'green'
                }
              }

              const hasGroupableSlot = day.slots.some((s) => {
                const isHost = s.isBooked && (
                  s.bookedBy?.toLowerCase().includes('alex mercer') ||
                  (user?.fullName && s.bookedBy?.toLowerCase().includes(user.fullName.toLowerCase()))
                )
                if (!s.isBooked || !s.allowGroupSplit || joinedSlotKeys.has(`${day.date}-${s.time}`) || isHost) return false
                const sMaxMem = s.maxMembers || getDurationMaxMembers(s.durationMin || selectedDuration)
                const sCurrMem = s.currentMembers || 1
                return sCurrMem < sMaxMem
              })
              const isDateDisabled = day.isPast || (computedStatus === 'red' && !hasGroupableSlot)
              // Only truly block hover for past days — booked/full days still show tooltip
              const isClickDisabled = isDateDisabled

              return (
                <div key={`${day.date}-${bookingRefreshKey}`} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isClickDisabled) {
                        setSelectedDay(day)
                        setSelectedSlot(day.slots.find((s) => !s.isBooked) || day.slots.find((s) => s.allowGroupSplit) || day.slots[0] || null)
                      }
                    }}
                    onMouseEnter={() => !day.isPast && handleCellMouseEnter(day)}
                    onMouseLeave={handleCellMouseLeave}
                    className={`w-full h-20 sm:h-24 rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between transition-all text-left select-none ${
                      hasGroupableSlot && computedStatus === 'red'
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/90 cursor-pointer'
                        : statusStyles[computedStatus]
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-bold">{day.date}</span>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        hasGroupableSlot && computedStatus === 'red' ? 'bg-emerald-600' : badgeStyles[computedStatus]
                      }`} />
                    </div>

                    <div className="text-[10px] sm:text-xs font-semibold truncate opacity-90">
                      {day.isPast && 'Passed'}
                      {!day.isPast && computedStatus === 'green' && (
                        openSlotsCount === day.slots.length ? `${openSlotsCount} slots` : `${openSlotsCount} left`
                      )}
                      {!day.isPast && computedStatus === 'yellow' && `${openSlotsCount} left`}
                      {!day.isPast && computedStatus === 'red' && (
                        hasGroupableSlot ? 'Group 50% Off' : 'Booked'
                      )}
                    </div>
                  </button>

                  {/* SIDE HOVER / CLICK TOOLTIP POPOVER (Positioned intelligently with explicit X Close Button) */}
                  {hoveredDay?.date === day.date && (
                    <div 
                      onMouseEnter={handlePopoverMouseEnter}
                      onMouseLeave={handlePopoverMouseLeave}
                      className={`absolute top-1/2 -translate-y-1/2 ${
                        day.dayOfWeek >= 5 ? 'right-full mr-3' : 'left-full ml-3'
                      } w-72 p-3.5 pb-3 flex flex-col gap-2 bg-white text-[#1d1d1f] text-xs rounded-2xl shadow-2xl z-50 pointer-events-auto border border-[#e5e5e7] animate-in fade-in duration-150`}
                    >
                      <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-2">
                        <span className="font-bold text-[#1d1d1f] text-xs">{day.fullDateStr}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            day.isPast ? 'bg-gray-100 text-gray-600 border-gray-200' :
                            computedStatus === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            computedStatus === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            hasGroupableSlot ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {day.isPast ? 'Passed' : computedStatus === 'green' ? (openSlotsCount === day.slots.length ? 'Available' : `${openSlotsCount} Left`) : computedStatus === 'yellow' ? `Limited (${openSlotsCount} Left)` : hasGroupableSlot ? 'Group Split' : 'Fully Booked'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] text-[#7a7a7a] font-semibold uppercase tracking-wider">
                          Time Slots & Reservations:
                        </p>
                        {day.slots.map((slot, sIdx) => {
                          const popoverSlotKey = `${day.date}-${slot.time}`
                          const isPopoverJoinedByMe = joinedSlotKeys.has(popoverSlotKey)
                          const isPopoverHost = slot.isBooked && (
                            slot.bookedBy?.toLowerCase().includes('alex mercer') ||
                            (user?.fullName && slot.bookedBy?.toLowerCase().includes(user.fullName.toLowerCase()))
                          )
                          
                          // If I am the host or I already joined, it's not a general group-split or private slot for me to book/join
                          const isGroupSplit = slot.isBooked && slot.allowGroupSplit && !isPopoverJoinedByMe && !isPopoverHost
                          const isPrivateBooked = slot.isBooked && !slot.allowGroupSplit && !isPopoverJoinedByMe && !isPopoverHost

                          // Group-full detection for tooltip
                          const popoverDuration = slot.durationMin || selectedDuration
                          const popoverMaxMem = slot.maxMembers || getDurationMaxMembers(popoverDuration)
                          const popoverCurrMem = slot.currentMembers || 1
                          const isPopoverGroupFull = isGroupSplit && popoverCurrMem >= popoverMaxMem

                          const isOurs = isPopoverJoinedByMe || isPopoverHost

                          return (
                            <div 
                              key={sIdx} 
                              onClick={(e) => {
                                if (isGroupSplit && !isPopoverGroupFull) {
                                  e.stopPropagation()
                                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                                  setHoveredDay(null)
                                  setGroupSplitModalSlot({ day, slot })
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-[11px] space-y-1 min-h-[46px] flex flex-col justify-center transition-all ${
                                isOurs
                                  ? 'bg-blue-50/80 border-blue-200 text-blue-950 cursor-default'
                                  : isPopoverGroupFull
                                  ? 'bg-slate-50/80 border-slate-300 text-slate-900 cursor-not-allowed'
                                  : isGroupSplit
                                  ? 'bg-amber-50/80 border-amber-200 text-amber-950 hover:bg-amber-100/80 cursor-pointer'
                                  : isPrivateBooked 
                                  ? 'bg-red-50/60 border-red-200/80 text-red-950 cursor-not-allowed select-none' 
                                  : 'bg-[#fafafc] border-[#e8e8ed] text-[#1d1d1f]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 font-sans font-bold text-xs tracking-tight">
                                  <Clock size={11} className={isOurs ? 'text-blue-600' : isPopoverGroupFull ? 'text-slate-500' : isGroupSplit ? 'text-amber-600' : isPrivateBooked ? 'text-red-600' : 'text-[#0066cc]'} />
                                  {slot.time}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isOurs
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : isPopoverGroupFull
                                    ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                    : isGroupSplit 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : isPrivateBooked 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-emerald-100/70 text-emerald-700'
                                }`}>
                                  {isPopoverJoinedByMe ? 'Joined' : isPopoverHost ? 'Your Session' : isPopoverGroupFull ? `Full (${popoverCurrMem}/${popoverMaxMem})` : isGroupSplit ? 'Group Split' : isPrivateBooked ? 'Reserved' : 'Open'}
                                </span>
                              </div>

                              {isOurs ? (
                                <div className="space-y-1 pt-0.5 border-t mt-1 border-blue-200/70">
                                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-900">
                                    {isPopoverJoinedByMe ? (
                                      <>
                                        <CheckCircle2 size={10} className="text-blue-600 shrink-0" />
                                        <span>You already joined the group</span>
                                      </>
                                    ) : (
                                      <>
                                        <Users size={10} className="text-blue-600 shrink-0" />
                                        <span>Booked by <strong className="font-bold text-blue-950">You (Host)</strong></span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : isPopoverGroupFull ? (
                                <div className="space-y-1.5 pt-0.5 border-t mt-1 border-slate-200/70">
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 truncate">
                                    <Lock size={10} className="text-slate-500 shrink-0" />
                                    <span className="truncate">Booked by <strong className="font-semibold text-slate-900">{slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}</strong></span>
                                  </div>
                                  <div className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-bold select-none cursor-not-allowed">
                                    <span className="flex items-center gap-1">
                                      <Lock size={11} className="text-slate-500 shrink-0" />
                                      <span>Group Locked</span>
                                    </span>
                                    <span className="bg-slate-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                      {popoverCurrMem}/{popoverMaxMem} Max
                                    </span>
                                  </div>
                                </div>
                              ) : slot.isBooked ? (
                                <div className={`space-y-1.5 pt-0.5 border-t mt-1 ${isGroupSplit ? 'border-amber-200/70' : 'border-red-100/80'}`}>
                                  <div 
                                    title={slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}
                                    className={`flex items-center justify-between text-[10px] font-medium truncate ${
                                      isGroupSplit ? 'text-amber-900 cursor-pointer' : 'text-red-900 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {isGroupSplit ? (
                                        <Users size={10} className="text-amber-600 shrink-0" />
                                      ) : (
                                        <Lock size={10} className="text-red-600 shrink-0" />
                                      )}
                                      <span className="truncate">Booked by <strong className={`font-semibold ${isGroupSplit ? 'text-amber-950' : 'text-red-950'}`}>{slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}</strong></span>
                                    </div>
                                    {isPrivateBooked && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                                        Private
                                      </span>
                                    )}
                                  </div>
                                  {isGroupSplit && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-900 font-medium truncate pt-0.5">
                                      <BookOpen size={10} className="text-amber-600 shrink-0" />
                                      <span className="truncate">{slot.topic ? 'Topic' : 'Subject'}: <strong className="font-semibold text-amber-950">{slot.topic || slot.subject}</strong></span>
                                    </div>
                                  )}

                                  {slot.allowGroupSplit && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                                        setHoveredDay(null)
                                        setGroupSplitModalSlot({ day, slot })
                                      }}
                                      className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-900 text-[10px] font-bold transition-all cursor-pointer select-none"
                                    >
                                      <span className="flex items-center gap-1">
                                        <Users size={11} className="text-emerald-600 shrink-0" />
                                        <span>Join & Split Fee</span>
                                      </span>
                                      <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                        ${Math.round(tutor.hourlyRate / 2)} (50% Off)
                                      </span>
                                    </button>
                                  )}
                                </div>
                              ) : null}
                          </div>
                        )})}
                      </div>

                      {/* Tooltip Side Pointer Arrow */}
                      {day.dayOfWeek >= 5 ? (
                        <>
                          <div className="absolute top-1/2 -translate-y-1/2 left-full -ml-[1px] border-4 border-transparent border-l-[#e5e5e7]" />
                          <div className="absolute top-1/2 -translate-y-1/2 left-full -ml-[2px] border-4 border-transparent border-l-white" />
                        </>
                      ) : (
                        <>
                          <div className="absolute top-1/2 -translate-y-1/2 right-full -mr-[1px] border-4 border-transparent border-r-[#e5e5e7]" />
                          <div className="absolute top-1/2 -translate-y-1/2 right-full -mr-[2px] border-4 border-transparent border-r-white" />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.main>
      )}

      {/* SLOT BOOKING MODAL */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="w-full max-w-2xl bg-white border border-[#e0e0e0] rounded-3xl p-6 shadow-2xl relative text-[#1d1d1f] transform-gpu select-none max-h-[85vh] flex flex-col antialiased"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#e5e5e7] pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center shrink-0">
                    <CalendarIcon size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-[#1d1d1f]">
                      Book Session with {tutor.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[#1d1d1f]">{selectedDay.fullDateStr}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-bold border border-[#0066cc]/20 flex items-center gap-1">
                        <Globe size={10} />
                        IST (UTC+5:30)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedDay.status === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        selectedDay.status === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {selectedDay.status === 'green' ? 'High Availability' : selectedDay.status === 'yellow' ? 'Limited (1-2 Left)' : 'Fully Booked'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-full text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] active:bg-[#e8e8ed] transition-colors duration-150 cursor-pointer select-none shrink-0 transform-gpu"
                  title="Close modal"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Slot Selection Form */}
              <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto -mr-3.5 pr-3 pl-1 py-4 space-y-5 custom-scrollbar">
                {/* Side by Side: Subject Selector & Session Duration CustomDropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subject Selector Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                      <BookOpen size={13} className="text-[#0066cc]" />
                      <span>Subject / Area</span>
                    </label>
                    <CustomDropdown
                      options={(tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects : ['General Tutoring']).map((sub) => ({
                        value: sub,
                        label: sub,
                        icon: getSubjectIcon(sub),
                      }))}
                      value={selectedSubject || (tutor.subjects?.[0] || 'General Tutoring')}
                      onChange={(val) => setSelectedSubject(val)}
                      className="w-full"
                      buttonClassName="w-full py-2.5 px-3.5 bg-[#f5f5f7] border-[#e0e0e0] rounded-2xl text-xs font-medium text-[#1d1d1f]"
                    />
                  </div>

                  {/* Session Duration Selector Dropdown */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                        <Clock size={13} className="text-[#0066cc]" />
                        <span>Session Duration</span>
                      </label>
                      <span className="text-[10px] font-semibold text-[#6e6e73]">
                        Pro-rated
                      </span>
                    </div>
                    <CustomDropdown
                      options={[
                        {
                          value: 20,
                          label: `20 Min ($${(tutor as any).rate20Min || Math.round(tutor.hourlyRate * (20 / 60))})`,
                          badge: 'Quick Doubt',
                          icon: <Zap size={14} className="text-[#0066cc]" />,
                        },
                        {
                          value: 30,
                          label: `30 Min ($${(tutor as any).rate30Min || Math.round(tutor.hourlyRate * (30 / 60))})`,
                          badge: 'Concept Review',
                          icon: <Target size={14} className="text-[#0066cc]" />,
                        },
                        {
                          value: 60,
                          label: `60 Min ($${tutor.hourlyRate})`,
                          badge: 'Full Session',
                          icon: <GraduationCap size={14} className="text-[#0066cc]" />,
                        },
                      ]}
                      value={selectedDuration}
                      onChange={(val) => setSelectedDuration(val as 20 | 30 | 60)}
                      className="w-full"
                      buttonClassName="w-full py-2.5 px-3.5 bg-[#f5f5f7] border-[#e0e0e0] rounded-2xl text-xs font-medium text-[#1d1d1f]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1d1d1f]">
                      Select Available Time Slot
                    </label>
                    <span className="text-[11px] font-semibold text-[#6e6e73]">
                      Duration: <strong className="text-[#1d1d1f]">{selectedDuration} min per slot</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedDay.slots.map((slot, idx) => {
                      const isSelected = selectedSlot?.time === slot.time
                      const slotKey = `${selectedDay.date}-${slot.time}`
                      const isJoinedByMe = joinedSlotKeys.has(slotKey)
                      const isBookedByMe = isJoinedByMe || (slot.isBooked && (
                        slot.bookedBy?.toLowerCase().includes('alex mercer') ||
                        (user?.fullName && slot.bookedBy?.toLowerCase().includes(user.fullName.toLowerCase()))
                      ))
                      const isGroupableBooked = slot.isBooked && slot.allowGroupSplit && !isBookedByMe
                      const isPrivateBooked = slot.isBooked && !slot.allowGroupSplit && !isBookedByMe

                      const slotDuration = slot.durationMin || selectedDuration
                      const slotMaxMem = slot.maxMembers || getDurationMaxMembers(slotDuration)
                      const slotCurrMem = slot.currentMembers || 1
                      const isGroupFull = isGroupableBooked && slotCurrMem >= slotMaxMem

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isPrivateBooked}
                          onClick={() => {
                            if (isBookedByMe) {
                              if (isJoinedByMe) {
                                toast.info('You Already Joined This Group', {
                                  description: 'You are already a member of this group session. No action needed!',
                                })
                              } else {
                                toast.error('You Already Booked This Session', {
                                  description: 'You are the primary host of this tutoring session. You cannot join or split fee on your own booked slot.',
                                })
                              }
                              return
                            }
                            if (isGroupableBooked) {
                              if (isGroupFull) {
                                toast.error('Group Session Full (Locked)', {
                                  description: `This ${slotDuration}-minute group session has reached its maximum capacity of ${slotMaxMem} members (${slotMaxMem}/${slotMaxMem}). No additional students can join.`
                                })
                                return
                              }
                              setSelectedDay(null)
                              setGroupSplitModalSlot({ day: selectedDay, slot })
                            } else if (!slot.isBooked) {
                              setSelectedSlot(slot)
                            }
                          }}
                          className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all duration-150 select-none transform-gpu flex flex-col justify-between ${
                            isBookedByMe
                              ? 'bg-blue-50/90 border-blue-200 text-blue-950 hover:bg-blue-100/90 cursor-pointer min-h-[76px]'
                              : isPrivateBooked
                              ? 'bg-red-50/80 border-red-200 text-red-950 cursor-not-allowed opacity-80 min-h-[76px]'
                              : isGroupFull
                              ? 'bg-slate-100/90 border-slate-300 text-slate-900 hover:bg-slate-200/80 cursor-pointer min-h-[76px]'
                              : isGroupableBooked
                              ? 'bg-amber-50/90 border-amber-200 text-amber-950 hover:bg-amber-100 hover:border-amber-300 cursor-pointer min-h-[76px]'
                              : isSelected
                              ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-xs cursor-pointer min-h-[76px]'
                              : 'bg-white border-[#e5e5e7] text-[#1d1d1f] hover:border-[#0066cc] hover:bg-[#0066cc]/5 cursor-pointer min-h-[76px]'
                          }`}
                        >
                          {isBookedByMe ? (
                            <div className="w-full space-y-1.5 my-auto">
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="font-bold text-xs text-blue-950 tracking-tight">{slot.time}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-200/90 text-blue-900 border border-blue-300/60 shrink-0">
                                  {isJoinedByMe ? 'Joined' : 'Your Session'}
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold text-blue-900 truncate">
                                {isJoinedByMe ? (
                                  <>You already joined the group</>
                                ) : (
                                  <>Booked by <strong className="font-bold text-blue-950">You (Host)</strong></>
                                )}
                              </div>
                            </div>
                          ) : isPrivateBooked ? (
                            <div className="w-full space-y-1.5 my-auto">
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="font-bold text-xs text-red-950 tracking-tight">{slot.time}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200/80 shrink-0">
                                  Private
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold text-red-900 truncate">
                                Booked by <strong className="font-bold text-red-950">{slot.bookedBy?.replace(/\s*\([^)]*\)/g, '') || 'Student'}</strong>
                              </div>
                            </div>
                          ) : isGroupFull ? (
                            <div className="w-full space-y-1.5">
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="font-bold text-xs text-[#1d1d1f] tracking-tight">{slot.time}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300 shrink-0 flex items-center gap-1">
                                  <Lock size={9} /> Full ({slotCurrMem}/{slotMaxMem})
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold text-slate-700 truncate">
                                Booked by <strong className="font-bold text-slate-900">{slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}</strong>
                              </div>
                              <div className="w-full pt-0.5">
                                <div className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-slate-200/80 border border-slate-300 text-slate-700 text-[10px] font-bold select-none">
                                  <span className="flex items-center gap-1">
                                    <Lock size={11} className="text-slate-600 shrink-0" />
                                    <span>Group Locked</span>
                                  </span>
                                  <span className="bg-slate-300 text-slate-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                    {slotCurrMem}/{slotMaxMem} Max
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : isGroupableBooked ? (
                            <div className="w-full space-y-1.5">
                              <div className="flex items-center justify-between gap-1 w-full">
                                <span className="font-bold text-xs text-[#1d1d1f] tracking-tight">{slot.time}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300/60 shrink-0">
                                  Group ({slotCurrMem}/{slotMaxMem})
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold text-amber-900 truncate">
                                Booked by <strong className="font-bold text-amber-950">{slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}</strong>
                              </div>
                              <div className="w-full pt-0.5">
                                <div className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-900 text-[10px] font-bold transition-all select-none">
                                  <span className="flex items-center gap-1">
                                    <Users size={11} className="text-emerald-600 shrink-0" />
                                    <span>Join & Split Fee</span>
                                  </span>
                                  <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                    ${Math.round((tutor.hourlyRate * (slotDuration / 60)) / (slotCurrMem + 1))} ({Math.round((1 - (1 / (slotCurrMem + 1))) * 100)}% Off)
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 w-full h-full">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="font-sans font-bold text-xs tracking-tight">
                                  {slot.time}
                                </div>
                                <div className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white/95' : 'text-emerald-700 font-medium'}`}>
                                  {slot.isBooked && slot.subject ? slot.subject : 'Available'}
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center justify-center">
                                {isSelected ? (
                                  <CheckCircle2 size={18} className="text-white shrink-0" />
                                ) : (
                                  <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] border border-[#e5e5e7] shrink-0">
                                    {selectedDuration}m
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1d1d1f]">
                      Learning Topic / Questions (Optional)
                    </label>
                    <span
                      className={`text-[10px] transition-colors ${
                        bookingTopic.length >= 250
                          ? 'text-red-500 font-bold'
                          : 'text-[#7a7a7a] font-medium'
                      }`}
                    >
                      {bookingTopic.length}/250 chars
                    </span>
                  </div>
                  <textarea
                    value={bookingTopic}
                    maxLength={250}
                    onChange={(e) => setBookingTopic(e.target.value)}
                    placeholder="e.g. Graph Traversal algorithms, BFS vs DFS prep..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] focus:bg-white transition-colors resize-none min-h-[84px]"
                  />
                </div>

                {/* Allow Group Fee Sharing Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fafafc] border border-[#e5e5e7] select-none">
                  <div className="space-y-0.5 max-w-[82%]">
                    <label htmlFor="group-split-toggle" className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 cursor-pointer">
                      <Users size={13} className="text-[#0066cc]" />
                      <span>Allow Group Fee Sharing</span>
                    </label>
                    <p className="text-[10px] text-[#7a7a7a] leading-tight">
                      Permit other students to join this session & split tutor cost 50/50.
                    </p>
                  </div>
                  <input
                    id="group-split-toggle"
                    type="checkbox"
                    checked={allowGroupSplitBooking}
                    onChange={(e) => setAllowGroupSplitBooking(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0066cc] focus:ring-[#0066cc] cursor-pointer shrink-0"
                  />
                </div>

                </div>

                <div className="pt-3.5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f0f0f2] shrink-0 bg-white z-10">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium text-[#6e6e73]">Total Fee:</span>
                      <span className="text-xl font-bold text-[#1d1d1f]">
                        ${selectedDuration === 20 
                          ? ((tutor as any).rate20Min || 15)
                          : selectedDuration === 30
                          ? ((tutor as any).rate30Min || 25)
                          : tutor.hourlyRate}
                      </span>
                      <span className="text-xs text-[#6e6e73] font-medium">({selectedDuration} min session)</span>
                    </div>
                    <p className="text-[10px] text-[#7a7a7a]">Includes live Socratic video link & notes</p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="px-4 py-2.5 rounded-xl border border-[#e5e5e7] hover:bg-[#f5f5f7] text-xs font-semibold text-[#525252] transition-colors cursor-pointer select-none"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedSlot}
                      className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none shrink-0"
                    >
                      {isSubmitting ? 'Confirming...' : 'Confirm & Book Slot'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GROUP SESSION & FEE SHARING MODAL */}
      <AnimatePresence>
        {groupSplitModalSlot && (() => {
          const modalDuration = groupSplitModalSlot.slot.durationMin || selectedDuration
          const modalMaxMem = groupSplitModalSlot.slot.maxMembers || getDurationMaxMembers(modalDuration)
          const modalCurrMem = groupSplitModalSlot.slot.currentMembers || 1
          const modalNextMemCount = modalCurrMem + 1
          const isModalGroupFull = modalCurrMem >= modalMaxMem

          const singleSessionCost = Math.round(tutor.hourlyRate * (modalDuration / 60))
          const modalSplitFee = Math.round(singleSessionCost / modalNextMemCount)
          const modalDiscountPct = Math.round((1 - (1 / modalNextMemCount)) * 100)

          return (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: 'transform, opacity' }}
                className="w-full max-w-md bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-5 shadow-2xl relative text-[#1d1d1f] transform-gpu select-none antialiased"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#e5e5e7] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1d1d1f]">
                        Group Session & Fee Sharing
                      </h3>
                      <p className="text-xs text-[#7a7a7a]">
                        Group with <strong className="text-[#1d1d1f]">{groupSplitModalSlot.slot.bookedBy?.replace(/\s*\([^)]*\)/g, '') || 'Alex Mercer'}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGroupSplitModalSlot(null)}
                    className="p-1.5 rounded-full text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer select-none"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Session Details */}
                <div className="p-4 rounded-2xl bg-[#fafafc] border border-[#e8e8ed] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#525252]">
                    <span className="font-medium text-[#7a7a7a]">Tutor Educator:</span>
                    <span className="font-bold text-[#1d1d1f]">{tutor.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#525252]">
                    <span className="font-medium text-[#7a7a7a]">Subject & Duration:</span>
                    <span className="font-bold text-[#0066cc]">{groupSplitModalSlot.slot.subject} ({modalDuration} min)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#525252]">
                    <span className="font-medium text-[#7a7a7a]">Date & Time:</span>
                    <span className="font-bold text-[#1d1d1f]">{groupSplitModalSlot.day.fullDateStr} at {groupSplitModalSlot.slot.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#525252]">
                    <span className="font-medium text-[#7a7a7a]">Original Booker:</span>
                    <span className="font-bold text-[#1d1d1f] flex items-center gap-1">
                      <User size={12} className="text-[#6e6e73]" />
                      {groupSplitModalSlot.slot.bookedBy?.replace(/\s*\([^)]*\)/g, '') || 'Alex Mercer'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#525252] pt-1 border-t border-[#e8e8ed]">
                    <span className="font-medium text-[#7a7a7a]">Group Capacity & Limit:</span>
                    <span className={`font-bold flex items-center gap-1 ${isModalGroupFull ? 'text-amber-600' : 'text-[#1d1d1f]'}`}>
                      <Users size={12} className="text-[#0066cc]" />
                      {modalCurrMem}/{modalMaxMem} Members ({modalDuration}m limit: max {modalMaxMem})
                    </span>
                  </div>
                </div>

                {/* Fee Split Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-950 font-semibold">
                    <span>Single Session Cost ({modalDuration}m):</span>
                    <span className="line-through text-emerald-800">${singleSessionCost}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-emerald-900 pt-1 border-t border-emerald-200/70">
                    <span className="flex items-center gap-1.5">
                      <Users size={15} className="text-emerald-700" />
                      <span>Your Shared Split Fee ({modalNextMemCount} Students):</span>
                    </span>
                    <span className="text-base text-emerald-700 font-extrabold">
                      ${modalSplitFee}.00
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                    ✨ {modalDuration}-min session allows max {modalMaxMem} members ({modalMaxMem - modalCurrMem > 0 ? `${modalMaxMem - modalCurrMem} spot${modalMaxMem - modalCurrMem > 1 ? 's' : ''} remaining` : 'Group Full'}). Joining splits the tutor fee equally ({modalDiscountPct}% discount per student).
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setGroupSplitModalSlot(null)}
                    className="flex-1 py-3 rounded-full border border-[#e0e0e0] text-xs font-semibold text-[#525252] hover:bg-[#f5f5f7] transition-colors cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isModalGroupFull}
                    onClick={() => {
                      if (isModalGroupFull) return
                      const hostName = groupSplitModalSlot.slot.bookedBy?.replace(/\s*\([^)]*\)/g, '') || 'Alex Mercer'
                      toast.success(`Group Session Confirmed with ${hostName}!`, {
                        description: `Joined ${groupSplitModalSlot.slot.subject} on ${groupSplitModalSlot.day.fullDateStr} at ${groupSplitModalSlot.slot.time}. Your split fee: $${modalSplitFee}.`
                      })
                      const newGroupProfileSession: ProfileSessionItem = {
                        id: `sess-${Date.now()}`,
                        tutorName: tutor.name,
                        studentName: 'Alex Mercer',
                        subject: groupSplitModalSlot.slot.subject,
                        topic: groupSplitModalSlot.slot.topic,
                        dateStr: groupSplitModalSlot.day.fullDateStr,
                        timeStr: groupSplitModalSlot.slot.time,
                        duration: modalDuration,
                        fee: modalSplitFee,
                        isGroupSplit: true,
                        status: 'Upcoming'
                      }
                      const storedSessions = getStoredProfileSessions()
                      saveStoredProfileSessions([newGroupProfileSession, ...storedSessions])
                      const joinKey = `${groupSplitModalSlot.day.date}-${groupSplitModalSlot.slot.time}`
                      setJoinedSlotKeys(prev => new Set(prev).add(joinKey))
                      setBookingRefreshKey(prev => prev + 1)
                      setGroupSplitModalSlot(null)
                    }}
                    className={`flex-2 py-3 rounded-full text-xs font-bold transition-colors shadow-sm select-none ${
                      isModalGroupFull
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    }`}
                  >
                    {isModalGroupFull ? `Group Full (${modalCurrMem}/${modalMaxMem})` : `Confirm & Join (Pay $${modalSplitFee})`}
                  </button>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
