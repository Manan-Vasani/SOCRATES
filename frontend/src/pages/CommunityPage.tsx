import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  Code,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  MessageCircle,
  MessageSquare,
  MinusCircle,
  Network,
  Pencil,
  Percent,
  Plus,
  PlusCircle,
  Search,
  Share2,
  ShieldCheck,
  Sigma,
  Sparkles,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
  X
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  createCommunityComment,
  createCommunityThread,
  deleteCommunityComment,
  editCommunityComment,
  fetchAllTutors,
  fetchCommunityThread,
  fetchCommunityThreads,
  uploadMedia,
  voteCommunityThread,
} from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getUnifiedSubjectList } from '../utils/subjectRegistry'

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
    id: c._id || c.id,
    author: c.isAiGenerated || c.role === 'ai' ? 'Socrates AI Assistant' : (c.author?.fullName || c.author?.name || 'Anonymous'),
    role: c.isAiGenerated ? 'ai' : (c.role || 'student'),
    avatar: c.author?.avatar || c.author?.profileImage || undefined,
    text: c.content || c.text || '',
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

const FALLBACK_THREADS: DoubtThread[] = []

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

  const { user } = useAuthStore()
  const isOP = comment.author === threadAuthor
  const isOwnComment =
    comment.author === 'You' ||
    Boolean(user && (comment.author === user.fullName || comment.author === user.name))

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

  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const handleReplySubmit = async () => {
    if (!replyText.trim() && replyMedia.length === 0) return
    setIsSubmittingReply(true)
    try {
      await onAddReply(comment.id, replyText, replyMedia)
      setReplyText('')
      setReplyMedia([])
      setIsReplying(false)
    } finally {
      setIsSubmittingReply(false)
    }
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
          {comment.avatar || (user && (comment.author === (user.fullName || user.name) || comment.author === 'You') && user.avatar) ? (
            <img
              src={comment.avatar || user?.avatar}
              alt={comment.author}
              className="w-6 h-6 rounded-full object-cover shrink-0 z-10 border border-[#e5e5e7] shadow-2xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10">
              {comment.author.charAt(0)}
            </div>
          )}
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
            {/* Reddit / Apple Pill Upvote/Downvote Bar */}
            <div className="flex items-center bg-[#f5f5f7] border border-[#e5e5e7] rounded-full px-2 py-0.5 gap-1">
              <button
                onClick={() => handleVote('up')}
                className="hover:text-[#0066cc] cursor-pointer flex items-center justify-center transition-colors text-[#6e6e73]"
                title="Like"
              >
                <ThumbsUp size={12} className={userVote === 'up' ? 'fill-[#0066cc] text-[#0066cc]' : ''} />
              </button>
              <span className="min-w-[1.25rem] text-center font-extrabold text-xs text-[#1d1d1f] inline-block">{upvotes}</span>
              <button
                onClick={() => handleVote('down')}
                className="hover:text-red-500 cursor-pointer flex items-center justify-center transition-colors text-[#6e6e73]"
                title="Dislike"
              >
                <ThumbsDown size={12} className={userVote === 'down' ? 'fill-red-500 text-red-500' : ''} />
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

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success('Thread link copied to clipboard!')
              }}
              className="hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1 text-[#6e6e73]"
              title="Share comment link"
            >
              <Share2 size={12} />
              <span>Share</span>
            </button>
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
                    disabled={isSubmittingReply || (!replyText.trim() && replyMedia.length === 0)}
                    className="px-4 py-1 rounded-full bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-1.5 select-none"
                  >
                    {isSubmittingReply ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-white shrink-0" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Reply</span>
                    )}
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

