import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Atom,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Download,
  Filter,
  FlaskConical,
  Layers,
  Play,
  Search,
  Sigma,
  Sparkles,
  User,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface SessionRecord {
  id: string
  title: string
  subject: string
  tutorName: string
  tutorAvatar?: string
  date: string
  duration: string
  fileSize: string
  thumbnailUrl: string
  videoUrl: string
  aiSummary: string[]
  keyEquations: string[]
  transcript: { time: string; speaker: string; text: string }[]
}

const SAMPLE_RECORDINGS: SessionRecord[] = [
  {
    id: 'rec-1',
    title: 'Advanced Calculus: Integration by Parts & Partial Fractions',
    subject: 'Mathematics',
    tutorName: 'Dr. Alex Vance',
    date: 'Aug 2, 2026',
    duration: '45 mins',
    fileSize: '320 MB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    aiSummary: [
      'Derived the Product Rule origin for Integration by Parts: ∫ u dv = uv - ∫ v du.',
      'Demonstrated ILATE rule priority for choosing u (Inverse trig, Logarithmic, Algebraic, Trigonometric, Exponential).',
      'Solved 3 complex improper integral problems on the digital whiteboard.',
    ],
    keyEquations: [
      '\\int u \\, dv = uv - \\int v \\, du',
      '\\int \\frac{1}{x^2 + a^2} dx = \\frac{1}{a} \\arctan\\left(\\frac{x}{a}\\right) + C',
    ],
    transcript: [
      { time: '00:02', speaker: 'Dr. Alex Vance', text: 'Welcome back! Today we are diving into advanced integration techniques.' },
      { time: '05:14', speaker: 'You', text: 'Can we go over how to pick u when both algebraic and trig functions appear?' },
      { time: '05:30', speaker: 'Dr. Alex Vance', text: 'Great question! Remember the ILATE rule hierarchy. Algebraic comes before Trigonometric.' },
      { time: '22:40', speaker: 'Dr. Alex Vance', text: 'Let us draw this step on the whiteboard and check our boundary limits.' },
    ],
  },
  {
    id: 'rec-2',
    title: 'Data Structures: Graph Traversal & Dijkstra Algorithm',
    subject: 'Computer Science',
    tutorName: 'Elena Rostova',
    date: 'Jul 30, 2026',
    duration: '60 mins',
    fileSize: '410 MB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    aiSummary: [
      'Implemented Min-Heap priority queue optimization for Dijkstra in Python.',
      'Analyzed O((V + E) log V) time complexity vs O(V^2) unoptimized matrix approach.',
      'Ran live test cases in SOCRATES Code Sandbox IDE.',
    ],
    keyEquations: [
      'd[v] = \\min(d[v], d[u] + w(u, v))',
      'Time\\ Complexity = O((V + E) \\log V)',
    ],
    transcript: [
      { time: '00:05', speaker: 'Elena Rostova', text: 'Let us start by building an adjacency list representation of our graph.' },
      { time: '14:20', speaker: 'You', text: 'Why do we use a priority queue instead of a standard FIFO queue?' },
      { time: '14:45', speaker: 'Elena Rostova', text: 'Because we always want to extract the vertex with the smallest distance estimation next.' },
    ],
  },
  {
    id: 'rec-3',
    title: 'Quantum Mechanics: Wave Packet Dispersion & Uncertainty',
    subject: 'Physics',
    tutorName: 'Prof. Sarah Jenkins',
    date: 'Jul 28, 2026',
    duration: '50 mins',
    fileSize: '380 MB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    aiSummary: [
      'Derived the Heisenberg Uncertainty Principle Δx Δp ≥ ħ/2 from Fourier transform pairs.',
      'Simulated Gaussian wave packet broadening over time on the shared canvas.',
    ],
    keyEquations: [
      '\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}',
      'i\\hbar \\frac{\\partial}{\\partial t} \\psi(x,t) = \\hat{H} \\psi(x,t)',
    ],
    transcript: [
      { time: '00:10', speaker: 'Prof. Sarah Jenkins', text: 'Today we explore how momentum uncertainty causes spatial spreading of wavepackets.' },
    ],
  },
]

