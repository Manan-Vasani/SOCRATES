import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Award,
  Video,
  CheckCircle2,
  Share2,
  Bookmark,
  FileText,
  Code,
  X,
  Send,
  User,
  Zap,
  TrendingUp,
  Flame,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  author: string
  role: 'student' | 'tutor' | 'ai'
  avatar?: string
  text: string
  time: string
  upvotes: number
  isVerified?: boolean
}

interface DoubtThread {
  id: string
  title: string
  subject: string
  tags: string[]
  author: string
  authorAvatar?: string
  time: string
  upvotes: number
  userVote: 'up' | 'down' | null
  isSolved: boolean
  hasAiAnswer: boolean
  content: string
  codeSnippet?: string
  commentsCount: number
  comments: Comment[]
}

const INITIAL_THREADS: DoubtThread[] = [
  {
    id: 'thread-1',
    title: 'How to apply King\'s Property to solve definite integrals with sin(x) & cos(x)?',
    subject: 'Mathematics',
    tags: ['Calculus', 'Integrals', 'Olympiad'],
    author: 'Manan Vasani',
    time: '12m ago',
    upvotes: 42,
    userVote: null,
    isSolved: true,
    hasAiAnswer: true,
    content:
      'I am trying to solve \\int_{0}^{\\pi/2} \\frac{\\sin^n(x)}{\\sin^n(x) + \\cos^n(x)} dx. I know King\'s Property states \\int_{a}^{b} f(x) dx = \\int_{a}^{b} f(a+b-x) dx, but how do we combine the equations after substitution?',
    codeSnippet: `// Definite Integral Form:\nI = ∫(0 to π/2) [ sin^n(x) / (sin^n(x) + cos^n(x)) ] dx`,
    commentsCount: 3,
    comments: [
      {
        id: 'c-ai-1',
        author: 'Socrates AI Bot',
        role: 'ai',
        text: '🤖 **Guiding Hint**: Notice what happens when you substitute x with (0 + π/2 - x) = π/2 - x. What do sin(π/2 - x) and cos(π/2 - x) simplify to? Try writing down the new expression for I and add it to your original integral!',
        time: '12m ago',
        upvotes: 24,
      },
      {
        id: 'c-tutor-1',
        author: 'Dr. Alex Vance',
        role: 'tutor',
        isVerified: true,
        text: 'Substitute x = π/2 - x. The integrand becomes cos^n(x) / (cos^n(x) + sin^n(x)). When you add 2I = ∫(0 to π/2) 1 dx = π/2, so I = π/4 for any value of n!',
        time: '8m ago',
        upvotes: 38,
      },
    ],
  },
  {
    id: 'thread-2',
    title: 'Understanding Red-Black Tree rotation rules during insertion',
    subject: 'Computer Science',
    tags: ['Data Structures', 'Algorithms', 'Trees'],
    author: 'Elena Rostova',
    time: '45m ago',
    upvotes: 28,
    userVote: null,
    isSolved: false,
    hasAiAnswer: true,
    content:
      'When inserting a new node into a Red-Black Tree, if the uncle node is BLACK and the new node is a right-child of a left-child (LR case), why do we perform a double rotation (Left then Right)?',
    codeSnippet: `def insert_fixup(tree, node):\n    # LR Case: Left-Rotate parent, then Right-Rotate grandparent\n    if node == node.parent.right and node.parent == node.grandparent.left:\n        left_rotate(tree, node.parent)\n        node = node.left`,
    commentsCount: 2,
    comments: [
      {
        id: 'c-ai-2',
        author: 'Socrates AI Bot',
        role: 'ai',
        text: '🤖 **Guiding Hint**: Think about the LL case vs LR case symmetry. Why can a single Right Rotation fix the LL case, but leaves the LR case unbalanced if not rotated left first?',
        time: '45m ago',
        upvotes: 15,
      },
    ],
  },
  {
    id: 'thread-3',
    title: 'Why is the wave function ψ normalized in Quantum Mechanics?',
    subject: 'Physics',
    tags: ['Quantum Mechanics', 'Wave Function', 'Probability'],
    author: 'Marcus Chen',
    time: '2h ago',
    upvotes: 19,
    userVote: null,
    isSolved: true,
    hasAiAnswer: true,
    content:
      'We set \\int_{-\\infty}^{\\infty} |\\psi(x,t)|^2 dx = 1. What is the physical interpretation of this condition, and why must it remain constant over time according to Born\'s rule?',
    commentsCount: 4,
    comments: [
      {
        id: 'c-tutor-2',
        author: 'Prof. Sarah Jenkins',
        role: 'tutor',
        isVerified: true,
        text: '|ψ(x,t)|^2 represents probability density. The integral over all space equals 1 because the particle MUST exist somewhere in the universe with 100% probability!',
        time: '1h ago',
        upvotes: 29,
      },
    ],
  },
]

