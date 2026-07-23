import { AnimatePresence, motion, Variants } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  ShieldCheck,
  Star,
  X
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import { createTutorBookingApi, fetchTutorBookingsApi, fetchTutorDetailsApi } from '../services/api'

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
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#e5e5e7] shrink-0" />
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

interface TimeSlot {
  time: string
  subject: string
  isBooked: boolean
  bookedBy?: string
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

export default function TutorSchedule() {
  const { tutorId } = useParams<{ tutorId: string }>()
  const navigate = useNavigate()

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
  const [bookingTopic, setBookingTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const hoverTimeoutRef = React.useRef<any>(null)

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

      slotTimes.forEach((time, idx) => {
        const isSlotBooked = status === 'red' || (status === 'yellow' && idx === 1)
        slots.push({
          time,
          subject: availableSubjects[idx % availableSubjects.length],
          isBooked: isSlotBooked,
          bookedBy: isSlotBooked ? MOCK_STUDENT_NAMES[(dayNum + idx) % MOCK_STUDENT_NAMES.length] : undefined
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

    setIsSubmitting(true)
    const calculatedFee = Math.round((tutor.hourlyRate * selectedDuration) / 60)

    const res = await createTutorBookingApi(tutor.id, {
      studentName: 'Alex Mercer',
      date: selectedDay.fullDateStr,
      time: selectedSlot.time,
      subject: selectedSlot.subject,
      duration: selectedDuration,
      topic: bookingTopic,
      fee: calculatedFee
    })

    setIsSubmitting(false)
    if (res?.success) {
      toast.success(`Session Booked with ${tutor.name}!`, {
        description: `${selectedDay.fullDateStr} at ${selectedSlot.time} (${selectedDuration} min • $${calculatedFee} • ${selectedSlot.subject})`
      })
      setBackendBookings(prev => [...prev, {
        tutorId: tutor.id,
        studentName: 'Alex Mercer',
        date: selectedDay.fullDateStr,
        time: selectedSlot.time,
        subject: selectedSlot.subject,
        duration: selectedDuration,
        fee: calculatedFee
      }])
    } else {
      toast.success(`Session Booked with ${tutor.name}!`, {
        description: `${selectedDay.fullDateStr} at ${selectedSlot.time} (${selectedDuration} min • $${calculatedFee})`
      })
    }

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
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/10 selection:text-[#0066cc] pb-24">
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
          className="bg-white rounded-3xl border border-[#e5e5e7] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5">
            <img 
              src={tutor.image} 
              alt={tutor.name} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#e0e0e0] shadow-xs"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">{tutor.name}</h1>
                <span title="Verified Educator" className="inline-flex items-center">
                  <ShieldCheck size={18} className="text-[#0066cc]" />
                </span>
              </div>
              <p className="text-xs text-[#7a7a7a] font-medium">{tutor.experience}</p>
              <div className="flex items-center gap-3 text-xs pt-1">
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star size={13} className="text-amber-500" />
                  {tutor.rating} ({tutor.reviews} reviews)
                </span>
                <span className="text-[#e0e0e0]">•</span>
                <span className="text-[#0066cc] font-semibold">${tutor.hourlyRate}/hr</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tutor.subjects.map(sub => (
              <span 
                key={sub} 
                className="px-3 py-1 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs text-[#1d1d1f] font-medium"
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

              return (
                <div key={day.date} className="relative group">
                  <button
                    disabled={day.isPast || day.status === 'red'}
                    onClick={() => {
                      if (!day.isPast && day.status !== 'red') {
                        setSelectedDay(day)
                        setSelectedSlot(day.slots.find(s => !s.isBooked) || day.slots[0] || null)
                      }
                    }}
                    onMouseEnter={() => handleCellMouseEnter(day)}
                    onMouseLeave={handleCellMouseLeave}
                    className={`w-full h-20 sm:h-24 rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between transition-all text-left select-none ${statusStyles[day.status]}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-bold">{day.date}</span>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badgeStyles[day.status]}`} />
                    </div>

                    <div className="text-[10px] sm:text-xs font-semibold truncate opacity-90">
                      {day.isPast && 'Passed'}
                      {!day.isPast && day.status === 'green' && `${day.slots.length} slots`}
                      {!day.isPast && day.status === 'yellow' && `${day.slots.filter(s => !s.isBooked).length} left`}
                      {!day.isPast && day.status === 'red' && 'Booked'}
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
                            day.status === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            day.status === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {day.isPast ? 'Passed' : day.status === 'green' ? 'Available' : day.status === 'yellow' ? 'Limited' : 'Fully Booked'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                              setHoveredDay(null)
                            }}
                            className="p-1.5 rounded-full text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] active:bg-[#e8e8ed] transition-colors duration-150 cursor-pointer select-none shrink-0 transform-gpu"
                            title="Close details"
                            aria-label="Close popover"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] text-[#7a7a7a] font-semibold uppercase tracking-wider">
                          Time Slots & Reservations:
                        </p>
                        {day.slots.map((slot, sIdx) => (
                          <div 
                            key={sIdx} 
                            className={`p-2.5 rounded-xl border text-[11px] space-y-1 min-h-[46px] flex flex-col justify-center ${
                              slot.isBooked 
                                ? 'bg-red-50/60 border-red-200/80 text-red-950' 
                                : 'bg-[#fafafc] border-[#e8e8ed] text-[#1d1d1f]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-sans font-bold text-xs tracking-tight">
                                <Clock size={11} className={slot.isBooked ? 'text-red-600' : 'text-[#0066cc]'} />
                                {slot.time}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                slot.isBooked ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100/70 text-emerald-700'
                              }`}>
                                {slot.isBooked ? 'Reserved' : 'Open'}
                              </span>
                            </div>

                            {slot.isBooked ? (
                              <div 
                                title={slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}
                                className="flex items-center gap-1.5 text-[10px] text-red-900 font-medium truncate pt-0.5 cursor-help"
                              >
                                <Lock size={10} className="text-red-600 shrink-0" />
                                <span className="truncate">Booked by <strong className="font-semibold text-red-950">{slot.bookedBy?.replace(/\s*\([^)]*\)/g, '')}</strong></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] text-[#525252] font-medium truncate pt-0.5">
                                <BookOpen size={10} className="text-[#6e6e73] shrink-0" />
                                <span className="truncate">Subject: <strong className="font-semibold text-[#1d1d1f]">{slot.subject}</strong></span>
                              </div>
                            )}
                          </div>
                        ))}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-6 shadow-2xl relative text-[#1d1d1f] transform-gpu select-none"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#e5e5e7] pb-4">
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
              <form onSubmit={handleConfirmBooking} className="space-y-5">
                {/* Session Duration Selector (20 Min, 30 Min, 60 Min) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                      <Clock size={13} className="text-[#0066cc]" />
                      <span>Select Session Duration</span>
                    </label>
                    <span className="text-[11px] font-semibold text-[#6e6e73]">
                      Pro-rated pricing
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { minutes: 20, label: '20 Min', desc: 'Quick Doubt', factor: 20 / 60 },
                      { minutes: 30, label: '30 Min', desc: 'Concept Review', factor: 30 / 60 },
                      { minutes: 60, label: '60 Min', desc: 'Full Session', factor: 1.0 },
                    ].map((dur) => {
                      const isSelected = selectedDuration === dur.minutes
                      const calculatedFee = Math.round(tutor.hourlyRate * dur.factor)

                      return (
                        <button
                          key={dur.minutes}
                          type="button"
                          onClick={() => setSelectedDuration(dur.minutes as 20 | 30 | 60)}
                          className={`p-2.5 rounded-2xl border text-center transition-colors duration-150 cursor-pointer select-none transform-gpu flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? 'bg-[#0066cc]/10 border-[#0066cc] text-[#0066cc] ring-1 ring-[#0066cc]'
                              : 'bg-[#fafafc] border-[#e5e5e7] text-[#525252] hover:bg-[#f5f5f7]'
                          }`}
                        >
                          <span className="text-xs font-bold">{dur.label}</span>
                          <span className="text-[10px] font-medium text-[#7a7a7a]">{dur.desc}</span>
                          <span className="text-[11px] font-extrabold text-[#1d1d1f] pt-0.5">${calculatedFee}</span>
                        </button>
                      )
                    })}
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
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={slot.isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3.5 rounded-2xl border text-xs font-medium text-left flex items-center justify-between gap-3 transition-colors duration-150 cursor-pointer select-none transform-gpu ${
                            slot.isBooked
                              ? 'bg-[#f5f5f7] border-[#e0e0e0] text-[#a1a1a6] cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-xs'
                              : 'bg-white border-[#e5e5e7] text-[#1d1d1f] hover:border-[#0066cc] hover:bg-[#0066cc]/5'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="font-sans font-bold text-xs tracking-tight">
                              {slot.time}
                            </div>
                            <div className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white/95' : 'text-[#3a3a3c]'}`}>
                              {slot.subject}
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
                    <span className="text-[10px] text-[#7a7a7a] font-medium">
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

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f0f0f2]">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium text-[#6e6e73]">Total Fee:</span>
                      <span className="text-xl font-bold text-[#1d1d1f]">
                        ${Math.round((tutor.hourlyRate * selectedDuration) / 60)}
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
    </div>
  )
}
