import { motion } from 'framer-motion'
import {
  BookOpen,
  DollarSign,
  Filter,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Video,
  X
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown'
import Navbar from '../components/Navbar'
import { fetchFeaturedTutors, TutorItem } from '../services/api'

export interface ExtendedTutor extends TutorItem {
  id: string
  bio: string
  subjects: string[]
  hourlyRate: number
  isOnline: boolean
  isVerified: boolean
  institution: string
  totalStudents: number
  aiMatchScore?: number
}

const INITIAL_TOP_TUTORS: ExtendedTutor[] = [
  {
    id: 'tut_101',
    name: 'Dr. Evelyn Reed',
    subject: 'Algorithms & Data Structures',
    experience: '8+ yrs exp • Stanford PhD',
    rating: 4.98,
    reviews: '142 reviews',
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
    reviews: '98 reviews',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
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
    reviews: '210 reviews',
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
    reviews: '76 reviews',
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
    reviews: '115 reviews',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
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
    reviews: '184 reviews',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    hourlyRate: 65,
    bio: 'Helping pre-med and chemistry scholars conquer Reaction Mechanisms, Synthesis, Spectroscopy, and Enzymology.',
    subjects: ['Organic Chemistry', 'Biochemistry', 'MCAT Prep'],
    isOnline: true,
    isVerified: true,
    institution: 'Johns Hopkins',
    totalStudents: 184,
  },
]

export default function Tutors() {
  const [tutorsList, setTutorsList] = useState<ExtendedTutor[]>(INITIAL_TOP_TUTORS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [minRating, setMinRating] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState<ExtendedTutor | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('14:00')
  const [bookingTopic, setBookingTopic] = useState('')
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    async function loadBackendTutors() {
      const data = await fetchFeaturedTutors()
      if (data && data.length > 0) {
        // Merge backend data with default rich profiles
        const merged = data.map((t, idx) => ({
          id: 'fetched_' + idx,
          name: t.name,
          subject: t.subject,
          experience: t.experience,
          rating: typeof t.rating === 'number' ? t.rating : parseFloat(t.rating) || 4.9,
          reviews: t.reviews,
          image: t.image,
          hourlyRate: (t as any).hourlyRate || 55,
          bio: (t as any).bio || `${t.experience} specializing in ${t.subject}.`,
          subjects: [t.subject.split(' ')[0], 'Computer Science', 'Tutorials'],
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
    }
    loadBackendTutors()
  }, [])

  // All unique subjects
  const allSubjects = useMemo(() => {
    const set = new Set<string>()
    set.add('All')
    tutorsList.forEach((t) => {
      t.subjects.forEach((s) => set.add(s))
    })
    return Array.from(set)
  }, [tutorsList])

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
    { value: 0, label: 'Any Rating', icon: <Star size={13} className="text-[#86868b]" /> },
    { value: 4.5, label: '4.5+ Rating', icon: <Star size={13} className="text-amber-500" /> },
    { value: 4.8, label: '4.8+ Rating', icon: <Star size={13} className="text-amber-500" /> },
    { value: 4.9, label: '4.9+ Rating', icon: <Star size={13} className="text-amber-500" /> },
  ]

  const priceOptions: DropdownOption<number>[] = [
    { value: 100, label: 'Under $100/hr', icon: <DollarSign size={13} className="text-[#86868b]" /> },
    { value: 70, label: 'Under $70/hr', icon: <DollarSign size={13} className="text-[#86868b]" /> },
    { value: 55, label: 'Under $55/hr', icon: <DollarSign size={13} className="text-[#86868b]" /> },
  ]

  const subjectDropdownOptions: DropdownOption<string>[] = useMemo(() => {
    return allSubjects.map((sub) => ({
      value: sub,
      label: sub === 'All' ? 'All Academic Domains' : sub,
      icon: <BookOpen size={13} className="text-[#0066cc]" />,
    }))
  }, [allSubjects])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/10 selection:text-[#0066cc] pb-24">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,102,204,0.035)_0%,_transparent_60%)] pointer-events-none z-0" />

      {/* Global Navbar */}
      <Navbar />

      {/* Hero Header Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-10 text-center flex flex-col items-center w-full"
      >
        <motion.h1 
          variants={itemVariants} 
          className="mt-2 mb-4 text-4xl sm:text-6xl md:text-[68px] font-semibold tracking-[-0.035em] leading-[1.08] text-[#1d1d1f]"
        >
          <span>Find your mentor.</span>
          <br className="hidden sm:inline" />
          <span className="block mt-1 sm:mt-2 text-[#0066cc]">
            Top Rated Tutors & Peer Mentors.
          </span>
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="max-w-2xl mx-auto text-base sm:text-lg text-[#7a7a7a] font-normal leading-relaxed tracking-normal"
        >
          Connect 1-on-1 with verified academic scholars, PhD researchers, and peer educators for live Socratic tutoring and code reviews.
        </motion.p>
      </motion.section>

      {/* Search & Filter Control Bar */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-6 mb-10"
      >
        <div className="p-4 rounded-3xl bg-white border border-[#e5e5e7] shadow-sm space-y-4">
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
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-2 border-t border-[#f0f0f2]">
            {/* Subject Dropdown & Quick Chips */}
            <div className="flex flex-wrap items-center gap-2 max-w-full">
              <CustomDropdown<string>
                options={subjectDropdownOptions}
                value={selectedSubject}
                onChange={(val: string) => setSelectedSubject(val)}
                icon={<Filter size={13} />}
                buttonClassName="py-1.5"
              />

              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
                {allSubjects.slice(1, 6).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                      selectedSubject === sub
                        ? 'bg-[#0066cc] text-white shadow-xs'
                        : 'bg-[#f5f5f7] border border-[#e5e5e7] text-[#525252] hover:bg-[#e0e0e0]/60'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Rating Selectors */}
            <div className="flex items-center gap-3">
              <CustomDropdown<number>
                options={ratingOptions}
                value={minRating}
                onChange={(val: number) => setMinRating(val)}
                buttonClassName="py-1.5"
              />

              <CustomDropdown<number>
                options={priceOptions}
                value={maxPrice}
                onChange={(val: number) => setMaxPrice(val)}
                buttonClassName="py-1.5"
                align="right"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tutors Grid Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs font-semibold text-[#7a7a7a]">
            Showing <span className="text-[#1d1d1f]">{filteredTutors.length}</span> Verified Tutors
          </div>
          {(selectedSubject !== 'All' || searchQuery || minRating > 0 || maxPrice < 100) && (
            <button
              onClick={() => {
                setSelectedSubject('All')
                setSearchQuery('')
                setMinRating(0)
                setMaxPrice(100)
              }}
              className="text-xs font-semibold text-[#0066cc] hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {filteredTutors.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#e5e5e7] space-y-3">
            <UserCheck size={36} className="mx-auto text-[#7a7a7a]" />
            <h3 className="text-lg font-display font-semibold text-[#1d1d1f]">No tutors matched your criteria</h3>
            <p className="text-xs text-[#7a7a7a]">Try adjusting your search query or subject filters.</p>
          </div>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTutors.map((tutor) => (
              <motion.div
                key={tutor.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-[#e5e5e7] p-6 space-y-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#0066cc]/40 transition-all group"
              >
                <div className="space-y-4">
                  {/* Top Card Header */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={tutor.image}
                        alt={tutor.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#e0e0e0] shadow-xs group-hover:scale-105 transition-transform"
                      />
                      {tutor.isOnline && (
                        <span
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"
                          title="Online & Ready for Live Session"
                        />
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-display font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors truncate">
                          {tutor.name}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {tutor.aiMatchScore && tutor.aiMatchScore >= 75 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-bold flex items-center gap-1 border border-[#0066cc]/20">
                              <Sparkles size={10} />
                              <span>{tutor.aiMatchScore}% Match</span>
                            </span>
                          )}
                          {tutor.isVerified && (
                            <span title="Verified Educator" className="inline-flex items-center">
                              <ShieldCheck size={16} className="text-[#0066cc]" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-[#7a7a7a] font-medium">{tutor.experience}</div>

                      <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                        <Star size={13} className="text-amber-500 stroke-[2.2]" />
                        <span>{tutor.rating}</span>
                        <span className="text-[#7a7a7a] font-normal">({tutor.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Domain */}
                  <div className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs font-semibold text-[#1d1d1f] flex items-center gap-2">
                    <BookOpen size={14} className="text-[#0066cc]" />
                    <span>{tutor.subject}</span>
                  </div>

                  {/* Bio Statement */}
                  <p className="text-xs text-[#525252] leading-relaxed line-clamp-3 font-normal">
                    {tutor.bio}
                  </p>

                  {/* Subject Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tutor.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] border border-[#e0e0e0] text-[11px] font-medium text-[#525252]"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-[#f0f0f2] flex items-center justify-between gap-3 mt-4">
                  <div>
                    <span className="text-lg font-display font-bold text-[#1d1d1f]">${tutor.hourlyRate}</span>
                    <span className="text-xs text-[#7a7a7a]">/hr</span>
                  </div>

                  <button
                    onClick={() => setSelectedTutorForBooking(tutor)}
                    className="px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Video size={13} />
                    Book Session
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* BOOKING MODAL */}
      {selectedTutorForBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#e0e0e0] rounded-3xl p-6 space-y-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 text-[#1d1d1f]">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] space-y-1.5 text-xs text-[#525252]">
                <div className="flex justify-between font-medium">
                  <span>1 Hour Live Session</span>
                  <span>${selectedTutorForBooking.hourlyRate}.00</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Platform Escrow Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="pt-2 border-t border-[#e0e0e0] flex justify-between font-bold text-[#1d1d1f] text-sm">
                  <span>Total</span>
                  <span>${selectedTutorForBooking.hourlyRate}.00</span>
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
                  className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white font-semibold transition-all shadow-md shadow-[#0066cc]/20 flex items-center gap-2 cursor-pointer active:scale-95"
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