const getTagIcon = (tag: string) => {
  const t = tag.toLowerCase()
  if (t.includes('algor') || t.includes('struct') || t.includes('tree') || t.includes('graph') || t.includes('net')) {
    return <Network size={14} className="text-[#0066cc] shrink-0" />
  }
  if (t.includes('python') || t.includes('term') || t.includes('bash')) {
    return <Terminal size={14} className="text-[#0066cc] shrink-0" />
  }
  if (t.includes('c++') || t.includes('code') || t.includes('react') || t.includes('web') || t.includes('dev')) {
    return <Code2 size={14} className="text-[#0066cc] shrink-0" />
  }
  if (t.includes('math') || t.includes('calc') || t.includes('int') || t.includes('algeb') || t.includes('geom') || t.includes('olym')) {
    return <Sigma size={14} className="text-[#0066cc] shrink-0" />
  }
  if (t.includes('phys') || t.includes('quant') || t.includes('mech') || t.includes('thermo') || t.includes('electro')) {
    return <Atom size={14} className="text-[#0066cc] shrink-0" />
  }
  if (t.includes('chem') || t.includes('organ') || t.includes('inorgan') || t.includes('react')) {
    return <FlaskConical size={14} className="text-[#0066cc] shrink-0" />
  }
  if (t.includes('stat') || t.includes('prob') || t.includes('data')) {
    return <Percent size={14} className="text-[#0066cc] shrink-0" />
  }
  return <Cpu size={14} className="text-[#0066cc] shrink-0" />
}

const getSubjectFilterIcon = (subj: string, isActive: boolean = false, size: number = 13) => {
  const colorClass = isActive ? 'text-white' : 'text-[#0066cc]'
  const lower = (subj || '').toLowerCase().trim()

  if (lower === 'all') return <Layers size={size} className={`${colorClass} shrink-0`} />
  if (lower.includes('python')) return <Terminal size={size} className={`${colorClass} shrink-0`} />
  if (
    lower.includes('algebra') ||
    lower.includes('math') ||
    lower.includes('calculus') ||
    lower.includes('geometry') ||
    lower.includes('trigonometry') ||
    lower.includes('discrete')
  ) {
    return <Sigma size={size} className={`${colorClass} shrink-0`} />
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
    return <Sparkles size={size} className={`${colorClass} shrink-0`} />
  }
  if (
    lower.includes('structure') ||
    lower.includes('algorithm') ||
    lower.includes('data structure') ||
    lower.includes('sorting') ||
    lower.includes('tree') ||
    lower.includes('graph')
  ) {
    return <Network size={size} className={`${colorClass} shrink-0`} />
  }
  if (
    lower.includes('database') ||
    lower.includes('sql') ||
    lower.includes('mongo') ||
    lower.includes('postgres') ||
    lower.includes('data warehouse')
  ) {
    return <Database size={size} className={`${colorClass} shrink-0`} />
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
    return <Code2 size={size} className={`${colorClass} shrink-0`} />
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
    return <Atom size={size} className={`${colorClass} shrink-0`} />
  }
  if (
    lower.includes('web') ||
    lower.includes('network') ||
    lower.includes('cloud') ||
    lower.includes('internet') ||
    lower.includes('devops')
  ) {
    return <Globe size={size} className={`${colorClass} shrink-0`} />
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
    return <Cpu size={size} className={`${colorClass} shrink-0`} />
  }
  if (
    lower.includes('chem') ||
    lower.includes('organic') ||
    lower.includes('inorganic') ||
    lower.includes('biochem') ||
    lower.includes('bio') ||
    lower.includes('mcat')
  ) {
    return <FlaskConical size={size} className={`${colorClass} shrink-0`} />
  }
  if (
    lower.includes('security') ||
    lower.includes('cyber') ||
    lower.includes('crypto') ||
    lower.includes('ethical') ||
    lower.includes('infosec')
  ) {
    return <ShieldCheck size={size} className={`${colorClass} shrink-0`} />
  }
  if (
    lower.includes('stat') ||
    lower.includes('probability') ||
    lower.includes('analytics') ||
    lower.includes('data science') ||
    lower.includes(' r') ||
    lower === 'r'
  ) {
    return <BarChart2 size={size} className={`${colorClass} shrink-0`} />
  }
  return <BookOpen size={size} className={`${colorClass} shrink-0`} />
}

const DEFAULT_SUBJECTS = [
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
]

const FALLBACK_CONTRIBUTORS = [
  { rank: 1, name: 'Dr. Alex Vance', karma: 3450, solved: 142, badge: 'Verified Master' },
  { rank: 2, name: 'Prof. Sarah Jenkins', karma: 2890, solved: 118, badge: 'Physics Scholar' },
  { rank: 3, name: 'Manan Vasani', karma: 2150, solved: 86, badge: 'Top Contributor' },
  { rank: 4, name: 'Elena Rostova', karma: 1840, solved: 72, badge: 'Algorithmic Lead' },
]

