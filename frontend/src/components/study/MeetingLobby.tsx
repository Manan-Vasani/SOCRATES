import React, { useCallback, useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Check,
  Share2,
  User,
  Radio,
  X,
  ShieldCheck,
  Lock,
  Sparkles,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../Navbar'
import Footer from '../Footer'
import PermissionGuideModal from './PermissionGuideModal'
import { useAuthStore } from '../../store/useAuthStore'

interface MeetingLobbyProps {
  meetingId: string
  sessionDetails?: {
    subject?: string
    topic?: string
    tutorName?: string
    studentName?: string
    dateStr?: string
    timeStr?: string
    duration?: number
    fee?: number
  }
  isDetailsLoading?: boolean
  displayName: string
  onNameChange: (name: string) => void
  isMicOn: boolean
  onMicToggle: () => void
  isCameraOn: boolean
  onCameraToggle: () => void
  localStream: MediaStream | null
  onJoinMeeting: () => void
  permissionDeniedType?: 'microphone' | 'camera' | 'media' | null
  onClearPermissionDenied?: () => void
}

/**
 * Extracts clean user initials (e.g. "24DCS147 MANAN VASANI" -> "MV")
 */
function getCleanInitials(name: string): string {
  if (!name) return 'U'
  // Strip student ID / roll number prefixes like "24DCS147 "
  const cleaned = name.replace(/^[0-9a-zA-Z]{5,12}\s+/, '').trim() || name.trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2 && !/^\d+$/.test(parts[0])) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0]?.[0] || 'U').toUpperCase()
}

