import React, { useState, useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquareText,
  Bot,
  Sparkles,
  LogOut,
  LayoutGrid,
  Columns2,
  PenTool,
  Code2,
  ChevronLeft,
  Circle,
  Users,
  Clock,
  Captions,
  CaptionsOff,
  ScrollText,
} from 'lucide-react'

export type StageMode = 'split' | 'whiteboard' | 'code' | 'grid'

interface RoomHeaderProps {
  roomTitle: string
  subject: string
  participantCount: number
  stageMode: StageMode
  onStageModeChange: (mode: StageMode) => void
  isMicOn: boolean
  onMicToggle: () => void
  isCameraOn: boolean
  onCameraToggle: () => void
  isScreenSharing: boolean
  onScreenShareToggle: () => void
  isHandRaised?: boolean
  onHandRaise?: () => void
  onAIToggle: () => void
  onLeave: () => void
  isChatOpen: boolean
  onChatToggle: () => void
  onShareLink?: () => void
  currentUserRole?: 'tutor' | 'student'
  isLoading?: boolean
  plannedDuration?: number
  plannedTimeStr?: string
  plannedDateStr?: string
  sessionTypeLabel?: string
  sessionStartTime?: number
  onAutoEndSession?: () => void
  isTranscriptOpen?: boolean
  onTranscriptToggle?: () => void
  isAIOpen?: boolean
  isCCOn?: boolean
  onCCToggle?: () => void
}

interface MediaBtnProps {
  active?: boolean
  danger?: boolean
  variant?: 'default' | 'primary' | 'transcript' | 'ai' | 'emerald' | 'amber'
  onClick?: () => void
  title: string
  children: React.ReactNode
}