const TOP_CONTRIBUTORS = [
  { rank: 1, name: 'Dr. Alex Vance', karma: 3450, solved: 142, badge: 'Verified Master' },
  { rank: 2, name: 'Prof. Sarah Jenkins', karma: 2890, solved: 118, badge: 'Physics Scholar' },
  { rank: 3, name: 'Manan Vasani', karma: 2150, solved: 86, badge: 'Top Contributor' },
  { rank: 4, name: 'Elena Rostova', karma: 1840, solved: 72, badge: 'Algorithmic Lead' },
]

export default function CommunityPage() {
  const [threads, setThreads] = useState<DoubtThread[]>(INITIAL_THREADS)
  const [activeSubject, setActiveSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterMode, setFilterMode] = useState<'all' | 'unsolved' | 'solved'>('all')

  // Modal states
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [activeThread, setActiveThread] = useState<DoubtThread | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('Mathematics')
  const [newTags, setNewTags] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCode, setNewCode] = useState('')

  // New Comment state
  const [commentText, setCommentText] = useState('')

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newVote = t.userVote === 'up' ? null : 'up'
          const diff = newVote === 'up' ? (t.userVote === 'down' ? 2 : 1) : -1
          return { ...t, userVote: newVote, upvotes: t.upvotes + diff }
        }
        return t
      })
    )
  }

  const handleDownvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newVote = t.userVote === 'down' ? null : 'down'
          const diff = newVote === 'down' ? (t.userVote === 'up' ? -2 : -1) : 1
          return { ...t, userVote: newVote, upvotes: t.upvotes + diff }
        }
        return t
      })
    )
  }

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter a thread title and description')
      return
    }

    const tagList = newTags
      ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [newSubject]

    const newThread: DoubtThread = {
      id: `thread-${Date.now()}`,
      title: newTitle,
      subject: newSubject,
      tags: tagList,
      author: 'You',
      time: 'Just now',
      upvotes: 1,
      userVote: 'up',
      isSolved: false,
      hasAiAnswer: true,
      content: newContent,
      codeSnippet: newCode.trim() || undefined,
      commentsCount: 1,
      comments: [
        {
          id: `c-ai-${Date.now()}`,
          author: 'Socrates AI Bot',
          role: 'ai',
          text: `🤖 **Socrates AI First Responder**: Great question on ${newSubject}! Here is a guiding thought: Identify the principal boundary condition or variable constraints. What formula links your knowns to the unknowns?`,
          time: 'Just now',
          upvotes: 5,
        },
      ],
    }

    setThreads((prev) => [newThread, ...prev])
    setIsPostModalOpen(false)
    setNewTitle('')
    setNewContent('')
    setNewCode('')
    setNewTags('')
    toast.success('Doubt Thread Posted! Socratic AI bot generated the first guiding reply 🤖')
  }

  const handleAddComment = () => {
    if (!commentText.trim() || !activeThread) return
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: 'You',
      role: 'student',
      text: commentText,
      time: 'Just now',
      upvotes: 1,
    }

    const updated = {
      ...activeThread,
      commentsCount: activeThread.commentsCount + 1,
      comments: [...activeThread.comments, newComment],
    }

    setActiveThread(updated)
    setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updated : t)))
    setCommentText('')
    toast.success('+15 Karma! Comment posted successfully.')
  }

  const filteredThreads = threads.filter((t) => {
    const matchesSubject = activeSubject === 'All' || t.subject === activeSubject
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter =
      filterMode === 'all'
        ? true
        : filterMode === 'solved'
        ? t.isSolved
        : !t.isSolved

    return matchesSubject && matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] flex flex-col font-sans selection:bg-[#0066cc]/10">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-white border-b border-[#e5e5e7] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066cc]/8 border border-[#0066cc]/15 text-[#0066cc] text-xs font-semibold">
              <MessageSquare size={14} />
              <span>SOCRATES Academic Doubt Forum</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
              Community Doubt Board & Knowledge Exchange
            </h1>
            <p className="text-sm text-[#6e6e73] max-w-xl">
              Post academic doubts, discuss complex problem sets with peers & verified tutors, and get instant Socratic AI hints.
            </p>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] transition-all shadow-md shadow-[#0066cc]/25 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Post a Doubt Thread</span>
          </button>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Controls & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doubts by title, formula, code, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#e0e0e2] text-xs outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all shadow-2xs"
            />
          </div>

          {/* Filter Modes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-[#1d1d1f] text-white' : 'bg-white border border-[#e0e0e2] text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              All Threads
            </button>
            <button
              onClick={() => setFilterMode('unsolved')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'unsolved' ? 'bg-amber-500 text-white' : 'bg-white border border-[#e0e0e2] text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              Open / Unsolved
            </button>
            <button
              onClick={() => setFilterMode('solved')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'solved' ? 'bg-emerald-600 text-white' : 'bg-white border border-[#e0e0e2] text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              Solved ✓
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['All', 'Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'Engineering'].map((subj) => (
            <button
              key={subj}
              onClick={() => setActiveSubject(subj)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSubject === subj
                  ? 'bg-[#0066cc] text-white shadow-xs'
                  : 'bg-white border border-[#e0e0e2] text-[#6e6e73] hover:border-[#0066cc]/30 hover:text-[#1d1d1f]'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Feed & Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doubt Feed */}
          <div className="lg:col-span-2 space-y-4">
            {filteredThreads.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#e5e5e7] p-12 text-center space-y-3">
                <MessageSquare size={36} className="text-[#a1a1a6] mx-auto" />
                <h4 className="text-base font-bold text-[#1d1d1f]">No Doubt Threads Found</h4>
                <p className="text-xs text-[#6e6e73]">Be the first to ask a question in this category!</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setActiveThread(thread)}
                  className="bg-white rounded-3xl border border-[#e5e5e7] p-6 shadow-2xs hover:shadow-md hover:border-[#0066cc]/30 transition-all cursor-pointer space-y-4 group relative"
                >
                  {/* Thread Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0066cc] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {thread.author.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-[#1d1d1f] truncate">{thread.author}</span>
                      <span className="text-xs text-[#86868b]">• {thread.time}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {thread.isSolved && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
                          <CheckCircle2 size={12} /> Solved
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f0f0f2] text-[#6e6e73] text-[10px] font-semibold">
                        {thread.subject}
                      </span>
                    </div>
                  </div>

                  {/* Thread Title & Preview */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors leading-snug">
                      {thread.title}
                    </h3>
                    <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
                      {thread.content}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {thread.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#f5f5f7] border border-[#e5e5e7] text-[#6e6e73]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Thread Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f2] text-xs text-[#86868b]">
                    <div className="flex items-center gap-4">
                      {/* Karma Vote Buttons */}
                      <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-xl px-2 py-1 border border-[#e5e5e7]">
                        <button
                          onClick={(e) => handleUpvote(thread.id, e)}
                          className={`p-1 hover:text-[#0066cc] transition-colors cursor-pointer ${
                            thread.userVote === 'up' ? 'text-[#0066cc] font-bold' : ''
                          }`}
                        >
                          ▲
                        </button>
                        <span className="font-extrabold text-[#1d1d1f] px-1 text-xs">{thread.upvotes}</span>
                        <button
                          onClick={(e) => handleDownvote(thread.id, e)}
                          className={`p-1 hover:text-red-500 transition-colors cursor-pointer ${
                            thread.userVote === 'down' ? 'text-red-500 font-bold' : ''
                          }`}
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        <span>{thread.commentsCount} replies</span>
                      </div>

                      {thread.hasAiAnswer && (
                        <div className="flex items-center gap-1 text-[#0066cc] font-semibold text-[11px] bg-[#0066cc]/8 px-2 py-0.5 rounded-full">
                          <Sparkles size={12} />
                          <span>AI Responded</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/study-room/demo-101"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[#0066cc] hover:underline text-xs font-semibold cursor-pointer"
                    >
                      <Video size={13} />
                      <span>Live Study Room</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Sidebar: Top Contributors & Guidelines */}
          <div className="space-y-6">
            {/* Top Contributors Leaderboard */}
            <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                  <Award size={16} className="text-amber-500" />
                  <span>Top Tutor Contributors</span>
                </h4>
                <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Karma</span>
              </div>

              <div className="space-y-3">
                {TOP_CONTRIBUTORS.map((c) => (
                  <div key={c.rank} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-[#a1a1a6] w-4">#{c.rank}</span>
                      <div>
                        <div className="font-bold text-[#1d1d1f] truncate max-w-[130px]">{c.name}</div>
                        <span className="text-[9px] text-[#0066cc] font-semibold">{c.badge}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#1d1d1f]">{c.karma} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Rules */}
            <div className="bg-[#f8f8fa] rounded-3xl border border-[#e5e5e7] p-6 space-y-3">
              <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">Community Socratic Code</h4>
              <ul className="text-xs text-[#6e6e73] space-y-2 list-disc pl-4 leading-relaxed">
                <li>Ask questions clearly with LaTeX or code snippets.</li>
                <li>Socrates AI will guide you with hints — attempt to solve step by step!</li>
                <li>Upvote high-quality explanations to reward helpful tutors.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE POST MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] bg-[#fafafa]">
              <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2">
                <Plus size={18} className="text-[#0066cc]" />
                <span>Post a New Academic Doubt Thread</span>
              </h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#e0e0e2] text-[#7a7a7a] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs font-medium outline-none focus:border-[#0066cc]"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Thread Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. How do I evaluate \\int x^2 \\cdot \\sin(x) dx using integration by parts?"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs font-medium outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Detailed Question Description</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Describe your roadblock clearly. Mention what steps you have already tried..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs outline-none focus:border-[#0066cc] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Code / Formula Block (Optional)</label>
                <textarea
                  rows={2}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Paste code or equations here..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1d1d1f] text-white text-xs font-mono outline-none focus:ring-2 focus:ring-[#0066cc] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Calculus, Integrals, Limits"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e5e5e7]">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#6e6e73] hover:bg-[#f0f0f2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-semibold hover:bg-[#0077ed] transition-colors cursor-pointer shadow-md shadow-[#0066cc]/20"
                >
                  Post Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THREAD DETAIL MODAL */}
      {activeThread && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-xs font-bold">
                  {activeThread.subject}
                </span>
                <span className="text-xs text-[#86868b]">Asked by {activeThread.author} • {activeThread.time}</span>
              </div>
              <button
                onClick={() => setActiveThread(null)}
                className="p-1.5 rounded-xl hover:bg-[#e0e0e2] text-[#7a7a7a] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-extrabold text-[#1d1d1f]">{activeThread.title}</h2>
                <p className="text-sm text-[#1d1d1f]/90 leading-relaxed font-sans">{activeThread.content}</p>

                {activeThread.codeSnippet && (
                  <pre className="p-4 rounded-2xl bg-[#1d1d1f] text-white text-xs font-mono overflow-x-auto">
                    <code>{activeThread.codeSnippet}</code>
                  </pre>
                )}
              </div>

              {/* Comments Section */}
              <div className="space-y-4 border-t border-[#e5e5e7] pt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
                  {activeThread.comments.length} Socratic Replies
                </h4>

                <div className="space-y-3">
                  {activeThread.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border space-y-2 ${
                        c.role === 'ai'
                          ? 'bg-[#f0f7ff] border-[#0066cc]/20'
                          : c.isVerified
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-[#fafafa] border-[#e5e5e7]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1d1d1f]">{c.author}</span>
                          {c.role === 'ai' && (
                            <span className="px-2 py-0.5 rounded-full bg-[#0066cc] text-white text-[9px] font-bold">
                              AI BOT
                            </span>
                          )}
                          {c.isVerified && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                              VERIFIED TUTOR
                            </span>
                          )}
                          <span className="text-[#86868b]">• {c.time}</span>
                        </div>
                        <span className="font-bold text-[#0066cc] text-xs">▲ {c.upvotes}</span>
                      </div>
                      <p className="text-xs text-[#1d1d1f] leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Input Footer */}
            <div className="p-4 border-t border-[#e5e5e7] bg-white flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Write a helpful answer or Socratic hint..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs outline-none focus:border-[#0066cc]"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="px-5 py-2.5 rounded-2xl bg-[#0066cc] text-white text-xs font-bold hover:bg-[#0077ed] transition-all disabled:opacity-30 cursor-pointer shadow-sm"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
