import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Bot,
  LogOut,
  LayoutGrid,
  Columns2,
  PenTool,
  Code2,
  ChevronLeft,
  Circle,
  Users,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
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
  isHandRaised: boolean
  onHandRaise: () => void
  onAIToggle: () => void
  onLeave: () => void
  isChatOpen: boolean
  onChatToggle: () => void
}

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
  isHandRaised,
  onHandRaise,
  onAIToggle,
  onLeave,
  isChatOpen,
  onChatToggle,
}: RoomHeaderProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const stageModes: { key: StageMode; icon: React.ReactNode; label: string }[] = [
    { key: 'split', icon: <Columns2 size={14} />, label: 'Split View' },
    { key: 'whiteboard', icon: <PenTool size={14} />, label: 'Whiteboard' },
    { key: 'code', icon: <Code2 size={14} />, label: 'Code IDE' },
    { key: 'grid', icon: <LayoutGrid size={14} />, label: 'Gallery' },
  ]

  const MediaBtn = ({
    active,
    danger,
    accent,
    onClick,
    title,
    children,
  }: {
    active?: boolean
    danger?: boolean
    accent?: boolean
    onClick: () => void
    title: string
    children: React.ReactNode
  }) => (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all duration-150 cursor-pointer transform-gpu backface-hidden ${
        danger
          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
          : accent
            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
            : active
              ? 'bg-white/12 text-white hover:bg-white/18 border border-white/10'
              : 'bg-white/6 text-white/50 hover:bg-white/12 hover:text-white/80 border border-white/5'
      }`}
      title={title}
    >
      {children}
    </button>
  )

  return (
    <header className="h-[56px] bg-gradient-to-r from-[#0f0f10] via-[#161618] to-[#0f0f10] border-b border-white/8 flex items-center justify-between px-4 gap-3 shrink-0 select-none backdrop-blur-xl">
      {/* Left: Back + Room Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link
          to="/profile"
          className="p-2 rounded-xl hover:bg-white/8 text-white/50 hover:text-white transition-all"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 shadow-sm shadow-red-500/10 shrink-0">
            <Circle size={6} className="text-red-500 fill-red-500 animate-pulse" />
            <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest leading-none">Live</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight truncate max-w-[260px]">{roomTitle}</span>
          <span className="px-3 py-1 rounded-full bg-[#0066cc]/20 text-[#3894ff] text-[11px] font-bold border border-[#0066cc]/35 shadow-sm shadow-[#0066cc]/10 shrink-0">
            {subject}
          </span>
        </div>
      </div>

      {/* Center: Stage Mode Switcher */}
      <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-xl border border-white/8">
        {stageModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onStageModeChange(mode.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none transform-gpu backface-hidden ${
              stageMode === mode.key
                ? 'bg-[#0066cc] text-white shadow-lg shadow-[#0066cc]/25'
                : 'text-white/45 hover:text-white/75 hover:bg-white/6'
            }`}
          >
            {mode.icon}
            <span className="hidden lg:inline">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Media Controls + Timer */}
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        <div className="hidden sm:flex items-center gap-2 mr-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/6 border border-white/10 text-white/90 text-xs font-mono font-semibold tabular-nums tracking-wide shadow-2xs">
            <Clock size={13} className="text-white/60" />
            <span>{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/6 border border-white/10 text-white/90 text-xs font-semibold shadow-2xs">
            <Users size={13} className="text-white/60" />
            <span>{participantCount}</span>
          </div>
        </div>

        <MediaBtn active={isMicOn} danger={!isMicOn} onClick={onMicToggle} title={isMicOn ? 'Mute' : 'Unmute'}>
          {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
        </MediaBtn>
        <MediaBtn active={isCameraOn} danger={!isCameraOn} onClick={onCameraToggle} title={isCameraOn ? 'Camera Off' : 'Camera On'}>
          {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
        </MediaBtn>
        <MediaBtn accent={isScreenSharing} onClick={onScreenShareToggle} title="Share Screen">
          <Monitor size={16} />
        </MediaBtn>

        <div className="w-px h-7 bg-white/8 mx-0.5" />

        <MediaBtn active={isHandRaised} onClick={onHandRaise} title="Raise Hand">
          <Hand size={16} />
        </MediaBtn>
        <MediaBtn onClick={onAIToggle} title="Socrates AI">
          <Bot size={16} />
        </MediaBtn>
        <MediaBtn active={isChatOpen} onClick={onChatToggle} title="Toggle Chat">
          {isChatOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </MediaBtn>

        <div className="w-px h-7 bg-white/8 mx-0.5" />

        <button
          onClick={onLeave}
          className="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border border-red-500/20 hover:border-red-500"
          title="Leave Session"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  )
}

function Clock({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