// 1. Stable, memoized MediaBtn declared OUTSIDE RoomHeader with distinct active states
const MediaBtn = memo(function MediaBtn({
  active,
  danger,
  variant = 'default',
  onClick,
  title,
  children,
}: MediaBtnProps) {
  let colorClasses = 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'

  if (danger) {
    colorClasses = 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-sm shadow-red-500/10'
  } else if (active) {
    if (variant === 'ai') {
      colorClasses = 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/15 hover:bg-purple-500/30 hover:text-purple-200'
    } else if (variant === 'transcript') {
      // Crisp Apple frosted glass for Transcript
      colorClasses = 'bg-white/15 text-white border border-white/25 shadow-sm shadow-white/5 hover:bg-white/20'
    } else if (variant === 'primary') {
      // Sleek translucent electric glass for Captions (matching the header subject & count badges)
      colorClasses = 'bg-[#0066cc]/20 text-[#3894ff] border border-[#0066cc]/40 shadow-sm shadow-[#0066cc]/15 hover:bg-[#0066cc]/30 hover:text-[#52a4ff]'
    } else if (variant === 'emerald') {
      colorClasses = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/15 hover:bg-emerald-500/30'
    } else if (variant === 'amber') {
      colorClasses = 'bg-amber-500 text-white shadow-md shadow-amber-500/30 border border-amber-400 hover:bg-amber-400'
    } else {
      // Standard neutral state for Mic and Camera when active (calm neutral, NOT blue)
      colorClasses = 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl text-xs font-semibold select-none flex items-center justify-center shrink-0 outline-none transform-gpu backface-hidden transition-all duration-150 cursor-pointer ${colorClasses}`}
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0 select-none pointer-events-none">
        {children}
      </span>
    </button>
  )
})

interface RoomTimerProps {
  durationMin: number
  totalSeconds: number
  sessionStartTime?: number
  sessionTypeLabel?: string
  plannedTimeStr?: string
  onAutoEndSession?: () => void
  participantCount: number
}

// 2. Isolated, memoized RoomTimer to keep 1-second interval renders scoped to the timer only
const RoomTimer = memo(function RoomTimer({
  durationMin,
  totalSeconds,
  sessionStartTime,
  sessionTypeLabel,
  plannedTimeStr,
  onAutoEndSession,
  participantCount,
}: RoomTimerProps) {
  const EXTRA_WRAP_UP_SECONDS = 60
  const hasAutoEndedRef = React.useRef(false)

  const [remaining, setRemaining] = useState(() => {
    if (sessionStartTime) {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
      return totalSeconds - elapsed
    }
    return totalSeconds
  })

  useEffect(() => {
    const updateCountdown = () => {
      if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
        const currentRemaining = totalSeconds - elapsed
        setRemaining(currentRemaining)

        // Exact trigger when the 1 extra minute runs out (<= -60s)
        if (currentRemaining <= -EXTRA_WRAP_UP_SECONDS && !hasAutoEndedRef.current) {
          hasAutoEndedRef.current = true
          onAutoEndSession?.()
        }
      } else {
        setRemaining((prev) => {
          const next = prev - 1
          if (next <= -EXTRA_WRAP_UP_SECONDS && !hasAutoEndedRef.current) {
            hasAutoEndedRef.current = true
            onAutoEndSession?.()
          }
          return next
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [sessionStartTime, totalSeconds, onAutoEndSession])

  const formatCountdown = (s: number) => {
    if (s < 0) {
      const overtimeSec = Math.abs(s)
      const m = Math.floor(overtimeSec / 60)
      const sec = overtimeSec % 60
      return `+${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const isWrapUp = remaining <= 0 && remaining > -EXTRA_WRAP_UP_SECONDS
  const wrapUpRemaining = isWrapUp ? EXTRA_WRAP_UP_SECONDS + remaining : 0

  return (
    <div className="hidden sm:flex items-center gap-2 mr-1 shrink-0">
      <div
        className={`flex items-center justify-center gap-1.5 min-w-[124px] px-3 py-1.5 rounded-full border text-xs font-bold font-sans tracking-wide shadow-sm backdrop-blur-md select-none shrink-0 transition-all duration-150 transform-gpu backface-hidden ${
          isWrapUp
            ? 'bg-red-500/20 border-red-500/40 text-red-300 ring-1 ring-red-500/30'
            : 'bg-white/8 border-white/15 text-white'
        }`}
        title={
          isWrapUp
            ? `Planned session ended. 1-minute extra wrap-up active: meeting automatically concludes in ${wrapUpRemaining}s`
            : `Planned: ${sessionTypeLabel || `${durationMin}m Session`}${plannedTimeStr ? ` (${plannedTimeStr})` : ''} • ${formatCountdown(remaining)} remaining`
        }
      >
        <Clock
          size={13}
          className={`shrink-0 pointer-events-none select-none ${
            isWrapUp ? 'text-red-400 animate-pulse' : 'text-[#3894ff]'
          }`}
        />
        {isWrapUp ? (
          <>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/30 text-red-200 tracking-wider animate-pulse">
              Wrap-up
            </span>
            <span className="tabular-nums font-extrabold text-xs text-red-200 tracking-wider select-none">
              {wrapUpRemaining}s
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] font-extrabold uppercase px-1 py-0.5 rounded bg-white/10 text-white/80 tracking-wider">
              {durationMin}m
            </span>
            <span className="tabular-nums font-semibold text-xs tracking-wider select-none">
              {formatCountdown(remaining)}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 w-[50px] py-1.5 rounded-full bg-[#0066cc]/15 border border-[#0066cc]/30 text-[#4d9fff] text-xs font-bold shadow-sm backdrop-blur-md select-none shrink-0">
        <Users size={13} className="text-[#3894ff] shrink-0 pointer-events-none select-none" />
        <span className="tabular-nums font-bold text-xs select-none">{participantCount}</span>
      </div>
    </div>
  )
})

const STAGE_MODES: { key: StageMode; icon: React.ReactNode; label: string }[] = [
  { key: 'split', icon: <Columns2 size={14} />, label: 'Split View' },
  { key: 'whiteboard', icon: <PenTool size={14} />, label: 'Whiteboard' },
  { key: 'code', icon: <Code2 size={14} />, label: 'Code IDE' },
  { key: 'grid', icon: <LayoutGrid size={14} />, label: 'Gallery' },
]

export default function RoomHeader({
  roomTitle,
  subject,
  participantCount,
  stageMode,
  onStageModeChange,
  isMicOn,
  onMicToggle,
  isCameraOn,
  onCameraToggle,
  isScreenSharing,
  onScreenShareToggle,
  isChatOpen,
  onChatToggle,
  isAIOpen,
  onAIToggle,
  onLeave,
  currentUserRole,
  isLoading = false,
  plannedDuration = 60,
  plannedTimeStr,
  sessionTypeLabel,
  sessionStartTime,
  onAutoEndSession,
  isTranscriptOpen,
  onTranscriptToggle,
  isCCOn,
  onCCToggle,
}: RoomHeaderProps) {
  const durationMin = plannedDuration && plannedDuration > 0 ? plannedDuration : 60
  const totalSeconds = durationMin * 60

  return (
    <header className="relative z-50 h-[56px] bg-gradient-to-r from-[#0f0f10] via-[#161618] to-[#0f0f10] border-b border-white/8 flex items-center justify-between px-4 gap-3 shrink-0 select-none backdrop-blur-xl w-full">
      {/* Left: Back + Room Info */}
      <div className="flex items-center gap-3 min-w-0 shrink">
        <Link
          to="/profile"
          className="w-9 h-9 rounded-xl hover:bg-white/8 text-white/50 hover:text-white transition-colors duration-150 shrink-0 flex items-center justify-center select-none transform-gpu backface-hidden"
        >
          <ChevronLeft size={18} className="shrink-0 pointer-events-none select-none" />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 shadow-sm shadow-red-500/10 shrink-0 select-none">
            <Circle size={6} className="text-red-500 fill-red-500 animate-pulse shrink-0 pointer-events-none" />
            <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest leading-none select-none">Live</span>
          </div>
          {isLoading && !roomTitle ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-48 h-4 rounded-md bg-white/10 animate-pulse" />
              <div className="w-20 h-5 rounded-full bg-[#0066cc]/20 border border-[#0066cc]/30 animate-pulse shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-white font-bold text-sm tracking-tight truncate max-w-[130px] sm:max-w-[200px] lg:max-w-[260px]">{roomTitle}</span>
              <span className="hidden xl:inline px-3 py-1 rounded-full bg-[#0066cc]/20 text-[#3894ff] text-[11px] font-bold border border-[#0066cc]/35 shadow-sm shadow-[#0066cc]/10 shrink-0 select-none">
                {subject}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Stage Mode Switcher */}
      <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-xl border border-white/8 shrink-0">
        {STAGE_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => onStageModeChange(mode.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer select-none outline-none transform-gpu backface-hidden ${
              stageMode === mode.key
                ? 'bg-[#0066cc] text-white shadow-lg shadow-[#0066cc]/25'
                : 'text-white/45 hover:text-white/75 hover:bg-white/6'
            }`}
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 select-none pointer-events-none">
              {mode.icon}
            </span>
            <span className="hidden lg:inline select-none">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Media Controls + Isolated Timer */}
      <div className="flex items-center gap-1.5 justify-end shrink-0">
        <RoomTimer
          durationMin={durationMin}
          totalSeconds={totalSeconds}
          sessionStartTime={sessionStartTime}
          sessionTypeLabel={sessionTypeLabel}
          plannedTimeStr={plannedTimeStr}
          onAutoEndSession={onAutoEndSession}
          participantCount={participantCount}
        />

        {/* 1. Mic Toggle */}
        <MediaBtn
          active={isMicOn}
          danger={!isMicOn}
          variant={isMicOn ? 'emerald' : 'default'}
          onClick={onMicToggle}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
        </MediaBtn>

        {/* 2. Camera Toggle */}
        <MediaBtn
          active={isCameraOn}
          danger={!isCameraOn}
          variant={isCameraOn ? 'emerald' : 'default'}
          onClick={onCameraToggle}
          title={isCameraOn ? 'Camera Off' : 'Camera On'}
        >
          {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
        </MediaBtn>

        {/* 3. Screen Share */}
        <MediaBtn
          active={isScreenSharing}
          variant="emerald"
          onClick={onScreenShareToggle}
          title={isScreenSharing ? 'Screen Sharing: ACTIVE (Click to Stop)' : 'Share Screen'}
        >
          <Monitor size={16} />
        </MediaBtn>

        <div className="w-px h-7 bg-white/8 mx-0.5" />

        {/* 4. Sidebar (Chat, People, Files) for BOTH Tutor and Student */}
        {onChatToggle && (
          <MediaBtn
            active={isChatOpen}
            variant="transcript"
            onClick={onChatToggle}
            title={isChatOpen ? 'Sidebar (Chat, People, Files): Open (Click to close)' : 'Open Chat, People & Files in sidebar'}
          >
            <MessageSquareText size={16} />
          </MediaBtn>
        )}

        {/* 5. Closed Captions (Live On-Screen Subtitles) */}
        {onCCToggle && (
          <MediaBtn
            active={isCCOn}
            variant="primary"
            onClick={onCCToggle}
            title={isCCOn ? 'Closed Captions: ON (Click to turn off)' : 'Closed Captions: OFF (Click to turn on)'}
          >
            {isCCOn ? <Captions size={16} /> : <CaptionsOff size={16} />}
          </MediaBtn>
        )}

        {/* 6. Live Speech Transcript */}
        {onTranscriptToggle && (
          <MediaBtn
            active={isTranscriptOpen}
            variant="transcript"
            onClick={onTranscriptToggle}
            title={isTranscriptOpen ? 'Session Transcript: OPEN in sidebar (Click to close)' : 'Open Session Transcript in sidebar'}
          >
            <ScrollText size={16} />
          </MediaBtn>
        )}

        {/* 7. Socrates AI Copilot */}
        <MediaBtn
          active={isAIOpen}
          variant="ai"
          onClick={onAIToggle}
          title={isAIOpen ? 'Socrates AI: ACTIVE in sidebar (Click to close)' : 'Open Socrates AI Copilot in sidebar'}
        >
          {isAIOpen ? <Sparkles size={16} /> : <Bot size={16} />}
        </MediaBtn>

        <div className="w-px h-7 bg-white/8 mx-0.5" />

        {/* 8. Leave Session */}
        <button
          type="button"
          onClick={onLeave}
          className="h-10 px-4 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center gap-1.5 border border-red-500/20 hover:border-red-500 select-none shrink-0 outline-none transform-gpu backface-hidden"
          title="Leave Session"
        >
          <LogOut size={14} className="shrink-0 pointer-events-none select-none" />
          <span className="hidden sm:inline select-none">Leave</span>
        </button>
      </div>
    </header>
  )
}
