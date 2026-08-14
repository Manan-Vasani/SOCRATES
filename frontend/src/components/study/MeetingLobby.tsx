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
} from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../Navbar'

interface MeetingLobbyProps {
  meetingId: string
  sessionDetails?: {
    subject?: string
    topic?: string
    tutorName?: string
    dateStr?: string
    timeStr?: string
  }
  displayName: string
  onNameChange: (name: string) => void
  isMicOn: boolean
  onMicToggle: () => void
  isCameraOn: boolean
  onCameraToggle: () => void
  localStream: MediaStream | null
  onJoinMeeting: () => void
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
  displayName,
  onNameChange,
  isMicOn,
  onMicToggle,
  isCameraOn,
  onCameraToggle,
  localStream,
  onJoinMeeting,
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

  const initials = getCleanInitials(displayName)
  const isCustomTopic = sessionDetails?.topic && !sessionDetails.topic.includes('sess-')
  const heroTitle = isCustomTopic ? sessionDetails.topic : 'Ready to join?'
  const subjectTag = sessionDetails?.subject || '1-on-1 Tutoring'

  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-between select-none antialiased">
      {/* Standard Platform Navigation Bar */}
      <Navbar />

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 md:py-14 w-full">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Device Camera & Audio Viewport (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-[#1c1c1e] border border-[#e5e5e7] shadow-xl shadow-black/8 group">
              {/* Video Element */}
              {localStream && isCameraOn ? (
                <video
                  ref={(node) => {
                    videoRef.current = node
                    if (node && localStream && isCameraOn) {
                      if (node.srcObject !== localStream) {
                        node.srcObject = localStream
                      }
                      node.play().catch(() => {})
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                /* Camera Off State */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-b from-[#252528] to-[#1a1a1d]">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0066cc] to-[#147efb] flex items-center justify-center text-3xl font-semibold text-white shadow-xl shadow-black/20 tracking-wide">
                    {initials}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80">
                    <VideoOff size={13} className="text-white/60" />
                    <span>Camera is off</span>
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

          {/* Right: Clean White Join Card (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#e5e5e7] p-7 sm:p-9 shadow-sm space-y-6 flex flex-col justify-between">
            {/* Header / Session Details */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                {heroTitle}
              </h1>

              {sessionDetails?.tutorName && (
                <p className="text-xs text-[#7a7a7a]">
                  Hosted by{' '}
                  <strong className="text-[#1d1d1f] font-semibold">
                    {sessionDetails.tutorName}
                  </strong>
                </p>
              )}
            </div>

            {/* Display Name Input with Quick Clear Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <User size={13} className="text-[#0066cc] shrink-0" />
                  Your name
                </label>
                {displayName.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNameChange('')}
                    className="text-[11px] font-medium text-[#7a7a7a] hover:text-[#0066cc] transition-colors cursor-pointer select-none"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={40}
                  autoComplete="name"
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] text-sm font-semibold text-[#1d1d1f] placeholder:text-[#a1a1a6] outline-none focus:bg-white focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-colors duration-150"
                />
                {displayName.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNameChange('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#a1a1a6] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors cursor-pointer"
                    title="Clear input"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Primary Action Button: Compact & Sleek Apple Action Blue Pill */}
            <button
              onClick={onJoinMeeting}
              disabled={!displayName.trim()}
              className="w-full py-2.5 sm:py-3 px-6 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-sm transition-colors duration-150 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none"
            >
              <Video size={16} className="shrink-0" />
              <span>Join now</span>
            </button>

            {/* Share Link Strip */}
            <div className="pt-4 border-t border-[#f0f0f0] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#7a7a7a] select-none">
                <span className="font-semibold text-[#1d1d1f]">Invite link</span>
                <span className="text-[11px] text-[#7a7a7a]">Anyone with the link can join</span>
              </div>

              {/* Full-width Meeting URL Box */}
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs font-mono text-[#1d1d1f] truncate select-all">
                {shareUrl}
              </div>

              {/* Action Buttons Down Below */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 border border-[#e5e5e7] select-none"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-[#34c759] shrink-0" />
                      <span className="text-[#34c759]">Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="shrink-0" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 border border-[#e5e5e7] select-none"
                >
                  <Share2 size={14} className="shrink-0" />
                  <span>Share invite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Platform Footer */}
      <footer className="h-12 px-6 flex items-center justify-center text-xs text-[#7a7a7a] border-t border-[#e0e0e0]/60 bg-white/60 backdrop-blur-md shrink-0">
        <span>© {new Date().getFullYear()} SOCRATES. All rights reserved.</span>
      </footer>
    </div>
  )
}