export default function MeetingLobby({
  meetingId,
  sessionDetails,
  isDetailsLoading = false,
  displayName,
  onNameChange,
  isMicOn,
  onMicToggle,
  isCameraOn,
  onCameraToggle,
  localStream,
  onJoinMeeting,
  permissionDeniedType = null,
  onClearPermissionDenied,
}: MeetingLobbyProps) {
  const [copied, setCopied] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  // Real-time audio activity meter from local stream
  useEffect(() => {
    if (!localStream || !isMicOn) {
      setAudioLevel(0)
      return
    }

    const audioTrack = localStream.getAudioTracks()[0]
    if (!audioTrack || !audioTrack.enabled) {
      setAudioLevel(0)
      return
    }

    let audioCtx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let animFrame: number

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.5
      source = audioCtx.createMediaStreamSource(localStream)
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkVolume = () => {
        if (!analyser) return
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const avg = sum / bufferLength
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)))
        animFrame = requestAnimationFrame(checkVolume)
      }

      checkVolume()
    } catch {
      // Graceful fallback if AudioContext is restricted
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame)
      if (source) source.disconnect()
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {})
      }
    }
  }, [localStream, isMicOn])

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (localStream && isCameraOn) {
        if (videoRef.current.srcObject !== localStream) {
          videoRef.current.srcObject = localStream
        }
        videoRef.current.play().catch((err) => {
          console.warn('[MeetingLobby] Video play warning:', err)
        })
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [localStream, isCameraOn])

  const shareUrl = `${window.location.origin}/meeting/${meetingId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Meeting link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Tutoring Session — SOCRATES`,
          text: `Join my live tutoring session on SOCRATES: ${sessionDetails?.subject || 'Tutoring'}`,
          url: shareUrl,
        })
      } catch (err) {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const { user } = useAuthStore()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const userAvatarSrc = user?.profileImage || user?.avatar || ''
  const hasRealPhoto = Boolean(userAvatarSrc && !avatarFailed)

  const initials = getCleanInitials(displayName)
  const isCustomTopic = sessionDetails?.topic && !sessionDetails.topic.includes('sess-')
  const heroTitle = isCustomTopic ? sessionDetails.topic : 'Ready to join?'
  const subjectTag = sessionDetails?.subject || '1-on-1 Tutoring'

  const hasActiveCamera = Boolean(
    localStream &&
      isCameraOn &&
      localStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')
  )

  return (
    <div className="min-h-screen w-full bg-[#fafafc] text-[#1d1d1f] flex flex-col justify-between select-none antialiased overflow-x-clip">
      {/* Standard Platform Navigation Bar */}
      <Navbar />

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 md:py-14 w-full">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Device Camera & Audio Viewport (6 cols) - Matches Right Card Height Exactly */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="relative w-full h-full min-h-[410px] sm:min-h-[430px] rounded-3xl overflow-hidden bg-[#1c1c1e] border border-[#e5e5e7] shadow-xl shadow-black/8 group flex flex-col items-center justify-center">
              {/* Video Element (Live Real Camera Feed) */}
              {hasActiveCamera ? (
                <video
                  ref={(node) => {
                    videoRef.current = node
                    if (node && localStream) {
                      if (node.srcObject !== localStream) {
                        node.srcObject = localStream
                      }
                      node.play().catch(() => {})
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1] absolute inset-0"
                />
              ) : (
                /* Authentic Camera Off State with Profile Avatar / Monogram & Status Badge */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-6 bg-gradient-to-b from-[#202024] to-[#121214]">
                  {hasRealPhoto ? (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/40 flex items-center justify-center bg-[#252528] shrink-0">
                      <img
                        src={userAvatarSrc}
                        alt={displayName || 'User Avatar'}
                        onError={() => setAvatarFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#0066cc] to-[#004499] border-2 border-white/20 shadow-2xl shadow-[#0066cc]/25 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold tracking-tight select-none shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="text-center space-y-1">
                    <span className="text-sm font-semibold text-white/90 block tracking-tight">
                      {displayName || 'You'}
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/70 select-none">
                      <VideoOff size={12} className="text-white/60" />
                      <span>Camera is off</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Mic Activity Indicator */}
              {isMicOn && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 z-20">
                  <div className="flex items-end gap-[2px] h-3">
                    {[0.4, 0.9, 0.6, 1].map((scale, i) => (
                      <span
                        key={i}
                        className={`w-[2.5px] rounded-full transition-all duration-100 ${
                          audioLevel > 15 ? 'bg-[#34c759]' : 'bg-white/40'
                        }`}
                        style={{
                          height:
                            audioLevel > 15
                              ? `${Math.max(4, Math.min(12, (audioLevel / 100) * 12 * scale + 3))}px`
                              : '4px',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-white/90">
                    {audioLevel > 15 ? 'Speaking' : 'Mic on'}
                  </span>
                </div>
              )}

              {/* Floating Camera & Mic Controls Dock */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center z-20">
                <div className="flex items-center gap-3.5 p-2 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 shadow-xl">
                  {/* Mic Toggle Button */}
                  <button
                    onClick={onMicToggle}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer select-none ${
                      isMicOn
                        ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20'
                        : 'bg-[#ff3b30] text-white hover:bg-[#e03126] shadow-sm'
                    }`}
                    title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
                  >
                    {isMicOn ? <Mic size={20} className="shrink-0" /> : <MicOff size={20} className="shrink-0" />}
                  </button>

                  {/* Camera Toggle Button */}
                  <button
                    onClick={onCameraToggle}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer select-none ${
                      isCameraOn
                        ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20'
                        : 'bg-[#ff3b30] text-white hover:bg-[#e03126] shadow-sm'
                    }`}
                    title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isCameraOn ? <Video size={20} className="shrink-0" /> : <VideoOff size={20} className="shrink-0" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Clean White Join Card (6 cols) - Wider with Perfect Proportion */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#e5e5e7] p-7 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between h-full min-h-[410px] sm:min-h-[430px]">
            {/* Header / Session Details with Matching Skeleton */}
            <div className="space-y-1.5 min-h-[58px] flex flex-col justify-center">
              {isDetailsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-7 w-4/5 max-w-[320px] rounded-lg bg-[#e5e5e7]/80" />
                  <div className="h-3.5 w-1/3 max-w-[140px] rounded-md bg-[#f0f0f2]" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] line-clamp-1" title={heroTitle}>
                    {heroTitle}
                  </h1>

                  {sessionDetails?.tutorName ? (
                    <p className="text-xs text-[#7a7a7a] truncate">
                      Hosted by{' '}
                      <strong className="text-[#1d1d1f] font-semibold">
                        {sessionDetails.tutorName}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-xs text-[#7a7a7a]">Live Tutoring Session</p>
                  )}
                </>
              )}
            </div>

            {/* Dynamic Session Overview Details Card / Loader Skeleton */}
            {isDetailsLoading ? (
              <div className="p-4 rounded-2xl bg-white border border-[#e5e5e7] h-[164px] min-h-[164px] max-h-[164px] box-border flex flex-col justify-between shadow-2xs text-left animate-pulse">
                {/* Top Row matching h-7 (28px) */}
                <div className="flex items-center justify-between gap-2 h-7">
                  <div className="w-28 h-6 rounded-full bg-[#f0f0f2]" />
                  <div className="w-24 h-6 rounded-full bg-[#f0f0f2]" />
                </div>

                {/* Topic Heading & Date Subtext */}
                <div className="space-y-1.5 py-0.5">
                  <div className="w-4/5 h-4 rounded-md bg-[#e5e5e7]/80" />
                  <div className="w-2/5 h-3 rounded-md bg-[#f0f0f2]" />
                </div>

                {/* Footer matching pt-2.5 border-t h-6 (34px) */}
                <div className="pt-2.5 border-t border-[#f0f0f2] flex items-center justify-between h-6">
                  <div className="w-36 h-3.5 rounded-md bg-[#f0f0f2]" />
                  <div className="w-10 h-3.5 rounded-md bg-[#f0f0f2]" />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-[#e5e5e7] h-[164px] min-h-[164px] max-h-[164px] box-border flex flex-col justify-between shadow-2xs text-left">
                {/* Top Row: Subject Pill Tag + Time Badge */}
                <div className="flex items-center justify-between gap-2 h-7">
                  <span className="px-3 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-extrabold text-xs leading-none flex items-center justify-center">
                    {sessionDetails?.subject || 'Linear Algebra'}
                  </span>
                  {sessionDetails?.timeStr && (
                    <span className="text-xs font-bold text-[#1d1d1f] bg-[#f5f5f7] border border-[#e5e5e7] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs leading-none">
                      <Clock size={12} className="text-[#0066cc]" />
                      {sessionDetails.timeStr}
                    </span>
                  )}
                </div>

                {/* Topic Heading & Date Subtext */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#1d1d1f] leading-snug line-clamp-1">
                    {sessionDetails?.topic || 'Interactive Whiteboard, Video & Code Sandbox'}
                  </h4>
                  {sessionDetails?.dateStr && (
                    <p className="text-[11px] font-medium text-[#7a7a7a] flex items-center gap-2 pt-0.5 leading-none">
                      <span>{sessionDetails.dateStr}</span>
                      <span>•</span>
                      <span>{sessionDetails?.duration || 60} Min Session</span>
                    </p>
                  )}
                </div>

                {/* Footer: Host Tutor & Fee */}
                <div className="pt-2.5 border-t border-[#f0f0f2] flex items-center justify-between text-xs text-[#525252] h-6">
                  <div className="flex items-center gap-1.5 text-[#525252] truncate">
                    <User size={13} className="text-[#0066cc] shrink-0" />
                    <span className="truncate">Tutor: <strong className="text-[#1d1d1f] font-semibold">{sessionDetails?.tutorName || 'Marcus Chen'}</strong></span>
                  </div>
                  {sessionDetails?.fee !== undefined ? (
                    <span className="font-bold text-[#34c759] shrink-0">${sessionDetails.fee}</span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-md shrink-0">Free Demo</span>
                  )}
                </div>
              </div>
            )}

            {/* Display Name Input with 100% Fixed Dimensions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5 select-none h-5">
                <User size={13} className="text-[#0066cc] shrink-0" />
                Your name
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={40}
                  autoComplete="name"
                  className="w-full pl-4 pr-10 h-11 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] text-sm font-semibold text-[#1d1d1f] placeholder:text-[#a1a1a6] outline-none focus:bg-white focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => onNameChange('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#a1a1a6] hover:text-[#1d1d1f] hover:bg-black/5 transition-opacity duration-150 cursor-pointer ${
                    displayName.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  title="Clear input"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Primary Action Button: Compact & Sleek Apple Action Blue Pill */}
            <button
              onClick={onJoinMeeting}
              disabled={!displayName.trim()}
              className="w-full h-11 px-6 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-sm transition-colors duration-150 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none shrink-0"
            >
              <Video size={16} className="shrink-0" />
              <span>Join now</span>
            </button>


          </div>
        </div>
      </main>

      {/* Standard Platform Footer */}
      <Footer />

      {/* Google Meet / Apple Style Browser Permission Block Guidance Modal */}
      <PermissionGuideModal
        isOpen={Boolean(permissionDeniedType)}
        deviceType={permissionDeniedType}
        onClose={() => onClearPermissionDenied?.()}
        onRetry={() => {
          if (permissionDeniedType === 'camera') {
            onCameraToggle()
          } else {
            onMicToggle()
          }
        }}
      />
    </div>
  )
}
