import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/useAuthStore'
import {
  fetchCommunityThreads,
  fetchCommunityThread,
  createCommunityThread,
  voteCommunityThread,
  createCommunityComment,
  editCommunityComment,
  deleteCommunityComment,
  uploadMedia,
} from '../services/api'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
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
  Image as ImageIcon,
  Film,
  Paperclip,
  Trash2,
  Pencil,
  ArrowLeft,
  ArrowRight,
  MinusCircle,
  PlusCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

interface Comment {
  id: string
  author: string
  role: 'student' | 'tutor' | 'ai'
  avatar?: string
  text: string
  time: string
  upvotes: number
  isVerified?: boolean
  media?: MediaItem[]
  replies?: Comment[]
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
  media?: MediaItem[]
  commentsCount: number
  comments: Comment[]
}

// ─── API → Frontend Data Mapper ────────────────────────────────
function mapApiThread(t: any, currentUserId?: string): DoubtThread {
  const authorName = t.author?.fullName || t.author?.name || 'Anonymous'
  const userVote = currentUserId
    ? (t.voters?.find((v: any) => (v.user?._id || v.user) === currentUserId)?.vote || null)
    : null

  return {
    id: t._id,
    title: t.title,
    subject: t.subject,
    tags: t.tags || [],
    author: authorName,
    authorAvatar: t.author?.profileImage || undefined,
    time: formatTimeAgo(t.createdAt),
    upvotes: t.upvotes || 0,
    userVote,
    isSolved: t.isSolved || false,
    hasAiAnswer: t.hasAiAnswer || false,
    content: t.content,
    codeSnippet: t.codeSnippet || undefined,
    media: t.media || [],
    commentsCount: t.commentsCount || 0,
    comments: (t.comments || []).map((c: any) => mapApiComment(c)),
  }
}

function mapApiComment(c: any): Comment {
  return {
    id: c._id,
    author: c.role === 'ai' ? 'Socrates AI' : (c.author?.fullName || c.author?.name || 'Anonymous'),
    role: c.role || 'student',
    avatar: c.author?.profileImage || undefined,
    text: c.text,
    time: formatTimeAgo(c.createdAt),
    upvotes: c.upvotes || 0,
    isVerified: c.isVerified || false,
    media: c.media || [],
    replies: (c.replies || []).map((r: any) => mapApiComment(r)),
  }
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Just now'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Check if an ID is a real MongoDB ObjectId (24-char hex) — skip API for fake fallback IDs */
function isRealId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id)
}

const FALLBACK_THREADS: DoubtThread[] = [
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
    media: [
      {
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
        type: 'image',
      },
    ],
    commentsCount: 5,
    comments: [
      {
        id: 'c-tutor-1',
        author: 'Dr. Alex Vance',
        role: 'tutor',
        isVerified: true,
        text: 'Substitute x = π/2 - x. The integrand becomes cos^n(x) / (cos^n(x) + sin^n(x)). When you add 2I = ∫(0 to π/2) 1 dx = π/2, so I = π/4 for any value of n!',
        time: '8m ago',
        upvotes: 38,
        replies: [
          {
            id: 'c-1-1',
            author: 'Manan Vasani',
            role: 'student',
            text: 'Yesss! Woah, so it simplifies to 1 inside the integral because sin^n(x) + cos^n(x) cancels out the denominator?',
            time: '6m ago',
            upvotes: 14,
            replies: [
              {
                id: 'c-1-1-1',
                author: 'Dr. Alex Vance',
                role: 'tutor',
                isVerified: true,
                text: 'Exactly! Since numerator + numerator = denominator, the integrand becomes 1 identically across the entire range [0, π/2].',
                time: '4m ago',
                upvotes: 22,
                replies: [
                  {
                    id: 'c-1-1-1-1',
                    author: 'David Kim',
                    role: 'student',
                    text: 'Never seen this property used so cleanly b4! Thanks Dr. Vance.',
                    time: '2m ago',
                    upvotes: 9,
                  },
                ],
              },
            ],
          },
          {
            id: 'c-1-2',
            author: 'Elena Rostova',
            role: 'student',
            text: 'Works for any power n, even if n is fractional or negative!',
            time: '5m ago',
            upvotes: 11,
          },
        ],
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
    commentsCount: 3,
    comments: [
      {
        id: 'c-2',
        author: 'David Kim',
        role: 'student',
        text: 'Think about the LL case vs LR case symmetry. A single Right Rotation fixes the LL case, but leaves the LR case unbalanced if not rotated left first.',
        time: '45m ago',
        upvotes: 15,
        replies: [
          {
            id: 'c-2-1',
            author: 'Elena Rostova',
            role: 'student',
            text: 'Ah! So left rotating the parent transforms the LR shape into a straight LL shape first?',
            time: '30m ago',
            upvotes: 8,
            replies: [
              {
                id: 'c-2-1-1',
                author: 'David Kim',
                role: 'student',
                text: 'Spot on! Once it becomes an LL shape, one final Right rotation balances the black-height perfectly.',
                time: '20m ago',
                upvotes: 12,
              },
            ],
          },
        ],
      },
    ],
  },
]

function addNestedReply(comments: Comment[], parentId: string, newReply: Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return {
        ...c,
        replies: [...(c.replies || []), newReply],
      }
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: addNestedReply(c.replies, parentId, newReply),
      }
    }
    return c
  })
}

