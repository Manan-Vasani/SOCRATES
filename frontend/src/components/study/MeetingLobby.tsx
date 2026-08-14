import React, { useCallback, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, Copy, Share2, Sparkles, User, Video as VideoIcon } from 'lucide-react'
import { toast } from 'sonner'

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

  const videoRefCallback = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && localStream && isCameraOn) {
        if (node.srcObject !== localStream) {
          node.srcObject = localStream
        }
        node.play().catch(() => {})
      }
    },
    [localStream, isCameraOn]
  )

  const shareUrl = `${window.location.origin}/meeting/${meetingId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Meeting link copied to clipboard!')
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

  return (
    <div className="min-h-screen w-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 md:p-8 select-none relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0066cc]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-[#141418] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl z-10 space-y-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#0066cc]/20 text-[#4d9fff] text-xs font-bold border border-[#0066cc]/30">
                {sessionDetails?.subject || 'Tutoring Session'}
              </span>
              <span className="text-xs text-white/40 font-mono">Room: {meetingId}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white">
              {sessionDetails?.topic ? `Session: ${sessionDetails.topic}` : 'Ready to Join Session?'}
            </h1>
            {sessionDetails?.tutorName && (
              <p className="text-xs text-white/60">
                Tutor: <strong className="text-white font-semibold">{sessionDetails.tutorName}</strong>
              </p>
            )}
          </div>

          {/* Quick Share Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Copy size={14} />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-[#0066cc]/20 hover:bg-[#0066cc]/30 border border-[#0066cc]/40 text-xs font-semibold text-[#4d9fff] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Content Body: Left Video Preview + Right Join Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Camera Preview Card */}
          <div className="relative w-full aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-[#0d0d10] border border-white/10 shadow-inner group">
            {localStream && isCameraOn ? (
              <video
                ref={videoRefCallback}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-gradient-to-br from-[#1a1a20] to-[#121218]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0066cc] to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/6 border border-white/10 text-xs text-white/50">
                  <VideoOff size={13} />
                  <span>Camera is turned off</span>
                </div>
              </div>
            )}

            {/* Bottom Controls Bar inside preview */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-20">
              <button
                onClick={onMicToggle}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isMicOn
                    ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                }`}
                title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                onClick={onCameraToggle}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isCameraOn
                    ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                }`}
                title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
            </div>
          </div>

          {/* Right Join Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <User size={13} className="text-[#0066cc]" /> Your Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter your name to join..."
                className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
              />
              <p className="text-[11px] text-white/40">
                This is the name other participants will see inside the meeting room.
              </p>
            </div>

            {/* Direct Join Button */}
            <button
              onClick={onJoinMeeting}
              disabled={!displayName.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0066cc] to-[#0077ed] hover:from-[#0077ed] hover:to-[#0088ff] text-white font-bold text-sm transition-all shadow-xl shadow-[#0066cc]/25 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform-gpu active:scale-[0.99]"
            >
              <VideoIcon size={18} />
              <span>Join Meeting Now</span>
            </button>

            {/* Share info footer */}
            <div className="p-3.5 rounded-2xl bg-white/4 border border-white/8 text-xs text-white/50 flex items-start gap-2.5">
              <Sparkles size={16} className="text-[#0066cc] shrink-0 mt-0.5" />
              <span>
                Anyone with the link <strong className="text-white/80">{shareUrl}</strong> can join this session live in browser.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