const getSubjectFilterIcon = (subj: string, isActive: boolean) => {
  const colorClass = isActive ? 'text-white' : 'text-[#0066cc]'
  switch (subj) {
    case 'All':
      return <Layers size={14} className={`${colorClass} shrink-0`} />
    case 'Mathematics':
      return <Sigma size={14} className={`${colorClass} shrink-0`} />
    case 'Computer Science':
      return <Code2 size={14} className={`${colorClass} shrink-0`} />
    case 'Physics':
      return <Atom size={14} className={`${colorClass} shrink-0`} />
    case 'Chemistry':
      return <FlaskConical size={14} className={`${colorClass} shrink-0`} />
    case 'Engineering':
      return <Cpu size={14} className={`${colorClass} shrink-0`} />
    default:
      return <BookOpen size={14} className={`${colorClass} shrink-0`} />
  }
}

export default function RecordingsPage() {
  const [recordings] = useState<SessionRecord[]>(SAMPLE_RECORDINGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSubject, setActiveSubject] = useState('All')
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(null)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [selectedDateFilter, setSelectedDateFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [calendarYear, setCalendarYear] = useState(2026)
  const [calendarMonth, setCalendarMonth] = useState(6) // 0-indexed: 6 = July 2026

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dateOptions = ['All', ...Array.from(new Set(recordings.map((r) => r.date)))]

  // Days in month calculator
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear((prev) => prev - 1)
    } else {
      setCalendarMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear((prev) => prev + 1)
    } else {
      setCalendarMonth((prev) => prev + 1)
    }
  }

  const filteredRecordings = recordings
    .filter((r) => {
      const matchesSubject = activeSubject === 'All' || r.subject === activeSubject
      const matchesDate = selectedDateFilter === 'All' || r.date === selectedDateFilter
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tutorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.aiSummary.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSubject && matchesDate && matchesSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const handleDownloadPDF = (title: string) => {
    toast.success(`Exporting AI Notes PDF for "${title}"... Download started!`)
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] flex flex-col font-sans selection:bg-[#0066cc]/10">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-white border-b border-[#e5e5e7] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
              Session Recordings & AI Notes Library
            </h1>
            <p className="text-sm text-[#6e6e73] max-w-xl">
              Access your past Study Room video recordings, automated Socratic AI lesson summaries, whiteboard snapshots, and PDF exports.
            </p>
          </div>

          <Link
            to="/study-room/demo-101"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] transition-all shadow-md shadow-[#0066cc]/25 cursor-pointer shrink-0"
          >
            <Video size={16} />
            <span>Join Active Study Room</span>
          </Link>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Integrated Search, Date & Subject Control Panel */}
        <div className="bg-white rounded-3xl border border-[#e5e5e7] p-4 sm:p-5 space-y-4 shadow-2xs">
          {/* Top Control Bar: Search Input + Date Filter + Sort Order */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a6]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings by topic, tutor name, date, or keyword..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f5f5f7] border border-transparent text-xs font-semibold outline-none focus:bg-white focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1a6] hover:text-[#1d1d1f] p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Side Filters: Custom Interactive Calendar Popover + Sort Order */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap relative">
              {/* Custom Apple-Grade Session Archive Calendar Trigger */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`w-full sm:w-[210px] min-w-[210px] px-4 py-2.5 rounded-2xl border text-xs font-bold font-display flex items-center justify-between transition-colors cursor-pointer select-none shadow-2xs shrink-0 whitespace-nowrap ${
                    selectedDateFilter !== 'All'
                      ? 'bg-[#0066cc]/10 border-[#0066cc] text-[#0066cc]'
                      : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] border-[#e0e0e4] hover:border-[#0066cc]/40 text-[#1d1d1f]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Calendar size={15} className="text-[#0066cc] shrink-0" />
                    <span className="truncate">{selectedDateFilter === 'All' ? 'Filter by Session Date' : selectedDateFilter}</span>
                  </div>
                  <ChevronDown size={14} className="text-[#6e6e73] shrink-0 ml-1" />
                </button>

                {/* Custom Interactive Calendar Popover Box */}
                {isCalendarOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-80 bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 transform-gpu select-none">
                    {/* Calendar Month & Year Navigation Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f2]">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-extrabold text-[#1d1d1f]">
                          {monthNames[calendarMonth]} {calendarYear}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1.5 rounded-xl hover:bg-[#f5f5f7] text-[#525252] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1.5 rounded-xl hover:bg-[#f5f5f7] text-[#525252] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Day of Week Labels */}
                    <div className="grid grid-cols-7 text-center font-display text-[11px] font-bold text-[#86868b]">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    {/* Date Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center font-display text-xs">
                      {/* Empty filler cells for start of month */}
                      {Array.from({ length: getFirstDayOfWeek(calendarYear, calendarMonth) }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                      ))}

                      {/* Day cells */}
                      {Array.from({ length: getDaysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                        const dayNum = i + 1
                        const shortMonth = monthNames[calendarMonth].substring(0, 3)
                        const fullDateStr = `${shortMonth} ${dayNum}, ${calendarYear}`

                        // Check session status
                        const hasRecording = recordings.some((r) => r.date === fullDateStr)
                        const isCancelled = ['Jul 15, 2026', 'Jul 22, 2026'].includes(fullDateStr)
                        const isSelected = selectedDateFilter === fullDateStr

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => {
                              setSelectedDateFilter(isSelected ? 'All' : fullDateStr)
                              setIsCalendarOpen(false)
                            }}
                            className={`h-8 rounded-xl flex flex-col items-center justify-center font-bold text-xs relative transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#0066cc] text-white border border-[#0066cc] shadow-2xs'
                                : 'text-[#1d1d1f] hover:bg-[#f5f5f7] border-none'
                            }`}
                          >
                            <span>{dayNum}</span>
                            {!isSelected && hasRecording && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" title="Past Recorded Session" />
                            )}
                            {!isSelected && isCancelled && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute bottom-1" title="Cancelled Session" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Calendar Status Legend */}
                    <div className="pt-3 border-t border-[#f0f0f2] flex items-center justify-between text-[10px] font-bold text-[#6e6e73]">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Past Session</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        <span>Cancelled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#0066cc] inline-block" />
                        <span>Selected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Apple-Grade Interactive Sort Order Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full sm:w-[185px] min-w-[185px] px-4 py-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-[#e0e0e4] hover:border-[#0066cc]/40 text-xs font-bold font-display text-[#1d1d1f] flex items-center justify-between transition-colors cursor-pointer select-none shadow-2xs shrink-0 whitespace-nowrap"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter size={14} className="text-[#0066cc] shrink-0" />
                    <span className="truncate">{sortOrder === 'newest' ? 'Sort: Newest First' : 'Sort: Oldest First'}</span>
                  </div>
                  <ChevronDown size={14} className="text-[#6e6e73] shrink-0 ml-1" />
                </button>

                {/* Custom Sort Options Popover Menu */}
                {isSortOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-52 bg-white rounded-2xl border border-[#e5e5e7] shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 transform-gpu select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('newest')
                        setIsSortOpen(false)
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold font-display flex items-center justify-between transition-colors cursor-pointer ${
                        sortOrder === 'newest'
                          ? 'bg-[#0066cc]/10 text-[#0066cc]'
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowDownWideNarrow size={15} className="text-[#0066cc]" />
                        <span>Newest First</span>
                      </div>
                      {sortOrder === 'newest' && <Check size={14} className="text-[#0066cc]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('oldest')
                        setIsSortOpen(false)
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold font-display flex items-center justify-between transition-colors cursor-pointer ${
                        sortOrder === 'oldest'
                          ? 'bg-[#0066cc]/10 text-[#0066cc]'
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUpNarrowWide size={15} className="text-[#0066cc]" />
                        <span>Oldest First</span>
                      </div>
                      {sortOrder === 'oldest' && <Check size={14} className="text-[#0066cc]" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Control Bar: Subject Filter Pills + Clear Button */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#f0f0f2] pt-3">
            <div className="flex items-center gap-2">
              {['All', 'Mathematics', 'Computer Science', 'Physics'].map((subj) => {
                const isActive = activeSubject === subj
                return (
                  <button
                    key={subj}
                    onClick={() => setActiveSubject(subj)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-colors duration-150 cursor-pointer whitespace-nowrap select-none border flex items-center gap-2 transform-gpu ${
                      isActive
                        ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-2xs'
                        : 'bg-white border-[#e0e0e2] text-[#525252] hover:border-[#0066cc]/40 hover:text-[#0066cc]'
                    }`}
                  >
                    {getSubjectFilterIcon(subj, isActive)}
                    <span>{subj}</span>
                  </button>
                )
              })}
            </div>

            {/* Clear All Active Filters */}
            {(selectedDateFilter !== 'All' || activeSubject !== 'All' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDateFilter('All')
                  setActiveSubject('All')
                  setSearchQuery('')
                }}
                className="px-3.5 py-2 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0066cc] text-xs font-bold transition-colors cursor-pointer select-none whitespace-nowrap border border-[#e0e0e4] shrink-0"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Recordings List - Wide & Rich Information Cards */}
        <div className="space-y-6">
          {filteredRecordings.map((rec) => (
            <div
              key={rec.id}
              onClick={() => {
                setSelectedRecord(rec)
                setIsPlayingVideo(false)
              }}
              className="bg-white rounded-3xl border border-[#e5e5e7] overflow-hidden shadow-xs hover:border-[#0066cc]/50 transition-colors duration-150 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-0 group transform-gpu select-none"
            >
              {/* Left Column: Wide Video Thumbnail Frame (5 cols) */}
              <div className="md:col-span-5 lg:col-span-4 relative aspect-video md:aspect-auto min-h-[280px] sm:min-h-[310px] bg-black overflow-hidden">
                <img
                  src={rec.thumbnailUrl}
                  alt={rec.title}
                  className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-150"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 text-[#0066cc] flex items-center justify-center shadow-xl ring-4 ring-white/30 backdrop-blur-sm group-hover:bg-[#0066cc] group-hover:text-white transition-colors duration-150">
                    <Play size={24} className="fill-current translate-x-[1.5px] transition-colors duration-150" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-display font-bold tracking-wide border border-white/25 shadow-md select-none">
                  <Clock size={13} className="text-white/90" />
                  <span>{rec.duration}</span>
                </div>

                {/* Subject Badge */}
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-[#0066cc] text-xs font-bold shadow-xs border border-[#0066cc]/20 flex items-center gap-1.5">
                  {getSubjectFilterIcon(rec.subject, false)}
                  <span>{rec.subject}</span>
                </div>
              </div>

              {/* Right Column: Expansive Information Body (7 cols) */}
              <div className="md:col-span-7 lg:col-span-8 p-7 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Title & Instructor Info */}
                  <div className="space-y-2">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors leading-snug tracking-tight">
                      {rec.title}
                    </h3>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-[#525252]">
                      <div className="inline-flex items-center gap-1.5">
                        <User size={14} className="text-[#0066cc]" />
                        <span className="font-bold text-[#1d1d1f]">{rec.tutorName}</span>
                      </div>
                      <span>•</span>
                      <span>{rec.date}</span>
                    </div>
                  </div>

                  {/* Socratic AI Summary Multi-point List */}
                  <div className="bg-[#f4f8fc] border border-[#0066cc]/15 rounded-2xl p-4.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#0066cc] uppercase tracking-wider">
                      <Sparkles size={14} />
                      <span>Socrates AI Summary & Key Takeaways</span>
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-[13px] text-[#424245] leading-relaxed font-normal">
                      {rec.aiSummary.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#0066cc] font-bold shrink-0">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Formula / Equation Tags */}
                  {rec.keyEquations && rec.keyEquations.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 items-center pt-0.5">
                      <span className="font-display text-xs font-bold text-[#7a7a7a] uppercase tracking-wider">Formulas:</span>
                      {rec.keyEquations.map((eq, idx) => (
                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e5] font-mono text-xs text-[#1d1d1f] font-bold shadow-2xs">
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#f0f0f2]">
                  <span className="text-xs font-semibold text-[#7a7a7a]">
                    {rec.fileSize} HD • 1080p Video & Transcript
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRecord(rec)
                        setIsPlayingVideo(true)
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0055b3] text-white font-display text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer select-none"
                    >
                      <Play size={14} className="fill-white" />
                      <span>Watch Recording</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadPDF(rec.title)
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0066cc] border border-[#e0e0e4] font-display text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer select-none"
                    >
                      <Download size={14} />
                      <span>AI Notes PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Homepage Matching Footer */}
      <Footer />

      {/* RECAP DETAIL MODAL - Anti-Lag GPU Hardware Locked */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-150 transform-gpu select-none">
          <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 transform-gpu">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="px-3.5 py-1.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-xs font-bold shrink-0 border border-[#0066cc]/20 flex items-center gap-1.5">
                  {getSubjectFilterIcon(selectedRecord.subject, false)}
                  <span>{selectedRecord.subject}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-[#1d1d1f] truncate leading-snug">{selectedRecord.title}</h3>
                  <span className="text-xs text-[#6e6e73] font-medium">{selectedRecord.tutorName} • {selectedRecord.date} • {selectedRecord.duration} • {selectedRecord.fileSize} HD</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-2xl hover:bg-[#f5f5f7] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Video + AI Notes & Transcript */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#fafafc]">
              {/* Left Column: Video Player & Equations */}
              <div className="lg:col-span-2 space-y-6">
                {/* Video Player Box */}
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl relative border border-[#2a2a2e] transform-gpu">
                  {isPlayingVideo ? (
                    <video
                      src={selectedRecord.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <img src={selectedRecord.thumbnailUrl} alt={selectedRecord.title} className="w-full h-full object-cover opacity-85" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <button
                        type="button"
                        onClick={() => setIsPlayingVideo(true)}
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#0066cc] hover:bg-[#0077ed] text-white flex items-center justify-center shadow-2xl ring-4 ring-white/40 transition-colors duration-150 cursor-pointer transform-gpu select-none"
                      >
                        <Play size={26} className="fill-white translate-x-[2px]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Key Equations Section */}
                {selectedRecord.keyEquations && selectedRecord.keyEquations.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#e5e5e7] p-5 space-y-3.5 shadow-2xs">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
                      <Sigma size={16} className="text-[#0066cc]" />
                      <span>Key Equations & Derivations Covered</span>
                    </h4>
                    <div className="space-y-2.5">
                      {selectedRecord.keyEquations.map((eq, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] font-mono text-xs text-[#0f172a] font-bold flex items-center justify-between shadow-2xs">
                          <span className="truncate">{eq}</span>
                          <span className="text-[10px] font-mono text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-md font-bold shrink-0">LaTeX</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: AI Summary & Interactive Transcript */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* AI Summary Box */}
                  <div className="bg-gradient-to-br from-[#f4f8fc] via-white to-[#f4f8fc] rounded-2xl border border-[#0066cc]/20 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#0066cc] uppercase tracking-wider">
                      <Sparkles size={16} />
                      <span>Socrates AI Summary & Takeaways</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#525252] leading-relaxed">
                      {selectedRecord.aiSummary.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#0066cc] font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interactive Transcript */}
                  <div className="bg-white rounded-2xl border border-[#e5e5e7] p-5 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
                      <Clock size={16} className="text-[#0066cc]" />
                      <span>Interactive Transcript</span>
                    </h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {selectedRecord.transcript.map((t, i) => (
                        <div key={i} className="text-xs space-y-1 border-b border-[#f0f0f2] pb-2.5 last:border-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#1d1d1f]">{t.speaker}</span>
                            <button
                              type="button"
                              onClick={() => setIsPlayingVideo(true)}
                              className="font-mono text-[#0066cc] bg-[#0066cc]/10 hover:bg-[#0066cc] hover:text-white px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer select-none"
                              title="Jump to video timestamp"
                            >
                              {t.time}
                            </button>
                          </div>
                          <p className="text-[#525252] font-normal leading-relaxed">{t.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PDF Export Action */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedRecord.title)}
                  className="w-full py-3.5 rounded-2xl bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0055b3] text-white text-xs font-extrabold transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#0066cc]/20 cursor-pointer transform-gpu select-none mt-4"
                >
                  <Download size={16} />
                  <span>Download Full AI Notes PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
