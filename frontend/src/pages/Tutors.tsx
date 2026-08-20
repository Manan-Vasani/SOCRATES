import { motion, Variants } from 'framer-motion'
import {
  Atom,
  Award,
  BarChart2,
  BookOpen,
  Bookmark,
  Calendar,
  Code2,
  Crown,
  Cpu,
  Database,
  DollarSign,
  FlaskConical,
  Globe,
  Layers,
  Network,
  Percent,
  RotateCcw,
  Search,
  ShieldCheck,
  Sigma,
  Sparkles,
  Star,
  Tag,
  Terminal,
  TrendingDown,
  UserX,
  Video,
  X
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchAllTutors, TutorItem } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getUnifiedSubjectList } from '../utils/subjectRegistry'
import { getInitialsAvatar } from '../services/authService'

export interface ExtendedTutor extends Omit<TutorItem, 'reviews'> {
  id: string
  bio: string
  subjects: string[]
  hourlyRate: number
  isOnline: boolean
  isVerified: boolean
  institution: string
  totalStudents: number
  reviews: number | string
  aiMatchScore?: number
}

const INITIAL_TOP_TUTORS: ExtendedTutor[] = [
  {
    id: 'tut_101',
    name: 'Dr. Evelyn Reed',
    subject: 'Algorithms & Data Structures',
    experience: '8+ yrs exp • Stanford PhD',
    rating: 4.98,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 65,
    bio: 'Specialized in Graph Theory, Dynamic Programming, and High-Performance Algorithm Design for CS majors and competitive coders.',
    subjects: ['Algorithms', 'Data Structures', 'Python', 'C++'],
    isOnline: true,
    isVerified: true,
    institution: 'Stanford University',
    totalStudents: 142,
  },
  {
    id: 'tut_102',
    name: 'Marcus Chen',
    subject: 'Linear Algebra & AI Foundations',
    experience: '6+ yrs exp • MIT Alum',
    rating: 4.95,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 55,
    bio: 'Passionate about demystifying Matrix Decompositions, Vector Calculus, Neural Networks, and PyTorch deep learning frameworks.',
    subjects: ['Linear Algebra', 'PyTorch', 'Machine Learning', 'Python'],
    isOnline: true,
    isVerified: true,
    institution: 'MIT',
    totalStudents: 98,
  },
  {
    id: 'tut_103',
    name: 'Sophia Williams',
    subject: 'Quantum Mechanics & Physics',
    experience: '10+ yrs exp • Cambridge Postdoc',
    rating: 5.0,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 70,
    bio: 'Theoretical Physicist helping university students master Quantum Computing, Electromagnetism, and Classical Mechanics.',
    subjects: ['Quantum Physics', 'Calculus', 'Thermodynamics'],
    isOnline: false,
    isVerified: true,
    institution: 'Cambridge University',
    totalStudents: 210,
  },
  {
    id: 'tut_104',
    name: 'Alexandre Dubois',
    subject: 'Full-Stack React & Node Systems',
    experience: '7+ yrs exp • Senior Staff Engineer',
    rating: 4.92,
    reviews: 76,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 60,
    bio: 'Building real-world scalable web applications, TypeScript architecture, State Management, and MongoDB cloud databases.',
    subjects: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    isOnline: true,
    isVerified: true,
    institution: 'École Polytechnique',
    totalStudents: 76,
  },
  {
    id: 'tut_105',
    name: 'Priya Sharma',
    subject: 'Statistics & Data Science',
    experience: '5+ yrs exp • UC Berkeley MS',
    rating: 4.97,
    reviews: 115,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 50,
    bio: 'Expert in Applied Probability, Hypothesis Testing, R, Pandas, Data Visualization, and Econometrics.',
    subjects: ['Statistics', 'Data Science', 'Python', 'R'],
    isOnline: false,
    isVerified: true,
    institution: 'UC Berkeley',
    totalStudents: 115,
  },
  {
    id: 'tut_106',
    name: 'David Vance',
    subject: 'Organic Chemistry & Biochemistry',
    experience: '9+ yrs exp • Johns Hopkins MD',
    rating: 4.99,
    reviews: 184,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 65,
    bio: 'Helping pre-med and chemistry scholars conquer Reaction Mechanisms, Synthesis, and Spectroscopy.',
    subjects: ['Organic Chemistry', 'Biochemistry', 'MCAT Prep'],
    isOnline: true,
    isVerified: true,
    institution: 'Johns Hopkins',
    totalStudents: 184,
  },
]

function TutorCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 space-y-5 flex flex-col justify-between shadow-xs animate-pulse">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#e5e5e7]/60 shrink-0 border border-[#e0e0e0]" />
          <div className="space-y-1.5 flex-1 pt-0.5">
            <div className="h-5 bg-[#e5e5e7]/80 rounded-md w-3/4" />
            <div className="h-3.5 bg-[#e5e5e7]/50 rounded-md w-1/2" />
            <div className="h-3.5 bg-[#e5e5e7]/40 rounded-md w-1/3" />
          </div>
        </div>

        {/* Primary Domain */}
        <div className="h-[42px] bg-[#f5f5f7] border border-[#e5e5e7] rounded-xl w-full" />

        {/* Bio Statement */}
        <div className="space-y-2 pt-1">
          <div className="h-3.5 bg-[#e5e5e7]/60 rounded-md w-full" />
          <div className="h-3.5 bg-[#e5e5e7]/50 rounded-md w-11/12" />
          <div className="h-3.5 bg-[#e5e5e7]/40 rounded-md w-3/4" />
        </div>

        {/* Subject Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <div className="h-7 bg-[#f5f5f7] border border-[#e0e0e0] rounded-lg w-20" />
          <div className="h-7 bg-[#f5f5f7] border border-[#e0e0e0] rounded-lg w-24" />
          <div className="h-7 bg-[#f5f5f7] border border-[#e0e0e0] rounded-lg w-16" />
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 border-t border-[#f0f0f2] flex items-center justify-between gap-3 mt-4">
        <div className="h-6 bg-[#e5e5e7]/70 rounded-md w-16" />
        <div className="h-8 bg-[#0066cc]/20 rounded-xl w-36" />
      </div>
    </div>
  )
}

export default function Tutors() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tutorsList, setTutorsList] = useState<ExtendedTutor[]>(INITIAL_TOP_TUTORS)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [minRating, setMinRating] = useState(0)
  const [maxPrice, setMaxPrice] = useState(300)
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState<ExtendedTutor | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('14:00')
  const [bookingTopic, setBookingTopic] = useState('')
  const [selectedDuration, setSelectedDuration] = useState<20 | 30 | 60>(60)
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({})

  const [bookmarkedTutors, setBookmarkedTutors] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('socrates_bookmarks')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const toggleBookmark = (tutor: ExtendedTutor, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const isBookmarked = bookmarkedTutors.some((t) => t.id === tutor.id)
    let nextList: any[]
    if (isBookmarked) {
      nextList = bookmarkedTutors.filter((t) => t.id !== tutor.id)
      toast.success(`${tutor.name} removed from bookmarks`)
    } else {
      const newBookmark = {
        id: tutor.id,
        name: tutor.name,
        subject: tutor.subject,
        rating: tutor.rating,
        hourlyRate: tutor.hourlyRate,
        avatar: tutor.image,
        online: tutor.isOnline || false,
      }
      nextList = [...bookmarkedTutors, newBookmark]
      toast.success(`${tutor.name} added to bookmarks!`)
    }
    setBookmarkedTutors(nextList)
    localStorage.setItem('socrates_bookmarks', JSON.stringify(nextList))
  }

  const toggleExpandCard = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  useEffect(() => {
    let isMounted = true
    async function loadBackendTutors() {
      setIsLoading(true)
      try {
        const data = await fetchAllTutors()
        if (data && data.length > 0 && isMounted) {
          // Merge backend data with default rich profiles
          const merged = data.map((t, idx) => ({
            id: t._id || t.id || 'fetched_' + idx,
            name: t.name,
            subject: t.subject,
            experience: t.experience,
            rating: typeof t.rating === 'number' ? t.rating : parseFloat(t.rating) || 4.9,
            reviews: t.reviews,
            image: t.image,
            hourlyRate: (t as any).hourlyRate || 55,
            bio: (t as any).bio || `${t.experience} specializing in ${t.subject}.`,
            subjects: (t as any).subjects && (t as any).subjects.length > 0 ? (t as any).subjects : [t.subject.split(' ')[0], 'Computer Science', 'Tutorials'],
            isOnline: idx % 2 === 0,
            isVerified: true,
            institution: 'Top Academic Institution',
            totalStudents: 85 + idx * 12,
          }))
          // Ensure no duplicates
          setTutorsList((prev) => {
            const combined = [...prev]
            merged.forEach((m) => {
              if (!combined.some((c) => c.name === m.name)) {
                combined.push(m)
              }
            })
            return combined
          })
        }
      } finally {
        if (isMounted) {
          setTimeout(() => setIsLoading(false), 200)
        }
      }
    }
    loadBackendTutors()
    return () => { isMounted = false }
  }, [])

  // Default academic subjects combined with user-added tutor subjects
  const DEFAULT_SUBJECTS = useMemo(
    () => [
      'All',
      'Algorithms',
      'Data Structures',
      'Linear Algebra',
      'Machine Learning',
      'PyTorch',
      'Python',
      'React',
      'TypeScript',
      'Node.js',
      'Quantum Physics',
      'Statistics',
      'Organic Chemistry',
      'Calculus',
      'C++',
      'Database Systems',
      'Computer Networks',
      'Web Development',
      'Artificial Intelligence',
      'Cyber Security',
    ],
    []
  )

  // Combined set of default subjects + tutor subjects + student enrolled subjects
  const allSubjects = useMemo(() => {
    return getUnifiedSubjectList(tutorsList, user, true)
  }, [tutorsList, user])

  // Filtered tutors based on search and dropdown filters
  const filteredTutors = useMemo(() => {
    return tutorsList.filter((tutor) => {
      const matchesSearch =
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesSubject =
        selectedSubject === 'All' || tutor.subjects.includes(selectedSubject) || tutor.subject.includes(selectedSubject)

      const matchesRating = Number(tutor.rating) >= minRating
      const matchesPrice = tutor.hourlyRate <= maxPrice

      return matchesSearch && matchesSubject && matchesRating && matchesPrice
    })
  }, [tutorsList, searchQuery, selectedSubject, minRating, maxPrice])

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault()
    setIsBookingSubmitting(true)
    setTimeout(() => {
      setIsBookingSubmitting(false)
      toast.success(
        `Session booked cleanly with ${selectedTutorForBooking?.name}! A calendar invite has been sent to your email.`
      )
      setSelectedTutorForBooking(null)
    }, 600)
  }

  const ratingOptions: DropdownOption<number>[] = [
    { value: 0, label: 'Any Rating', icon: <Star size={13} className="text-amber-500 fill-amber-500" /> },
    { value: 4.5, label: '4.5+ Rating', icon: <Award size={13} className="text-amber-500" /> },
    { value: 4.8, label: '4.8+ Rating', icon: <Sparkles size={13} className="text-amber-500" /> },
    { value: 4.9, label: '4.9+ Rating', icon: <Crown size={13} className="text-amber-500" /> },
  ]

  const priceOptions: DropdownOption<number>[] = [
    { value: 300, label: 'Under $300/hr', icon: <DollarSign size={13} className="text-emerald-600" /> },
    { value: 100, label: 'Under $100/hr', icon: <DollarSign size={13} className="text-emerald-600" /> },
    { value: 70, label: 'Under $70/hr', icon: <Tag size={13} className="text-emerald-600" /> },
    { value: 55, label: 'Under $55/hr', icon: <Percent size={13} className="text-emerald-600" /> },
  ]

  function getSubjectIcon(sub: string) {
    const lower = sub.toLowerCase()
    if (lower === 'all') return <Layers size={13} className="text-[#0066cc]" />
    if (lower.includes('python')) return <Terminal size={13} className="text-[#0066cc]" />
    if (
      lower.includes('algebra') ||
      lower.includes('math') ||
      lower.includes('calculus') ||
      lower.includes('geometry') ||
      lower.includes('trigonometry') ||
      lower.includes('discrete')
    ) {
      return <Sigma size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('machine') ||
      lower.includes('ai') ||
      lower.includes('torch') ||
      lower.includes('artificial intelligence') ||
      lower.includes('neural') ||
      lower.includes('deep learning') ||
      lower.includes('nlp')
    ) {
      return <Sparkles size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('structure') ||
      lower.includes('algorithm') ||
      lower.includes('data structure') ||
      lower.includes('sorting') ||
      lower.includes('tree') ||
      lower.includes('graph')
    ) {
      return <Network size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('database') ||
      lower.includes('sql') ||
      lower.includes('mongo') ||
      lower.includes('postgres')
    ) {
      return <Database size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('c++') ||
      lower.includes('code') ||
      lower.includes('system') ||
      lower.includes('java') ||
      lower.includes('c#') ||
      lower.includes('rust') ||
      lower.includes('golang') ||
      lower.includes('compiler') ||
      lower.includes('os')
    ) {
      return <Code2 size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('react') ||
      lower.includes('typescript') ||
      lower.includes('javascript') ||
      lower.includes('node') ||
      lower.includes('frontend') ||
      lower.includes('backend') ||
      lower.includes('fullstack') ||
      lower.includes('full-stack') ||
      lower.includes('next.js') ||
      lower.includes('vue')
    ) {
      return <Atom size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('web') ||
      lower.includes('network') ||
      lower.includes('cloud') ||
      lower.includes('internet') ||
      lower.includes('devops')
    ) {
      return <Globe size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('physics') ||
      lower.includes('quantum') ||
      lower.includes('thermo') ||
      lower.includes('mechanics') ||
      lower.includes('optics') ||
      lower.includes('electromagnetism') ||
      lower.includes('engineering') ||
      lower.includes('hardware')
    ) {
      return <Cpu size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('chem') ||
      lower.includes('organic') ||
      lower.includes('inorganic') ||
      lower.includes('biochem') ||
      lower.includes('bio') ||
      lower.includes('mcat')
    ) {
      return <FlaskConical size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('security') ||
      lower.includes('cyber') ||
      lower.includes('crypto') ||
      lower.includes('ethical') ||
      lower.includes('infosec')
    ) {
      return <ShieldCheck size={13} className="text-[#0066cc]" />
    }
    if (
      lower.includes('stat') ||
      lower.includes('probability') ||
      lower.includes('analytics') ||
      lower.includes('data science') ||
      lower.includes(' r') ||
      lower === 'r'
    ) {
      return <BarChart2 size={13} className="text-[#0066cc]" />
    }
    return <BookOpen size={13} className="text-[#0066cc]" />
  }


  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="w-full bg-[#fafafc] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/10 selection:text-[#0066cc] pb-16">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,102,204,0.035)_0%,_transparent_60%)] pointer-events-none z-0" />

      {/* Hero Header Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-10 text-center flex flex-col items-center w-full"
      >
        <h1 className="mt-2 mb-4 text-4xl sm:text-6xl md:text-[68px] font-semibold tracking-tight leading-[1.08] text-[#1d1d1f]">
          <span>Find your mentor.</span>
          <br className="hidden sm:inline" />
          <span className="block mt-1 sm:mt-2 text-[#0066cc]">
            Top Rated Tutors & Peer Mentors.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#7a7a7a] font-normal leading-relaxed">
          Connect 1-on-1 with verified academic scholars, PhD researchers, and peer educators for live Socratic tutoring and code reviews.
        </p>
      </motion.section>

      {/* Unified Search & Tutor Grid Motion Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Search & Filter Control Bar */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 mb-10">
          <motion.div variants={cardVariants} className="p-4 rounded-3xl bg-white border border-[#e5e5e7] shadow-sm space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a7a] w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tutor name, subject (e.g. Algorithms, Linear Algebra, PyTorch)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#7a7a7a] hover:text-[#1d1d1f]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Secondary Filters Grid */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs pt-3 border-t border-[#f0f0f2]">
              {/* Combined Subject Chips Displayed in Exactly 3 Rows Surface with Visible Slider */}
              <div className="flex flex-wrap items-center content-start gap-1.5 max-w-full flex-1 max-h-[105px] overflow-y-auto subject-slider pr-2 py-0.5">
                {allSubjects.map((sub) => {
                  const isActive = selectedSubject === sub
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer whitespace-nowrap select-none border inline-flex items-center gap-1.5 transform-gpu ${
                        isActive
                          ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-xs'
                          : 'bg-[#f5f5f7] border-[#e5e5e7] text-[#525252] hover:border-[#0066cc]/40 hover:text-[#0066cc]'
                      }`}
                    >
                      {React.cloneElement(getSubjectIcon(sub) as React.ReactElement<any>, {
                        size: 13,
                        className: isActive ? 'text-white shrink-0' : 'text-[#0066cc] shrink-0',
                      })}
                      <span>{sub}</span>
                    </button>
                  )
                })}
              </div>

              {/* Price & Rating Selectors */}
              <div className="flex items-center gap-3">
                <CustomDropdown<number>
                  options={ratingOptions}
                  value={minRating}
                  onChange={(val: number) => setMinRating(val)}
                  buttonClassName="py-1.5 w-[134px] sm:w-[138px] justify-between"
                  align="center"
                />

                <CustomDropdown<number>
                  options={priceOptions}
                  value={maxPrice}
                  onChange={(val: number) => setMaxPrice(val)}
                  buttonClassName="py-1.5 w-[144px] sm:w-[148px] justify-between"
                  align="center"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Tutors Grid Section */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 pb-12">
          <div className="flex items-center justify-between mb-6 px-1 sm:px-2">
            <div className="flex items-center gap-2.5 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] tracking-tight">
                  Verified Educators
                </h2>
              </div>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20 font-extrabold text-xs">
                {filteredTutors.length} Available
              </span>
            </div>

            <div className="flex items-center shrink-0">
              {(selectedSubject !== 'All' || searchQuery || minRating > 0 || maxPrice < 300) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('All')
                    setSearchQuery('')
                    setMinRating(0)
                    setMaxPrice(300)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e5e5e7] hover:border-[#0066cc]/40 text-xs font-semibold text-[#525252] hover:text-[#0066cc] transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer select-none shrink-0 transform-gpu leading-none"
                >
                  <RotateCcw size={12} className="text-[#0066cc]" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          <div className="w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <TutorCardSkeleton key={n} />
                ))}
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#e5e5e7] space-y-3">
                <UserX size={36} className="mx-auto text-[#7a7a7a]" />
                <h3 className="text-lg font-display font-semibold text-[#1d1d1f]">No tutors matched your criteria</h3>
                <p className="text-xs text-[#7a7a7a]">Try adjusting your search query or subject filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="relative bg-white rounded-3xl border border-[#e5e5e7] p-6 flex flex-col justify-between shadow-xs hover:border-[#0066cc]/40 hover:shadow-sm transition-colors duration-150 group transform-gpu select-none"
                >
                  {user?.role === 'student' && (
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(tutor, e)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white border border-[#e5e5e7] hover:border-[#0066cc]/30 text-[#86868b] hover:text-[#0066cc] transition-colors shadow-xs transform-gpu select-none cursor-pointer z-10"
                      title={bookmarkedTutors.some((t) => t.id === tutor.id) ? "Remove Bookmark" : "Bookmark Tutor"}
                    >
                      <Bookmark
                        size={15}
                        className={bookmarkedTutors.some((t) => t.id === tutor.id) ? "text-[#0066cc] fill-[#0066cc]" : ""}
                      />
                    </button>
                  )}
                  <div className="space-y-4">
                    {/* Top Card Header */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={tutor.image || getInitialsAvatar(tutor.name)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getInitialsAvatar(tutor.name)
                          }}
                          alt={tutor.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-[#0066cc]/25 border-2 border-white shadow-md shrink-0 transform-gpu antialiased"
                        />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="text-base font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors truncate tracking-tight select-none">
                            {tutor.name}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {tutor.aiMatchScore && tutor.aiMatchScore >= 75 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-bold border border-[#0066cc]/20 select-none">
                                {tutor.aiMatchScore}% Match
                              </span>
                            )}
                            {tutor.isVerified && (
                              <span title="Verified Educator" className="inline-flex items-center shrink-0 select-none">
                                <ShieldCheck size={18} className="text-[#0066cc]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[13px] text-[#6e6e73] font-medium truncate leading-snug select-none">
                          {tutor.experience}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5 select-none">
                          <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/25 px-2 py-0.5 rounded-lg text-xs font-semibold">
                            <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                            <span>{tutor.rating}</span>
                          </div>
                          <span className="text-xs text-[#6e6e73] font-normal">
                            ({typeof tutor.reviews === 'number' ? tutor.reviews : String(tutor.reviews).replace(/reviews/gi, '').trim()} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Domain Tag */}
                    <div className="p-3 rounded-xl bg-[#0066cc]/5 border border-[#0066cc]/15 text-xs font-semibold text-[#0066cc] flex items-center gap-2 select-none">
                      {React.cloneElement(getSubjectIcon(tutor.subject) as React.ReactElement<any>, {
                        size: 14,
                        className: 'text-[#0066cc] shrink-0',
                      })}
                      <span className="truncate">{tutor.subject}</span>
                    </div>

                    {/* Bio Statement */}
                    <p className="text-xs text-[#525252] leading-relaxed line-clamp-3 font-normal select-none">
                      {tutor.bio}
                    </p>

                    {/* Subject Badges (Expandable Pill Chips) */}
                    {(() => {
                      const isExpanded = expandedCardIds[tutor.id] || false
                      const visibleSubjects = isExpanded ? tutor.subjects : tutor.subjects.slice(0, 3)
                      const hiddenCount = tutor.subjects.length - 3

                      return (
                        <div className="flex flex-wrap gap-1.5 pt-1 items-center min-h-[30px]">
                          {visibleSubjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] border border-[#e5e5e7] text-[11px] font-medium text-[#525252] select-none"
                            >
                              {sub}
                            </span>
                          ))}
                          {tutor.subjects.length > 3 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleExpandCard(tutor.id)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] hover:bg-[#e8e8ed] active:bg-[#e0e0e5] text-[#525252] border border-[#e5e5e7] text-[11px] font-medium cursor-pointer transition-colors duration-150 select-none transform-gpu"
                              title={isExpanded ? 'Collapse subjects' : 'Show all subjects'}
                            >
                              {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 border-t border-[#f0f0f2] flex items-center justify-between gap-3 mt-4">
                    <div className="flex items-baseline gap-0.5 select-none">
                      <span className="text-xl font-bold text-[#1d1d1f] tracking-tight">${tutor.hourlyRate}</span>
                      <span className="text-xs font-medium text-[#6e6e73]">/hr</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/tutors/${tutor.id}/schedule`)}
                      className="px-4 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0055b3] text-white text-xs font-semibold transition-colors duration-150 shadow-xs flex items-center gap-1.5 cursor-pointer select-none shrink-0 transform-gpu"
                    >
                      <Calendar size={13} />
                      <span>Check Availability</span>
                    </button>
                  </div>
                </div>
            ))}
          </div>
        )}
        </div>
      </section>
      </motion.div>

      {/* BOOKING MODAL */}
      {selectedTutorForBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-6 relative shadow-2xl animate-in fade-in duration-150 text-[#1d1d1f] transform-gpu select-none">
            <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTutorForBooking.image}
                  alt={selectedTutorForBooking.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#e0e0e0]"
                />
                <div>
                  <h3 className="text-base font-display font-bold text-[#1d1d1f]">
                    Book 1-on-1 with {selectedTutorForBooking.name}
                  </h3>
                  <p className="text-xs text-[#7a7a7a]">
                    {selectedTutorForBooking.subject} • ${selectedTutorForBooking.hourlyRate}/hr
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTutorForBooking(null)}
                className="p-1.5 rounded-xl text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              {/* Session Duration Selector (20 Min, 30 Min, 60 Min) */}
              <div>
                <label className="text-[#525252] font-semibold block mb-1.5">Select Session Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { minutes: 20, label: '20 Min', desc: 'Quick Doubt', factor: 20 / 60 },
                    { minutes: 30, label: '30 Min', desc: 'Concept Review', factor: 30 / 60 },
                    { minutes: 60, label: '60 Min', desc: 'Full Session', factor: 1.0 },
                  ].map((dur) => {
                    const isSelected = selectedDuration === dur.minutes
                    const calculatedFee = Math.round(selectedTutorForBooking.hourlyRate * dur.factor)

                    return (
                      <button
                        key={dur.minutes}
                        type="button"
                        onClick={() => setSelectedDuration(dur.minutes as 20 | 30 | 60)}
                        className={`p-2 rounded-xl border text-center transition-colors duration-150 cursor-pointer select-none flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'bg-[#0066cc]/10 border-[#0066cc] text-[#0066cc] ring-1 ring-[#0066cc]'
                            : 'bg-[#fafafc] border-[#e5e5e7] text-[#525252] hover:bg-[#f5f5f7]'
                        }`}
                      >
                        <span className="text-xs font-bold">{dur.label}</span>
                        <span className="text-[10px] text-[#7a7a7a]">{dur.desc}</span>
                        <span className="text-[11px] font-extrabold text-[#1d1d1f]">${calculatedFee}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#525252] font-semibold block">Select Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#525252] font-semibold block">Select Time</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#525252] font-semibold block">What topic or problem would you like to solve?</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Need help understanding Red-Black Tree rotations and time complexity."
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] resize-none min-h-[84px]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] space-y-1.5 text-xs text-[#525252]">
                <div className="flex justify-between font-medium">
                  <span>{selectedDuration} Min Live Session</span>
                  <span>${Math.round((selectedTutorForBooking.hourlyRate * selectedDuration) / 60)}.00</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Platform Escrow Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="pt-2 border-t border-[#e0e0e0] flex justify-between font-bold text-[#1d1d1f] text-sm">
                  <span>Total</span>
                  <span>${Math.round((selectedTutorForBooking.hourlyRate * selectedDuration) / 60)}.00</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e5e5e7]">
                <button
                  type="button"
                  onClick={() => setSelectedTutorForBooking(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5e7] text-[#1d1d1f] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isBookingSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white font-semibold transition-all shadow-md shadow-[#0066cc]/20 flex items-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  {isBookingSubmitting ? 'Confirming...' : 'Confirm & Reserve Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