export default function CommunityPage() {
  const { user } = useAuthStore()

  // Fetch backend tutor list for unified subject registry
  const [tutorsList, setTutorsList] = useState<any[]>([])

  useEffect(() => {
    fetchAllTutors().then((data) => {
      if (data && Array.isArray(data)) setTutorsList(data)
    })
  }, [])

  // Combined set of Tutors-page default subjects + backend tutor subjects + student enrolled subjects
  const allSubjects = useMemo(() => {
    return getUnifiedSubjectList(tutorsList, user, false)
  }, [tutorsList, user])

  const communityFilterSubjects = useMemo(() => {
    return getUnifiedSubjectList(tutorsList, user, true)
  }, [tutorsList, user])

  const [threads, setThreads] = useState<DoubtThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterMode, setFilterMode] = useState<'all' | 'unsolved' | 'solved'>('all')

  // ─── Fetch threads from backend on mount ─────────────────────
  const loadThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchCommunityThreads({
        subject: activeSubject !== 'All' ? activeSubject : undefined,
        filter: filterMode !== 'all' ? filterMode : undefined,
        search: searchQuery || undefined,
      })
      const threadList = res?.threads || res?.data || []
      if (res?.success && Array.isArray(threadList) && threadList.length > 0) {
        setThreads(threadList.map((t: any) => mapApiThread(t, user?._id)))
      } else if (res?.success && Array.isArray(threadList) && threadList.length === 0) {
        setThreads([])
      } else {
        setThreads(FALLBACK_THREADS)
      }
    } catch {
      setThreads(FALLBACK_THREADS)
    } finally {
      setIsLoading(false)
    }
  }, [user?._id, activeSubject, filterMode, searchQuery])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  // Modal & Form states
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [isCreateFormExpanded, setIsCreateFormExpanded] = useState(false)
  const [activeThread, setActiveThread] = useState<DoubtThread | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('Algorithms')
  const [newTags, setNewTags] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCode, setNewCode] = useState('')

  const handleAddTag = (tagToAdd?: string) => {
    const raw = (typeof tagToAdd === 'string' ? tagToAdd : tagInput).trim()
    if (!raw) return
    const clean = raw.replace(/^#+/, '').trim()
    if (!clean) return
    const formatted = `#${clean}`

    const currentList = newTags ? newTags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const normalizedList = currentList.map((t) => (t.startsWith('#') ? t : `#${t}`))

    if (!normalizedList.includes(formatted)) {
      const updated = [...normalizedList, formatted]
      setNewTags(updated.join(', '))
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentList = newTags ? newTags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const normalizedList = currentList.map((t) => (t.startsWith('#') ? t : `#${t}`))
    const target = tagToRemove.startsWith('#') ? tagToRemove : `#${tagToRemove}`
    const updated = normalizedList.filter((t) => t !== target)
    setNewTags(updated.join(', '))
  }

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

  // Loading / Submitting States
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

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

    setIsSubmittingPost(true)
    const tagList = newTags
      ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [newSubject]

    try {
      // 1. Always upload pending files to Cloudinary first!
      const finalMedia = await uploadPendingFiles(pendingThreadFiles, threadMedia)

      const res = await createCommunityThread({
        title: newTitle,
        content: newContent,
        subject: newSubject,
        tags: tagList,
        codeSnippet: newCode.trim() || undefined,
        media: finalMedia.length > 0 ? finalMedia : undefined,
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
      toast.success('Doubt Thread Posted!')
    } finally {
      setIsSubmittingPost(false)
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

    setIsSubmittingComment(true)
    try {
      // 1. Always upload pending files to Cloudinary first!
      const finalMedia = await uploadPendingFiles(pendingCommentFiles, commentMedia)

      if (!isRealId(activeThread.id)) throw new Error('Demo thread')

      const res = await createCommunityComment(activeThread.id, {
        text: commentText,
        media: finalMedia.length > 0 ? finalMedia : undefined,
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
      toast.success('+15 Karma! Comment posted successfully.')
    } finally {
      setIsSubmittingComment(false)
    }

    setCommentText('')
    setCommentMedia([])
    setPendingCommentFiles([])
  }

  const handleNestedReply = async (parentId: string, text: string, media?: MediaItem[], pendingFiles?: File[]) => {
    if (!activeThread) return
    if (!user) { toast.error('Please log in to reply'); return }

    // 1. Always upload pending files to Cloudinary first!
    const finalMedia = await uploadPendingFiles(pendingFiles || [], media || [])

    try {
      if (!isRealId(activeThread.id)) throw new Error('Demo thread')

      const res = await createCommunityComment(activeThread.id, {
        text,
        parentComment: isRealId(parentId) ? parentId : undefined,
        media: finalMedia.length > 0 ? finalMedia : undefined,
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
        media: finalMedia.length > 0 ? finalMedia : undefined,
      }
      const updatedComments = addNestedReply(activeThread.comments, parentId, newReply)
      const updatedThread = {
        ...activeThread,
        commentsCount: activeThread.commentsCount + 1,
        comments: updatedComments,
      }
      setActiveThread(updatedThread)
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updatedThread : t)))
      toast.success('+15 Karma! Reply posted to comment chain.')
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
      {/* Header Banner - Big, Informative & Apple-Grade */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f4f8fc] to-white border-b border-[#e5e5e7] py-12 md:py-16 px-6 select-none">
        {/* Radial Background Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,102,204,0.08)_0%,_transparent_70%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          {/* Main Headline Container */}
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-5xl font-extrabold tracking-tight text-[#1d1d1f] leading-[1.12]">
              Where Curiosity Meets Instant Socratic Clarity.{' '}
              <span className="block mt-1 bg-gradient-to-r from-[#0066cc] via-[#0077ed] to-[#004499] bg-clip-text text-transparent">
                Ask, Solve & Master Together.
              </span>
            </h1>

            <p className="text-sm md:text-base text-[#525252] font-normal leading-relaxed max-w-2xl">
              Connect with 25,000+ students, researchers, and verified tutors. Share code snippets, math formulas, or conceptual doubts, receive step-by-step Socratic AI guidance, and build your academic karma.
            </p>
          </div>

          {/* 3 Informative Feature Pill Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#0066cc]/15 shadow-xs flex items-start gap-3.5 transform-gpu transition-all hover:border-[#0066cc]/30 hover:shadow-md">
              <div className="p-2.5 rounded-xl bg-[#0066cc]/10 text-[#0066cc] shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-[#1d1d1f]">Instant Socratic AI Hints</h4>
                <p className="text-[11px] text-[#6e6e73] font-medium leading-normal">
                  Receive real-time Socratic breakdown hints on math equations, physics, and code syntax.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#0066cc]/15 shadow-xs flex items-start gap-3.5 transform-gpu transition-all hover:border-[#0066cc]/30 hover:shadow-md">
              <div className="p-2.5 rounded-xl bg-[#0066cc]/10 text-[#0066cc] shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-[#1d1d1f]">Verified Educator Responses</h4>
                <p className="text-[11px] text-[#6e6e73] font-medium leading-normal">
                  Get audited answers and detailed video/code walkthroughs from top 5% peer instructors.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#0066cc]/15 shadow-xs flex items-start gap-3.5 transform-gpu transition-all hover:border-[#0066cc]/30 hover:shadow-md">
              <div className="p-2.5 rounded-xl bg-[#0066cc]/10 text-[#0066cc] shrink-0">
                <Award size={18} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-[#1d1d1f]">Karma & Scholar Badges</h4>
                <p className="text-[11px] text-[#6e6e73] font-medium leading-normal">
                  Earn +15 Karma per accepted solution, unlock expert badges, and level up your subject rank.
                </p>
              </div>
            </div>
          </div>

          {/* Live Metrics Row */}
          <div className="pt-3 border-t border-[#e0e0e5]/70 flex flex-wrap items-center justify-between gap-6 text-xs text-[#525252]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#1d1d1f]">14,280+</span>
              <span className="text-[#7a7a7a]">Resolved Doubts</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#0066cc]" />
              <span className="font-bold text-[#1d1d1f]">98.6%</span>
              <span className="text-[#7a7a7a]">Resolution Rate</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#0066cc]" />
              <span className="font-bold text-[#1d1d1f]">&lt; 3.5 Mins</span>
              <span className="text-[#7a7a7a]">Avg Solution Time</span>
            </div>

            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#0066cc]" />
              <span className="font-bold text-[#1d1d1f]">25,000+</span>
              <span className="text-[#7a7a7a]">Active Scholars</span>
            </div>
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

          {/* Filter Modes (100% Immovable on Selection) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer select-none border ${
                filterMode === 'all'
                  ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                  : 'bg-white border-[#e0e0e2] text-[#6e6e73] hover:text-[#1d1d1f] hover:border-[#1d1d1f]/40'
              }`}
            >
              All Threads
            </button>
            <button
              onClick={() => setFilterMode('unsolved')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer select-none border ${
                filterMode === 'unsolved'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white border-[#e0e0e2] text-[#6e6e73] hover:text-amber-600 hover:border-amber-500/40'
              }`}
            >
              Open / Unsolved
            </button>
            <button
              onClick={() => setFilterMode('solved')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer select-none border ${
                filterMode === 'solved'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-[#e0e0e2] text-[#6e6e73] hover:text-emerald-600 hover:border-emerald-500/40'
              }`}
            >
              Solved
            </button>
          </div>
        </div>

        {/* Subject Filter Pills (Icon-supported & 100% Immovable on selection - Matches Image 3) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {communityFilterSubjects.map((subj) => {
            const isActive = activeSubject === subj
            return (
              <button
                key={subj}
                onClick={() => setActiveSubject(subj)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap select-none border flex items-center gap-2 ${
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
                    {activeThread.authorAvatar || (user && (activeThread.author === (user.fullName || user.name) || activeThread.author === 'You') && user.avatar) ? (
                      <img
                        src={activeThread.authorAvatar || user?.avatar}
                        alt={activeThread.author}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#e5e5e7] shadow-2xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066cc] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {activeThread.author.charAt(0)}
                      </div>
                    )}
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
                      className="hover:text-[#0066cc] transition-colors cursor-pointer flex items-center justify-center text-[#6e6e73]"
                      title="Like"
                    >
                      <ThumbsUp size={13} className={activeThread.userVote === 'up' ? 'fill-[#0066cc] text-[#0066cc]' : ''} />
                    </button>
                    <span className="min-w-[1.5rem] text-center font-extrabold text-xs text-[#1d1d1f] inline-block">{activeThread.upvotes}</span>
                    <button
                      onClick={(e) => handleDownvote(activeThread.id, e)}
                      className="hover:text-red-500 transition-colors cursor-pointer flex items-center justify-center text-[#6e6e73]"
                      title="Dislike"
                    >
                      <ThumbsDown size={13} className={activeThread.userVote === 'down' ? 'fill-red-500 text-red-500' : ''} />
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
                      disabled={isSubmittingComment || (!commentText.trim() && commentMedia.length === 0)}
                      className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#0066cc]/20 flex items-center justify-center gap-2 select-none"
                    >
                      {isSubmittingComment ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-white shrink-0" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <span>Comment</span>
                      )}
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
                {/* Inline Post Doubt Thread Accordion (GPU-Locked High-Performance Anti-Lag) */}
                <div className={`rounded-2xl border transition-colors duration-150 transform-gpu overflow-hidden ${
                  isCreateFormExpanded ? 'border-[#0066cc] shadow-md' : 'border-[#0066cc]/30 shadow-2xs hover:border-[#0066cc] hover:shadow-sm'
                }`}>
                  {/* Accordion Header Bar */}
                  <div
                    onClick={() => setIsCreateFormExpanded(!isCreateFormExpanded)}
                    className={`p-4 md:p-5 flex items-center justify-center gap-2.5 cursor-pointer select-none group transition-colors duration-150 transform-gpu text-center ${
                      isCreateFormExpanded
                        ? 'bg-[#0066cc] text-white'
                        : 'bg-gradient-to-r from-[#f0f7ff] via-white to-[#f0f7ff] hover:from-[#e5f1ff] hover:to-[#e5f1ff] text-[#1d1d1f]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 transform-gpu ${
                        isCreateFormExpanded
                          ? 'bg-white/20 text-white'
                          : 'bg-[#0066cc] text-white shadow-2xs'
                      }`}
                    >
                      <Plus
                        size={16}
                        className={`stroke-[3] transition-transform duration-150 transform-gpu ease-out ${
                          isCreateFormExpanded ? 'rotate-45' : ''
                        }`}
                      />
                    </div>
                    <span className={`text-sm sm:text-base font-extrabold tracking-tight transition-colors duration-150 ${
                      isCreateFormExpanded ? 'text-white' : 'text-[#0066cc] group-hover:text-[#004d99]'
                    }`}>
                      Ask an Academic Doubt / Post Thread
                    </span>
                  </div>

                  {/* Accordion Body Panel (GPU-Accelerated Instant Render) */}
                  {isCreateFormExpanded && (
                    <div className="p-5 md:p-6 border-t border-[#f0f0f2] bg-white space-y-4 transform-gpu">
                      {/* Subject Chips (Matches Tutors Page Subject Field) */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#6e6e73] uppercase tracking-wider mb-2">
                          Subject Domain
                        </label>
                        <div className="flex flex-wrap items-center content-start gap-1.5 max-w-full flex-1 max-h-[105px] overflow-y-auto subject-slider pr-2 py-0.5">
                          {allSubjects.map((sub) => {
                            const isActive = newSubject === sub
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => setNewSubject(sub)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer whitespace-nowrap select-none border inline-flex items-center gap-1.5 transform-gpu ${
                                  isActive
                                    ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-xs'
                                    : 'bg-[#f5f5f7] border-[#e5e5e7] text-[#525252] hover:border-[#0066cc]/40 hover:text-[#0066cc]'
                                }`}
                              >
                                {getSubjectFilterIcon(sub, isActive)}
                                <span>{sub}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Hashtag List Selection */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#6e6e73] uppercase tracking-wider mb-2">
                          Hashtags / Topic Tags
                        </label>
                        
                        <div className="space-y-3">
                          {/* Input Field with Add Button */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault()
                                  handleAddTag()
                                }
                              }}
                              placeholder="Add a hashtag (e.g. Calculus or #Algorithms)"
                              className="flex-1 px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] placeholder-[#86868b]"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTag()}
                              className="px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-extrabold transition-colors cursor-pointer select-none"
                            >
                              Add
                            </button>
                          </div>

                          {/* Immovable Quick Suggestions with Left Domain Icons (Matches Image 3) */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[10px] font-bold text-[#86868b] mr-1 select-none">Quick Suggestions:</span>
                            {(newSubject === 'Algorithms'
                              ? ['Sorting', 'Graphs', 'Dynamic Programming', 'Complexity']
                              : newSubject === 'Computer Science'
                              ? ['Algorithms', 'Data Structures', 'React', 'Python', 'C++']
                              : newSubject === 'Physics'
                              ? ['Mechanics', 'Quantum Physics', 'Thermodynamics', 'Electromagnetism']
                              : newSubject === 'Chemistry'
                              ? ['Organic Chemistry', 'Inorganic Chemistry', 'Thermodynamics', 'Reactions']
                              : ['Circuits', 'Thermodynamics', 'Statics', 'Control Systems']
                            ).map((tag) => {
                              const activeList = newTags ? newTags.split(',').map((t) => t.trim()).filter(Boolean) : []
                              const formattedTag = `#${tag}`
                              const isSelected = activeList.includes(formattedTag) || activeList.includes(tag)
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      handleRemoveTag(tag)
                                    } else {
                                      handleAddTag(tag)
                                    }
                                  }}
                                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none border flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-[#0066cc]/10 border-[#0066cc] text-[#0066cc] shadow-2xs'
                                      : 'bg-[#f5f5f7] border-[#e5e5e7] text-[#1d1d1f] hover:bg-[#e8e8ea] hover:border-[#d0d0d4]'
                                  }`}
                                >
                                  {getTagIcon(tag)}
                                  <span>{tag}</span>
                                </button>
                              )
                            })}
                          </div>

                          {/* Active Added Hashtag Pill Badges (Appears below Quick Suggestions, zero vertical push) */}
                          {newTags && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#f0f0f2]">
                              {newTags.split(',').map((t) => t.trim()).filter(Boolean).map((tag, idx) => {
                                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`
                                return (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 select-none animate-in fade-in duration-150"
                                  >
                                    <CheckCircle2 size={12} className="text-[#0066cc]" />
                                    <span>{formattedTag}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTag(tag)}
                                      className="text-[#7a7a7a] hover:text-red-600 transition-colors ml-1 cursor-pointer"
                                      title="Remove Hashtag"
                                    >
                                      <X size={11} />
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          )}
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
                            disabled={isSubmittingPost || !newTitle.trim() || !newContent.trim()}
                            className="px-6 py-2 rounded-full bg-[#0066cc] text-white text-xs font-extrabold hover:bg-[#0077ed] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#0066cc]/20 flex items-center justify-center gap-2 select-none"
                          >
                            {isSubmittingPost ? (
                              <>
                                <Loader2 size={14} className="animate-spin text-white shrink-0" />
                                <span>Posting...</span>
                              </>
                            ) : (
                              <span>Post Thread</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Doubts Feed - Loading Skeleton or Feed */}
                {isLoading ? (
                  <div className="space-y-4 min-h-[500px]">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-white rounded-3xl border border-[#e5e5e7] p-6 space-y-4 shadow-2xs animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#f0f0f2]" />
                            <div className="w-32 h-4 rounded-md bg-[#e5e5e7]" />
                          </div>
                          <div className="w-20 h-5 rounded-full bg-[#f0f0f2]" />
                        </div>
                        <div className="space-y-2">
                          <div className="w-3/4 h-5 rounded-md bg-[#e5e5e7]" />
                          <div className="w-full h-4 rounded-md bg-[#f0f0f2]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="bg-gradient-to-b from-white via-[#fafafc] to-white rounded-3xl border border-[#e5e5e7] p-12 sm:p-16 md:p-20 text-center space-y-6 shadow-xs select-none">
                    <div className="w-20 h-20 rounded-3xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center mx-auto ring-8 ring-[#0066cc]/5 shadow-xs transform-gpu">
                      <MessageSquare size={38} className="text-[#0066cc]" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
                        No Doubt Threads Found
                      </h3>
                      <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
                        We couldn't find any academic threads matching your selected criteria. Be the first scholar to start a discussion!
                      </p>
                    </div>
                  </div>
                ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={async () => {
                    // Fetch full thread with comments from API
                    try {
                      const res = await fetchCommunityThread(thread.id)
                      const fullThread = res?.data || (res?.thread ? { ...res.thread, comments: res.comments || [] } : null)
                      if (res?.success && fullThread) {
                        setActiveThread(mapApiThread(fullThread, user?._id))
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
                      {thread.authorAvatar || (user && (thread.author === (user.fullName || user.name) || thread.author === 'You') && user.avatar) ? (
                        <img
                          src={thread.authorAvatar || user?.avatar}
                          alt={thread.author}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#e5e5e7] shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0066cc] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {thread.author.charAt(0)}
                        </div>
                      )}
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
                          className="hover:text-[#0066cc] transition-colors cursor-pointer flex items-center justify-center text-[#6e6e73]"
                          title="Like"
                        >
                          <ThumbsUp size={13} className={thread.userVote === 'up' ? 'fill-[#0066cc] text-[#0066cc]' : ''} />
                        </button>
                        <span className="min-w-[1.5rem] text-center font-extrabold text-[#1d1d1f] text-xs inline-block">{thread.upvotes}</span>
                        <button
                          onClick={(e) => handleDownvote(thread.id, e)}
                          className="hover:text-red-500 transition-colors cursor-pointer flex items-center justify-center text-[#6e6e73]"
                          title="Dislike"
                        >
                          <ThumbsDown size={13} className={thread.userVote === 'down' ? 'fill-red-500 text-red-500' : ''} />
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