function editNestedComment(comments: Comment[], commentId: string, newText: string): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return {
        ...c,
        text: newText,
      }
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: editNestedComment(c.replies, commentId, newText),
      }
    }
    return c
  })
}

function deleteNestedComment(comments: Comment[], commentId: string): Comment[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({
      ...c,
      replies: c.replies ? deleteNestedComment(c.replies, commentId) : undefined,
    }))
}

function CommentItem({
  comment,
  threadAuthor,
  renderMediaGrid,
  onAddReply,
  onEditComment,
  onDeleteComment,
}: {
  comment: Comment
  threadAuthor: string
  renderMediaGrid: (items?: MediaItem[]) => React.ReactNode
  onAddReply: (parentId: string, text: string, media?: MediaItem[]) => void
  onEditComment?: (commentId: string, newText: string) => void
  onDeleteComment?: (commentId: string) => void
}) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyMedia, setReplyMedia] = useState<MediaItem[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [upvotes, setUpvotes] = useState(comment.upvotes)
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)

  const isOP = comment.author === threadAuthor
  const isOwnComment = comment.author === 'You'

  const handleVote = (type: 'up' | 'down') => {
    if (userVote === type) {
      setUserVote(null)
      setUpvotes((prev) => (type === 'up' ? prev - 1 : prev + 1))
    } else {
      const diff = type === 'up' ? (userVote === 'down' ? 2 : 1) : userVote === 'up' ? -2 : -1
      setUserVote(type)
      setUpvotes((prev) => prev + diff)
    }
  }

  const handleReplyMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newItems: MediaItem[] = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }))
    setReplyMedia((prev) => [...prev, ...newItems])
  }

  const removeReplyMedia = (index: number) => {
    setReplyMedia((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReplySubmit = () => {
    if (!replyText.trim() && replyMedia.length === 0) return
    onAddReply(comment.id, replyText, replyMedia)
    setReplyText('')
    setReplyMedia([])
    setIsReplying(false)
  }

  const handleEditSubmit = () => {
    if (!editText.trim() || !onEditComment) return
    onEditComment(comment.id, editText)
    setIsEditing(false)
    toast.success('Comment updated!')
  }

  const handleDelete = () => {
    if (!onDeleteComment) return
    onDeleteComment(comment.id)
    toast.success('Comment deleted')
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className={`relative my-3.5 group ${isCollapsed ? 'pb-4' : ''}`}>
      {/* Straight Vertical Thread Line directly beneath profile avatar image (NO BLUE HOVER) */}
      {!isCollapsed && (hasReplies || isReplying) && (
        <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-[#e5e5e7]" />
      )}

      {/* Collapse/Expand (-)/(+) Toggle Icon AFTER PROFILE IMAGE AT top-[26px] */}
      {(hasReplies || isReplying) && (
        <div className="absolute left-0 top-[26px] w-6 flex justify-center z-20 pointer-events-auto">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white rounded-full text-[#86868b] hover:text-[#1d1d1f] cursor-pointer flex items-center justify-center select-none"
            title={isCollapsed ? 'Expand comment thread' : 'Collapse comment thread'}
          >
            {isCollapsed ? (
              <PlusCircle size={14} className="text-[#0066cc] fill-white" />
            ) : (
              <MinusCircle size={14} className="text-[#86868b] fill-white hover:text-[#1d1d1f]" />
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10">
            {comment.author.charAt(0)}
          </div>
          <span className="font-extrabold text-[#1d1d1f] flex items-center">{comment.author}</span>
          {isOP && (
            <span className="px-2 py-0.5 rounded-full bg-[#0066cc] text-white text-[10px] font-semibold flex items-center">
              OP
            </span>
          )}
          {(comment.role === 'tutor' || comment.isVerified) && (
            <span className="px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-semibold flex items-center">
              Tutor
            </span>
          )}
          <span className="text-[#86868b] text-[11px] flex items-center">• {comment.time}</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="pl-8 space-y-2 mt-1">
          {/* Text Content / Inline Edit Mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2 bg-[#f8f8fa] p-3 rounded-2xl border border-[#e5e5e7]">
              <textarea
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e5e5e7] text-xs outline-none focus:border-[#0066cc] resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditText(comment.text)
                  }}
                  className="px-3 py-1 rounded-full text-xs text-[#6e6e73] hover:bg-[#e4e4e7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editText.trim()}
                  className="px-4 py-1 rounded-full bg-[#0066cc] text-white text-xs font-bold hover:bg-[#0077ed] disabled:opacity-30 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#1d1d1f] leading-relaxed font-sans pt-0.5 break-words [overflow-wrap:anywhere]">
              {comment.text}
            </p>
          )}

          {/* Attached Media */}
          {renderMediaGrid(comment.media)}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-[#86868b] pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-full px-2.5 py-0.5 border border-[#e5e5e7]">
              <button
                onClick={() => handleVote('up')}
                className={`hover:text-[#0066cc] cursor-pointer flex items-center gap-1 transition-colors ${
                  userVote === 'up' ? 'text-[#0066cc] font-extrabold' : 'text-[#6e6e73]'
                }`}
                title="Like"
              >
                <ThumbsUp size={12} className={userVote === 'up' ? 'fill-[#0066cc]' : ''} />
              </button>
              <span className="font-extrabold text-xs text-[#1d1d1f] px-1">{upvotes}</span>
              <button
                onClick={() => handleVote('down')}
                className={`hover:text-red-500 cursor-pointer flex items-center gap-1 transition-colors ${
                  userVote === 'down' ? 'text-red-500 font-extrabold' : 'text-[#6e6e73]'
                }`}
                title="Dislike"
              >
                <ThumbsDown size={12} className={userVote === 'down' ? 'fill-red-500' : ''} />
              </button>
            </div>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1"
            >
              <MessageCircle size={12} />
              <span>Reply</span>
            </button>

            {isOwnComment && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1 text-[#6e6e73]"
                  title="Edit comment"
                >
                  <Pencil size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 text-[#6e6e73]"
                  title="Delete comment"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </>
            )}

            <button className="hover:text-[#0066cc] transition-colors cursor-pointer">Share</button>
          </div>

          {/* Inline Reply Form with Image & Video Attachments */}
          {isReplying && (
            <div className="mt-3 space-y-2 bg-[#f8f8fa] p-3 rounded-2xl border border-[#e5e5e7] animate-in fade-in duration-150">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.author}...`}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e5e5e7] text-xs outline-none focus:border-[#0066cc] resize-none"
              />

              {/* Media Attachments Preview */}
              {replyMedia.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {replyMedia.map((item, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#e0e0e4] bg-black shrink-0">
                      {item.type === 'image' ? (
                        <img src={item.url} alt="Attached" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeReplyMedia(idx)}
                        className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/30 shadow-xs select-none"
                        title="Remove media"
                      >
                        <X size={9} className="stroke-[3]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {/* Media Upload Buttons */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#e0e0e4] text-[11px] font-semibold text-[#525252] hover:bg-[#f0f0f2] cursor-pointer transition-all">
                    <ImageIcon size={12} className="text-[#0066cc]" />
                    <span>Image / Video</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleReplyMediaUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsReplying(false)
                      setReplyMedia([])
                    }}
                    className="px-3 py-1 rounded-full text-xs text-[#6e6e73] hover:bg-[#e4e4e7] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() && replyMedia.length === 0}
                    className="px-4 py-1 rounded-full bg-[#0066cc] text-white text-xs font-bold hover:bg-[#0077ed] disabled:opacity-30 cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nested Child Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3.5">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  threadAuthor={threadAuthor}
                  renderMediaGrid={renderMediaGrid}
                  onAddReply={onAddReply}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FALLBACK_CONTRIBUTORS = [
  { rank: 1, name: 'Dr. Alex Vance', karma: 3450, solved: 142, badge: 'Verified Master' },
  { rank: 2, name: 'Prof. Sarah Jenkins', karma: 2890, solved: 118, badge: 'Physics Scholar' },
  { rank: 3, name: 'Manan Vasani', karma: 2150, solved: 86, badge: 'Top Contributor' },
  { rank: 4, name: 'Elena Rostova', karma: 1840, solved: 72, badge: 'Algorithmic Lead' },
]

export default function CommunityPage() {
  const { user } = useAuthStore()
  const [threads, setThreads] = useState<DoubtThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterMode, setFilterMode] = useState<'all' | 'unsolved' | 'solved'>('all')

  // ─── Fetch threads from backend on mount ─────────────────────
  const loadThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchCommunityThreads()
      if (res.success && res.data.length > 0) {
        setThreads(res.data.map((t: any) => mapApiThread(t, user?._id)))
      } else {
        // Fallback to demo data if DB is empty
        setThreads(FALLBACK_THREADS)
      }
    } catch {
      setThreads(FALLBACK_THREADS)
    } finally {
      setIsLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  // Modal & Form states
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [isCreateFormExpanded, setIsCreateFormExpanded] = useState(false)
  const [activeThread, setActiveThread] = useState<DoubtThread | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('Mathematics')
  const [newTags, setNewTags] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCode, setNewCode] = useState('')

  // Unlimited Media Attachment States
  const [threadMedia, setThreadMedia] = useState<MediaItem[]>([])
  const [commentMedia, setCommentMedia] = useState<MediaItem[]>([])

  // Lightbox Media Viewer State
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null)

  // Prevent page vertical scrollbar ("slider") and layout shift when Lightbox or Post Modal is open
  React.useEffect(() => {
    if (lightbox || isPostModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [lightbox, isPostModalOpen])

  // Keyboard Navigation for Lightbox Modal (Left/Right Arrow keys, '<' / '>', Escape)
  React.useEffect(() => {
    if (!lightbox || lightbox.items.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === '<' || e.key === ',') {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index - 1 + prev.items.length) % prev.items.length,
              }
            : null
        )
      } else if (e.key === 'ArrowRight' || e.key === '>' || e.key === '.') {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index + 1) % prev.items.length,
              }
            : null
        )
      } else if (e.key === 'Escape') {
        setLightbox(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightbox])

  // New Comment state
  const [commentText, setCommentText] = useState('')

  // Pending files to upload when submitting (stored alongside blob preview URLs)
  const [pendingThreadFiles, setPendingThreadFiles] = useState<File[]>([])
  const [pendingCommentFiles, setPendingCommentFiles] = useState<File[]>([])

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, isThread: boolean) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    // Create local blob previews immediately for instant UI feedback
    const previewItems: MediaItem[] = fileArray.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
    }))

    if (isThread) {
      setThreadMedia((prev) => [...prev, ...previewItems])
      setPendingThreadFiles((prev) => [...prev, ...fileArray])
    } else {
      setCommentMedia((prev) => [...prev, ...previewItems])
      setPendingCommentFiles((prev) => [...prev, ...fileArray])
    }
    toast.success(`Attached ${fileArray.length} media file(s)!`)
  }

  /** Upload pending files to backend, returns Cloudinary URLs or falls back to blob URLs */
  const uploadPendingFiles = async (files: File[], fallbackMedia: MediaItem[]): Promise<MediaItem[]> => {
    if (files.length === 0) return fallbackMedia
    try {
      const res = await uploadMedia(files)
      if (res.success && res.data) {
        return res.data.map((m: any) => ({ url: m.url, type: m.type }))
      }
    } catch {
      console.warn('[Upload] Cloudinary upload failed — using local blob URLs')
    }
    return fallbackMedia
  }

  const renderMediaGrid = (items?: MediaItem[]) => {
    if (!items || items.length === 0) return null

    const total = items.length

    // 1 Item
    if (total === 1) {
      const m = items[0]
      return (
        <div className="my-2.5 max-w-[200px]">
          <div
            onClick={() => setLightbox({ items, index: 0 })}
            className="relative rounded-2xl overflow-hidden bg-black/90 cursor-pointer aspect-square"
          >
            {m.type === 'video' ? (
              <video src={m.url} controls className="w-full h-full object-cover" />
            ) : (
              <img src={m.url} alt="Attached Media" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      )
    }

    // 2 Items
    if (total === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 my-2.5 max-w-[260px]">
          {items.map((m, idx) => (
            <div
              key={idx}
              onClick={() => setLightbox({ items, index: idx })}
              className="relative rounded-xl overflow-hidden bg-black/90 aspect-square cursor-pointer"
            >
              {m.type === 'video' ? (
                <video src={m.url} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <img src={m.url} alt="Attached" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )
    }

    // 3 Items
    if (total === 3) {
      return (
        <div className="grid grid-cols-3 gap-1.5 my-2.5 max-w-[280px]">
          {items.map((m, idx) => (
            <div
              key={idx}
              onClick={() => setLightbox({ items, index: idx })}
              className="relative rounded-xl overflow-hidden bg-black/90 aspect-square cursor-pointer"
            >
              {m.type === 'video' ? (
                <video src={m.url} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <img src={m.url} alt="Attached" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )
    }

    // 4 or More Items (WhatsApp Collage Grid: 2x2 square tiles, no borders, no hover scale, +N overlay)
    const displayedItems = items.slice(0, 4)
    const extraCount = total - 3 // e.g. 5 total -> 1st, 2nd, 3rd, and 4th slot gets "+2"

    return (
      <div className="grid grid-cols-2 gap-1.5 my-2.5 max-w-[260px] aspect-square rounded-2xl overflow-hidden">
        {displayedItems.map((m, idx) => {
          const isLastTile = idx === 3 && total > 4
          return (
            <div
              key={idx}
              onClick={() => setLightbox({ items, index: idx })}
              className="relative overflow-hidden bg-black cursor-pointer h-full w-full"
            >
              {m.type === 'video' ? (
                <video src={m.url} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <img src={m.url} alt="Attached" className="w-full h-full object-cover" />
              )}

              {/* Overlay +N for remaining images */}
              {isLastTile && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-extrabold text-xl select-none">
                  +{extraCount}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { toast.error('Please log in to vote'); return }
    // Optimistic local update
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
    if (activeThread && activeThread.id === id) {
      setActiveThread((prev) => {
        if (!prev) return prev
        const newVote = prev.userVote === 'up' ? null : 'up'
        const diff = newVote === 'up' ? (prev.userVote === 'down' ? 2 : 1) : -1
        return { ...prev, userVote: newVote, upvotes: prev.upvotes + diff }
      })
    }
    try { if (isRealId(id)) await voteCommunityThread(id, 'up') } catch { /* optimistic is fine */ }
  }

  const handleDownvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { toast.error('Please log in to vote'); return }
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
    if (activeThread && activeThread.id === id) {
      setActiveThread((prev) => {
        if (!prev) return prev
        const newVote = prev.userVote === 'down' ? null : 'down'
        const diff = newVote === 'down' ? (prev.userVote === 'up' ? -2 : -1) : 1
        return { ...prev, userVote: newVote, upvotes: prev.upvotes + diff }
      })
    }
    try { if (isRealId(id)) await voteCommunityThread(id, 'down') } catch { /* optimistic is fine */ }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter a thread title and description')
      return
    }
    if (!user) {
      toast.error('Please log in to post a doubt thread')
      return
    }

    const tagList = newTags
      ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [newSubject]

    try {
      // Upload pending media files to Cloudinary first
      const uploadedMedia = await uploadPendingFiles(pendingThreadFiles, threadMedia)

      const res = await createCommunityThread({
        title: newTitle,
        content: newContent,
        subject: newSubject,
        tags: tagList,
        codeSnippet: newCode.trim() || undefined,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      })

      if (res.success) {
        const mapped = mapApiThread(res.data, user._id)
        setThreads((prev) => [mapped, ...prev])
        toast.success('Doubt Thread Posted! Socratic AI is thinking...')
      } else {
        toast.error('Failed to post thread')
      }
    } catch {
      // Fallback: add locally so the UI isn't broken
      const fallbackThread: DoubtThread = {
        id: `thread-${Date.now()}`,
        title: newTitle,
        subject: newSubject,
        tags: tagList,
        author: user.fullName || user.name || 'You',
        time: 'Just now',
        upvotes: 1,
        userVote: 'up',
        isSolved: false,
        hasAiAnswer: false,
        content: newContent,
        codeSnippet: newCode.trim() || undefined,
        media: threadMedia.length > 0 ? threadMedia : undefined,
        commentsCount: 0,
        comments: [],
      }
      setThreads((prev) => [fallbackThread, ...prev])
      toast.error('Could not reach server — thread saved locally')
    }

    setIsPostModalOpen(false)
    setIsCreateFormExpanded(false)
    setNewTitle('')
    setNewContent('')
    setNewCode('')
    setNewTags('')
    setThreadMedia([])
    setPendingThreadFiles([])
  }

  const handleAddComment = async () => {
    if ((!commentText.trim() && commentMedia.length === 0) || !activeThread) return
    if (!user) { toast.error('Please log in to comment'); return }

    try {
      if (!isRealId(activeThread.id)) throw new Error('Demo thread')

      // Upload pending media files first
      const uploadedMedia = await uploadPendingFiles(pendingCommentFiles, commentMedia)

      const res = await createCommunityComment(activeThread.id, {
        text: commentText,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      })

      if (res.success) {
        const mappedComment = mapApiComment(res.data)
        const updated = {
          ...activeThread,
          commentsCount: activeThread.commentsCount + 1,
          comments: [...activeThread.comments, mappedComment],
        }
        setActiveThread(updated)
        setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updated : t)))
        toast.success('+15 Karma! Comment posted successfully.')
      }
    } catch {
      // Fallback: add locally
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        author: user.fullName || user.name || 'You',
        role: 'student',
        text: commentText,
        time: 'Just now',
        upvotes: 0,
        media: commentMedia.length > 0 ? commentMedia : undefined,
      }
      const updated = {
        ...activeThread,
        commentsCount: activeThread.commentsCount + 1,
        comments: [...activeThread.comments, newComment],
      }
      setActiveThread(updated)
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updated : t)))
      toast.error('Comment saved locally — server unreachable')
    }

    setCommentText('')
    setCommentMedia([])
    setPendingCommentFiles([])
  }

  const handleNestedReply = async (parentId: string, text: string, media?: MediaItem[]) => {
    if (!activeThread) return
    if (!user) { toast.error('Please log in to reply'); return }

    try {
      if (!isRealId(activeThread.id)) throw new Error('Demo thread')

      const res = await createCommunityComment(activeThread.id, {
        text,
        parentComment: parentId,
        media: media && media.length > 0 ? media : undefined,
      })

      if (res.success) {
        const mappedReply = mapApiComment(res.data)
        const updatedComments = addNestedReply(activeThread.comments, parentId, mappedReply)
        const updatedThread = {
          ...activeThread,
          commentsCount: activeThread.commentsCount + 1,
          comments: updatedComments,
        }
        setActiveThread(updatedThread)
        setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updatedThread : t)))
        toast.success('+15 Karma! Reply posted to comment chain.')
      }
    } catch {
      // Fallback local
      const newReply: Comment = {
        id: `c-${Date.now()}`,
        author: user.fullName || user.name || 'You',
        role: 'student',
        text,
        time: 'Just now',
        upvotes: 0,
        media: media && media.length > 0 ? media : undefined,
      }
      const updatedComments = addNestedReply(activeThread.comments, parentId, newReply)
      const updatedThread = {
        ...activeThread,
        commentsCount: activeThread.commentsCount + 1,
        comments: updatedComments,
      }
      setActiveThread(updatedThread)
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updatedThread : t)))
      toast.error('Reply saved locally — server unreachable')
    }
  }

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!activeThread) return
    // Optimistic update
    const updatedComments = editNestedComment(activeThread.comments, commentId, newText)
    const updatedThread = {
      ...activeThread,
      comments: updatedComments,
    }
    setActiveThread(updatedThread)
    setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updatedThread : t)))
    try { if (isRealId(commentId)) await editCommunityComment(commentId, newText) } catch { /* optimistic is fine */ }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!activeThread) return
    // Optimistic update
    const updatedComments = deleteNestedComment(activeThread.comments, commentId)
    const updatedThread = {
      ...activeThread,
      commentsCount: Math.max(0, activeThread.commentsCount - 1),
      comments: updatedComments,
    }
    setActiveThread(updatedThread)
    setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updatedThread : t)))
    try { if (isRealId(commentId)) await deleteCommunityComment(commentId) } catch { /* optimistic is fine */ }
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

        {/* Full-Width Doubt Feed Container */}
        <div className="w-full space-y-4">
            {activeThread ? (
              /* INLINE EXPANDED THREAD VIEW DIRECTLY IN PAGE FEED (NO MODAL / NO OVERLAY) */
              <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 md:p-8 shadow-sm space-y-6">
                {/* Thread Header (Unified Author & Category Bar) */}
                <div className="flex items-center justify-between border-b border-[#e5e5e7] pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveThread(null)}
                      className="w-9 h-9 rounded-full bg-[#f0f0f2] hover:bg-[#e4e4e7] text-[#1d1d1f] transition-colors cursor-pointer select-none flex items-center justify-center"
                      title="Back to Doubts List"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066cc] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {activeThread.author.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#1d1d1f]">
                        {activeThread.author}
                      </span>
                      {activeThread.author === 'You' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0066cc]/10 text-[#0066cc] font-extrabold">YOU</span>
                      )}
                      <span className="text-[#86868b]">• {activeThread.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeThread.isSolved && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
                        <CheckCircle2 size={12} /> Solved
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f0f0f2] text-[#6e6e73] text-[10px] font-semibold">
                      {activeThread.subject}
                    </span>
                  </div>
                </div>

                {/* Title & Full Content */}
                <div className="space-y-4">
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#1d1d1f] leading-snug break-words [overflow-wrap:anywhere]">
                    {activeThread.title}
                  </h1>
                  <p className="text-sm text-[#2d2d30] leading-relaxed whitespace-pre-line font-sans break-words [overflow-wrap:anywhere]">
                    {activeThread.content}
                  </p>

                  {activeThread.codeSnippet && (
                    <div className="rounded-2xl bg-[#0f141c] p-5 border border-[#1e2638] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[#86868b] uppercase tracking-wider font-mono">
                        <span>Code / Equation Preview</span>
                        <Code size={13} />
                      </div>
                      <pre className="text-xs font-mono text-[#4d9fff] overflow-x-auto leading-relaxed">
                        <code>{activeThread.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Render Thread Attached Images & Videos */}
                  {renderMediaGrid(activeThread.media)}
                </div>

                {/* Vote & Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#f0f0f2]">
                  <div className="flex items-center gap-1.5 bg-[#f0f0f4] rounded-full px-3.5 py-1.5 border border-[#e0e0e4]">
                    <button
                      onClick={(e) => handleUpvote(activeThread.id, e)}
                      className={`hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1 ${
                        activeThread.userVote === 'up' ? 'text-[#0066cc] font-extrabold' : 'text-[#6e6e73]'
                      }`}
                      title="Like"
                    >
                      <ThumbsUp size={13} className={activeThread.userVote === 'up' ? 'fill-[#0066cc]' : ''} />
                    </button>
                    <span className="font-extrabold text-xs text-[#1d1d1f] px-2">{activeThread.upvotes}</span>
                    <button
                      onClick={(e) => handleDownvote(activeThread.id, e)}
                      className={`hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1 ${
                        activeThread.userVote === 'down' ? 'text-red-500 font-extrabold' : 'text-[#6e6e73]'
                      }`}
                      title="Dislike"
                    >
                      <ThumbsDown size={13} className={activeThread.userVote === 'down' ? 'fill-red-500' : ''} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f0f0f4] border border-[#e0e0e4] text-xs font-bold text-[#525252]">
                    <MessageCircle size={14} />
                    <span>{activeThread.comments.length} Comments</span>
                  </div>
                </div>

                {/* Join The Conversation Box */}
                <div className="bg-[#f8f8fa] border border-[#e0e0e4] rounded-3xl p-4 space-y-3 shadow-2xs">
                  <span className="text-xs font-bold text-[#1d1d1f] block">Join the conversation</span>
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts or Socratic guidance?"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-[#e0e0e4] text-xs outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 resize-none shadow-2xs"
                  />

                  {/* Comment Media Previews */}
                  {commentMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {commentMedia.map((m, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#e0e0e4] bg-black shrink-0">
                          {m.type === 'video' ? (
                            <video src={m.url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={m.url} alt="Attached" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => setCommentMedia((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/30 shadow-xs select-none"
                            title="Remove media"
                          >
                            <X size={9} className="stroke-[3]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#e0e0e4] text-xs font-semibold text-[#525252] hover:bg-[#f5f5f7] cursor-pointer transition-all shadow-2xs">
                      <ImageIcon size={14} className="text-[#0066cc]" />
                      <span>Attach Images / Videos</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => handleMediaUpload(e, false)}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() && commentMedia.length === 0}
                      className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] transition-all disabled:opacity-30 cursor-pointer shadow-md shadow-[#0066cc]/20"
                    >
                      Comment
                    </button>
                  </div>
                </div>

                {/* Threaded Comments */}
                <div className="space-y-4 pt-4 border-t border-[#e5e5e7]">
                  <div className="flex items-center justify-between text-xs text-[#86868b] font-bold uppercase tracking-wider">
                    <span>Comments & Socratic Answers ({activeThread.comments.length})</span>
                    <span>Sorted by: Best</span>
                  </div>

                  <div className="space-y-2">
                    {activeThread.comments.map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        threadAuthor={activeThread.author}
                        renderMediaGrid={renderMediaGrid}
                        onAddReply={handleNestedReply}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Inline Post Doubt Thread Accordion (FAQ Style) */}
                <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xs hover:shadow-md transition-all overflow-hidden">
                  {/* Accordion Header Bar */}
                  <div
                    onClick={() => setIsCreateFormExpanded(!isCreateFormExpanded)}
                    className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer select-none group bg-white hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-[#0066cc] group-hover:text-white transition-all">
                        <Plus size={16} />
                      </div>
                      <span className="text-xs font-bold text-[#1d1d1f] truncate">
                        Ask an Academic Doubt / Post Thread
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-[#86868b] group-hover:text-[#1d1d1f] transition-colors hidden sm:inline">
                        {isCreateFormExpanded ? 'Click to collapse' : 'Click to expand'}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-[#f5f5f7] group-hover:bg-[#e4e4e7] text-[#6e6e73] flex items-center justify-center transition-all">
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-300 ${
                            isCreateFormExpanded ? 'rotate-180 text-[#0066cc]' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accordion Body Panel (Opens below header) */}
                  {isCreateFormExpanded && (
                    <div className="p-5 md:p-6 border-t border-[#f0f0f2] bg-white space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#6e6e73] mb-1">Subject</label>
                          <select
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs font-medium outline-none focus:border-[#0066cc]"
                          >
                            <option value="Mathematics">Mathematics</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Engineering">Engineering</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#6e6e73] mb-1">Tags (Comma Separated)</label>
                          <input
                            type="text"
                            value={newTags}
                            onChange={(e) => setNewTags(e.target.value)}
                            placeholder="Calculus, Integrals, Limits"
                            className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs outline-none focus:border-[#0066cc]"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Thread Title (e.g. How do I evaluate \int x^2 \sin(x) dx?)"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs font-semibold outline-none focus:border-[#0066cc]"
                        />
                      </div>

                      <div>
                        <textarea
                          rows={3}
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder="Describe your roadblock clearly. Mention what steps you have already tried..."
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e2] text-xs outline-none focus:border-[#0066cc] resize-none"
                        />
                      </div>

                      {/* Media Previews */}
                      {threadMedia.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {threadMedia.map((m, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#e0e0e4] bg-black shrink-0">
                              {m.type === 'video' ? (
                                <video src={m.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={m.url} alt="Attached" className="w-full h-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => setThreadMedia((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/30 shadow-xs select-none"
                                title="Remove media"
                              >
                                <X size={9} className="stroke-[3]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e2] text-xs font-semibold text-[#525252] hover:bg-[#e8e8ea] cursor-pointer transition-all">
                          <ImageIcon size={14} className="text-[#0066cc]" />
                          <span>Attach Images / Videos</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => handleMediaUpload(e, true)}
                            className="hidden"
                          />
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsCreateFormExpanded(false)}
                            className="px-4 py-2 rounded-full text-xs font-semibold text-[#6e6e73] hover:bg-[#f0f0f2] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCreatePost}
                            disabled={!newTitle.trim() || !newContent.trim()}
                            className="px-6 py-2 rounded-full bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] transition-all disabled:opacity-30 cursor-pointer shadow-md shadow-[#0066cc]/20"
                          >
                            Post Thread
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Doubts Feed */}
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
                  onClick={async () => {
                    // Fetch full thread with comments from API
                    try {
                      const res = await fetchCommunityThread(thread.id)
                      if (res?.success) {
                        setActiveThread(mapApiThread(res.data, user?._id))
                      } else {
                        setActiveThread(thread)
                      }
                    } catch {
                      setActiveThread(thread)
                    }
                  }}
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

                  {/* Attached Media */}
                  {renderMediaGrid(thread.media)}

                  {/* Thread Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f2] text-xs text-[#86868b]">
                    <div className="flex items-center gap-4">
                      {/* Karma Vote Buttons */}
                      <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-full px-3 py-1 border border-[#e5e5e7]">
                        <button
                          onClick={(e) => handleUpvote(thread.id, e)}
                          className={`hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1 ${
                            thread.userVote === 'up' ? 'text-[#0066cc] font-bold' : 'text-[#6e6e73]'
                          }`}
                          title="Like"
                        >
                          <ThumbsUp size={13} className={thread.userVote === 'up' ? 'fill-[#0066cc]' : ''} />
                        </button>
                        <span className="font-extrabold text-[#1d1d1f] px-1.5 text-xs">{thread.upvotes}</span>
                        <button
                          onClick={(e) => handleDownvote(thread.id, e)}
                          className={`hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1 ${
                            thread.userVote === 'down' ? 'text-red-500 font-bold' : 'text-[#6e6e73]'
                          }`}
                          title="Dislike"
                        >
                          <ThumbsDown size={13} className={thread.userVote === 'down' ? 'fill-red-500' : ''} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        <span>{thread.commentsCount} replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>



      {/* Lightbox / Fullscreen Media Viewer Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
          >
            <X size={20} />
          </button>

          {/* Previous / Next Controls anchored to fixed viewport edges */}
          {lightbox.items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index - 1 + prev.items.length) % prev.items.length,
                        }
                      : null
                  )
                }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 select-none shadow-xl z-50"
                title="Previous"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index + 1) % prev.items.length,
                        }
                      : null
                  )
                }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 select-none shadow-xl z-50"
                title="Next"
              >
                <ArrowRight size={20} />
              </button>
            </>
          )}

          {/* Counter Badge fixed in backdrop area outside image frame */}
          {lightbox.items.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 text-white text-xs font-extrabold border border-white/20 select-none shadow-xl z-50">
              {lightbox.index + 1} / {lightbox.items.length}
            </div>
          )}

          <div
            className="relative max-w-4xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.items[lightbox.index].type === 'video' ? (
              <video
                src={lightbox.items[lightbox.index].url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              />
            ) : (
              <img
                src={lightbox.items[lightbox.index].url}
                alt="Enlarged view"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
