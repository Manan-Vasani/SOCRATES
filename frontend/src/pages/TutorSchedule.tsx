import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Star, 
  Video, 
  BookOpen, 
  Lock,
  User,
  Info,
  Sparkles
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'

// Mock Tutor Dataset (fallback for route lookup)
const MOCK_TUTORS = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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
    id: '5',
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
    id: '6',
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
  'Sarah Jenkins (CS Scholar)',
  'Alex Rivera (Math Major)',
  'Elena Rostova (PhD Candidate)',
  'Michael Chang (Engineering)',
  'David Miller (Pre-Med)',
  'Sophia Chen (Data Science)'
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

  // Find Tutor
  const tutor = useMemo(() => {
    return MOCK_TUTORS.find(t => t.id === tutorId) || MOCK_TUTORS[0]
  }, [tutorId])

  // Current Month State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)) // July 2026
  const [hoveredDay, setHoveredDay] = useState<DaySchedule | null>(null)
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingTopic, setBookingTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        label = 'Past Date (Closed)'
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

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDay || !selectedSlot) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(`Session Booked with ${tutor.name}!`, {
        description: `${selectedDay.fullDateStr} at ${selectedSlot.time} (${selectedSlot.subject})`
      })
      setSelectedDay(null)
      setSelectedSlot(null)
      setBookingTopic('')
    }, 800)
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
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
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
          {/* Month Header Controls */}
          <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-[#0066cc]" />
              <h2 className="text-lg sm:text-xl font-semibold text-[#1d1d1f] tracking-tight">{monthYearHeader} Schedule</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-[#e5e5e7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
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
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-[#fafafc]/50" />
              }

              // Color styles based on status
              const statusStyles = {
                green: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/80 hover:border-emerald-300 cursor-pointer',
                yellow: 'bg-amber-50/70 border-amber-200/80 text-amber-950 hover:bg-amber-100/80 hover:border-amber-300 cursor-pointer',
                red: 'bg-rose-50/50 border-rose-200/50 text-rose-400 cursor-not-allowed opacity-75',
                past: 'bg-[#f0f0f2]/70 border-[#e0e0e3] text-[#a1a1a6] opacity-45 cursor-not-allowed filter grayscale'
              }

              const badgeStyles = {
                green: 'bg-emerald-500',
                yellow: 'bg-amber-500',
                red: 'bg-rose-500',
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
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-full h-20 sm:h-24 rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between transition-all text-left select-none ${statusStyles[day.status]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold">{day.date}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${badgeStyles[day.status]}`} />
                    </div>

                    <div className="text-[10px] sm:text-xs font-medium truncate opacity-90">
                      {day.isPast && 'Past Date'}
                      {!day.isPast && day.status === 'green' && `${day.slots.length} slots`}
                      {!day.isPast && day.status === 'yellow' && `${day.slots.filter(s => !s.isBooked).length} left`}
                      {!day.isPast && day.status === 'red' && 'Booked'}
                    </div>
                  </button>

                  {/* SIDE HOVER TOOLTIP (Right/Left Positioned) */}
                  {hoveredDay?.date === day.date && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${
                      day.dayOfWeek >= 5 ? 'right-full mr-3' : 'left-full ml-3'
                    } w-64 p-3.5 bg-white text-[#1d1d1f] text-xs rounded-2xl shadow-2xl z-50 pointer-events-none space-y-2 border border-[#e5e5e7] animate-in fade-in duration-150`}>
                      <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-2">
                        <span className="font-semibold text-[#1d1d1f] text-xs">{day.fullDateStr}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          day.isPast ? 'bg-gray-100 text-gray-600 border-gray-200' :
                          day.status === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          day.status === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {day.isPast ? 'Past Date' : day.status === 'green' ? 'Available' : day.status === 'yellow' ? 'Limited' : 'Fully Booked'}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-0.5">
                        <p className="text-[10px] text-[#7a7a7a] font-semibold uppercase tracking-wider">
                          Time Slots & Reservations:
                        </p>
                        {day.slots.map((slot, sIdx) => (
                          <div 
                            key={sIdx} 
                            className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                              slot.isBooked 
                                ? 'bg-rose-50/50 border-rose-200/70 text-rose-950' 
                                : 'bg-[#fafafc] border-[#e8e8ed] text-[#1d1d1f]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-mono font-semibold text-[10px]">
                                <Clock size={10} className={slot.isBooked ? 'text-rose-500' : 'text-[#0066cc]'} />
                                {slot.time}
                              </span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                slot.isBooked ? 'bg-rose-100/80 text-rose-700' : 'bg-emerald-100/70 text-emerald-700'
                              }`}>
                                {slot.isBooked ? 'Reserved' : 'Open'}
                              </span>
                            </div>

                            {slot.isBooked ? (
                              <div className="flex items-center gap-1.5 text-[10px] text-rose-800 font-medium truncate pt-0.5">
                                <Lock size={10} className="text-rose-500 shrink-0" />
                                <span className="truncate">Booked by <strong className="font-semibold text-rose-950">{slot.bookedBy}</strong></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] text-[#0066cc] font-medium truncate pt-0.5">
                                <BookOpen size={10} className="text-[#0066cc] shrink-0" />
                                <span className="truncate">Subject: <strong className="font-semibold">{slot.subject}</strong></span>
                              </div>
                            )}
                          </div>
                        ))}
                        {day.status !== 'red' && (
                          <p className="text-[10px] text-[#0066cc] pt-1 font-semibold text-center">Click date cell to select slot</p>
                        )}
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

      {/* SLOT BOOKING MODAL */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-6 shadow-2xl relative text-[#1d1d1f]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon size={18} className="text-[#0066cc]" />
                  <div>
                    <h3 className="text-base font-semibold text-[#1d1d1f]">
                      Book Session with {tutor.name}
                    </h3>
                    <p className="text-xs text-[#7a7a7a]">{selectedDay.fullDateStr}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 rounded-full text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                >
                  <ArrowLeft size={16} />
                </button>
              </div>

              {/* Slot Selection Form */}
              <form onSubmit={handleConfirmBooking} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-2">
                    Select Available Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedDay.slots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-2xl border text-xs font-medium text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                          slot.isBooked
                            ? 'bg-[#f5f5f7] border-[#e0e0e0] text-[#a1a1a6] cursor-not-allowed opacity-60'
                            : selectedSlot?.time === slot.time
                            ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-xs'
                            : 'bg-white border-[#e5e5e7] text-[#1d1d1f] hover:border-[#0066cc]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-semibold">
                          <span>{slot.time}</span>
                          {selectedSlot?.time === slot.time && <CheckCircle2 size={13} />}
                        </div>
                        <span className={`text-[10px] ${selectedSlot?.time === slot.time ? 'text-white/80' : 'text-[#7a7a7a]'}`}>
                          {slot.subject}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-2">
                    Learning Topic / Questions (Optional)
                  </label>
                  <textarea
                    value={bookingTopic}
                    onChange={(e) => setBookingTopic(e.target.value)}
                    placeholder="e.g. Graph Traversal algorithms, BFS vs DFS prep..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#f0f0f2]">
                  <div>
                    <span className="text-xs text-[#7a7a7a]">Total Fee: </span>
                    <span className="text-lg font-bold text-[#1d1d1f]">${tutor.hourlyRate}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#525252] hover:bg-[#f5f5f7]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedSlot}
                      className="px-5 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
