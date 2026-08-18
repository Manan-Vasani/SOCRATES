import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, ChevronsLeftRight, ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import RoomHeader, { type StageMode } from '../components/study/RoomHeader'
import VideoGrid from '../components/study/VideoGrid'
import Whiteboard from '../components/study/Whiteboard'
import CodeSandbox from '../components/study/CodeSandbox'
import StudyRoomChat from '../components/study/StudyRoomChat'
import AIAssistantDrawer from '../components/study/AIAssistantDrawer'
import MeetingLobby from '../components/study/MeetingLobby'
import { useWebRTC } from '../hooks/useWebRTC'
import { useAuthStore } from '../store/useAuthStore'
import { fetchStudyRoom } from '../services/api'

export default function StudyRoom() {
  const { roomId, meetingId } = useParams<{ roomId?: string; meetingId?: string }>()
  const activeRoomId = meetingId || roomId || 'demo-101'
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [hasJoined, setHasJoined] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const [authorization, setAuthorization] = useState<{
    isAuthorized?: boolean
    reason?: string
    message?: string
    studentName?: string
  } | null>(null)

  // Fetch room metadata and authorization
  useEffect(() => {
    let matchedLocalSession: any = null
    try {
      const stored = localStorage.getItem('socrates_profile_sessions')
      if (stored) {
        const list = JSON.parse(stored)
        matchedLocalSession = list.find((s: any) => s.id === activeRoomId || s.meetingId === activeRoomId)
      }
    } catch (e) {}

    fetchStudyRoom(activeRoomId).then((res) => {
      const apiData = res?.data || {}
      const rawTitle = apiData.title || apiData.description || ''
      const isGeneric = !rawTitle || rawTitle.includes('sess-') || rawTitle.includes('Study Session (')
      const hostName = apiData.host?.fullName

      if (apiData.authorization) {
        setAuthorization(apiData.authorization)
      }

      setSessionDetails({
        subject: matchedLocalSession?.subject || (apiData.subject && apiData.subject !== 'Tutoring Session' ? apiData.subject : 'Linear Algebra'),
        topic: matchedLocalSession?.topic || (isGeneric ? 'Matrix Decompositions, Vector Spaces & Core Practice' : rawTitle),
        tutorName: matchedLocalSession?.tutorName || (hostName && hostName !== 'Tutor' ? hostName : 'Marcus Chen'),
        studentName: matchedLocalSession?.studentName || user?.name || 'Manan Vasani',
        dateStr: matchedLocalSession?.dateStr || 'Mon, Aug 17, 2026',
        timeStr: matchedLocalSession?.timeStr || '04:30 PM',
        fee: matchedLocalSession?.fee || 55,
        duration: matchedLocalSession?.duration || 60,
      })
    })
  }, [activeRoomId, user])

  const hasInitializedName = useRef(false)

  const [displayName, setDisplayName] = useState(() => {
    if (user?.fullName || user?.name) return user.fullName || user.name
    return ''
  })

  useEffect(() => {
    if (user && !hasInitializedName.current) {
      setDisplayName(user.fullName || user.name || 'User')
      hasInitializedName.current = true
    }
  }, [user])

  const currentUser = useMemo(() => {
    const fallbackName = user?.fullName || user?.name || guestName || 'Guest User'
    const finalName = displayName.trim() || fallbackName
    if (user) {
      return {
        id: user._id,
        name: finalName,
        role: (user.role === 'tutor' ? 'tutor' : 'student') as 'tutor' | 'student',
        avatar: user.profileImage || user.avatar,
      }
    }
    return {
      id: `guest-${finalName.replace(/\s+/g, '-').toLowerCase()}`,
      name: finalName,
      role: 'student' as const,
    }
  }, [user, displayName, guestName])

  const {
    localStream,
    participants,
    messages,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isHandRaised,
    connectionStatus,
    toggleMic,
    toggleCamera,
    toggleHandRaise,
    toggleScreenShare,
    sendMessage,
    leaveRoom,
    setParticipants,
  } = useWebRTC({
    roomId: activeRoomId,
    currentUser,
  })

  const [stageMode, setStageMode] = useState<StageMode>('split')
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const [leftPanelWidth, setLeftPanelWidth] = useState(340)
  const [rightPanelWidth, setRightPanelWidth] = useState(340)

  const isResizingLeft = useRef(false)
  const isResizingRight = useRef(false)
  const resizeStartX = useRef(0)
  const initialWidth = useRef(0)

  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingLeft.current = true
    resizeStartX.current = e.clientX
    initialWidth.current = leftPanelWidth
  }

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRight.current = true
    resizeStartX.current = e.clientX
    initialWidth.current = rightPanelWidth
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft.current) {
        const dx = e.clientX - resizeStartX.current
        setLeftPanelWidth(Math.max(220, Math.min(650, initialWidth.current + dx)))
      } else if (isResizingRight.current) {
        const dx = resizeStartX.current - e.clientX
        setRightPanelWidth(Math.max(240, Math.min(650, initialWidth.current + dx)))
      }
    }

    const handleMouseUp = () => {
      isResizingLeft.current = false
      isResizingRight.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handlePinParticipant = useCallback(
    (id: string) => {
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, isPinned: p.id === id ? !p.isPinned : false }))
      )
    },
    [setParticipants]
  )

  const handleShareLink = () => {
    const meetingUrl = `${window.location.origin}/meeting/${activeRoomId}`
    navigator.clipboard.writeText(meetingUrl)
    toast.success('Meeting link copied to clipboard!')
  }

  const handleLeave = () => setShowLeaveModal(true)
  const confirmLeave = () => {
    leaveRoom()
    setShowLeaveModal(false)
    navigate('/profile')
  }

  // Render Access Denied guard if user fails authorization
  if (authorization && authorization.isAuthorized === false) {
    return (
      <div className="min-h-screen w-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#e5e5e7] p-8 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Authorized Session Only
            </h2>
            <p className="text-sm text-[#7a7a7a] leading-relaxed">
              {authorization.message ||
                'This session is private. Only the student who booked this appointment and the assigned tutor are authorized to join.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#1d1d1f]">
              <ShieldAlert size={14} className="text-amber-500 shrink-0" />
              <span>Security Policy</span>
            </div>
            <p className="text-[#7a7a7a]">
              Session links are restricted to authorized participants to protect student privacy and preserve system integrity.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {!user ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-full h-11 px-6 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-sm transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck size={16} />
                <span>Sign in with Student Account</span>
              </button>
            ) : null}

            <button
              onClick={() => navigate('/tutors')}
              className="w-full h-11 px-6 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] font-semibold text-sm transition-colors duration-150 border border-[#e5e5e7] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Tutors</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Meeting Lobby preview if user has not clicked "Join Meeting"
  if (!hasJoined) {
    return (
      <MeetingLobby
        meetingId={activeRoomId}
        sessionDetails={sessionDetails}
        displayName={displayName}
        onNameChange={setDisplayName}
        isMicOn={isMicOn}
        onMicToggle={toggleMic}
        isCameraOn={isCameraOn}
        onCameraToggle={toggleCamera}
        localStream={localStream}
        onJoinMeeting={() => setHasJoined(true)}
      />
    )
  }

  const renderStage = () => {
    switch (stageMode) {
      case 'whiteboard':
        return (
          <div className="flex-1 min-h-0 flex bg-white">
            <Whiteboard />
          </div>
        )
      case 'code':
        return (
          <div className="flex-1 min-h-0 flex">
            <CodeSandbox />
          </div>
        )
      case 'grid':
        return (
          <div className="flex-1 min-h-0 bg-[#0a0a0c]">
            <VideoGrid participants={participants} onPinParticipant={handlePinParticipant} fullStage />
          </div>
        )
      case 'split':
      default:
        return (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            {/* Left: Video feeds */}
            <div
              style={{ width: `${leftPanelWidth}px` }}
              className="bg-[#0a0a0c] shrink-0 flex flex-col border-r border-white/5 relative"
            >
              <div className="flex-1 min-h-0">
                <VideoGrid participants={participants} onPinParticipant={handlePinParticipant} />
              </div>
              {/* Bottom mini status bar */}
              <div className="h-9 bg-[#0e0e12] border-t border-white/5 flex items-center justify-between px-3">
                <span className="text-[10px] text-white/40 font-medium tracking-wide uppercase">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} connected
                </span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {connectionStatus}
                </span>
              </div>
            </div>

            {/* Left Resizer Handle */}
            <div
              onMouseDown={handleLeftResizeStart}
              className="w-1 relative z-50 cursor-col-resize group flex items-center justify-center bg-[#0a0a0c] hover:bg-[#0066cc]/50 active:bg-[#0066cc] transition-colors select-none shrink-0"
              title="Drag to resize video panel"
            >
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-4 h-7 rounded-full bg-[#1d1d1f] border border-white/20 text-white/70 group-hover:text-white group-hover:bg-[#0066cc] flex items-center justify-center shadow-lg transition-colors opacity-90 group-hover:opacity-100 z-50">
                <ChevronsLeftRight size={10} />
              </div>
            </div>

            {/* Right: Active workspace */}
            <div className="flex-1 min-w-0 flex bg-white">
              <Whiteboard />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0c] overflow-hidden select-none">
      {/* Top Header Bar */}
      <RoomHeader
        roomTitle={sessionDetails?.topic || `Study Room — ${activeRoomId}`}
        subject={sessionDetails?.subject || 'Mathematics'}
        participantCount={participants.length}
        stageMode={stageMode}
        onStageModeChange={setStageMode}
        isMicOn={isMicOn}
        onMicToggle={toggleMic}
        isCameraOn={isCameraOn}
        onCameraToggle={toggleCamera}
        isScreenSharing={isScreenSharing}
        onScreenShareToggle={toggleScreenShare}
        isHandRaised={isHandRaised}
        onHandRaise={toggleHandRaise}
        onAIToggle={() => {
          if (!isAIOpen) {
            setIsAIOpen(true)
            setIsChatOpen(true)
          } else {
            setIsAIOpen(false)
          }
        }}
        onLeave={handleLeave}
        isChatOpen={isChatOpen}
        onChatToggle={() => {
          if (!isChatOpen) {
            setIsChatOpen(true)
            setIsAIOpen(false)
          } else {
            setIsChatOpen(false)
          }
        }}
        onShareLink={activeRoomId.startsWith('sess-') ? undefined : handleShareLink}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Stage Area */}
        <div className="flex-1 min-w-0 flex flex-col">{renderStage()}</div>

        {/* Right Resizer Handle */}
        {isChatOpen && (
          <div
            onMouseDown={handleRightResizeStart}
            className="w-1 relative z-50 cursor-col-resize group flex items-center justify-center bg-[#e5e5e7] hover:bg-[#0066cc]/50 active:bg-[#0066cc] transition-colors select-none shrink-0"
            title="Drag to resize sidebar"
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-4 h-7 rounded-full bg-white border border-[#e5e5e7] text-[#525252] group-hover:text-white group-hover:bg-[#0066cc] flex items-center justify-center shadow-lg transition-colors opacity-90 group-hover:opacity-100 z-50">
              <ChevronsLeftRight size={10} />
            </div>
          </div>
        )}

        {/* Right Sidebar: Chat / Socrates AI */}
        {isChatOpen && (
          <div
            style={{ width: `${rightPanelWidth}px` }}
            className="shrink-0 flex border-l border-[#e5e5e7] bg-white relative max-w-full z-30"
          >
            {isAIOpen ? (
              <AIAssistantDrawer isOpen={true} onClose={() => setIsAIOpen(false)} />
            ) : (
              <StudyRoomChat
                participants={participants}
                messages={messages}
                onSendMessage={sendMessage}
              />
            )}
          </div>
        )}
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl p-7 w-full max-w-sm mx-4 space-y-5 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1d1d1f]">Leave Session?</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#f0f0f2] text-[#7a7a7a] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[#525252] leading-relaxed">
              Are you sure you want to leave this study session? You can rejoin later using the same room link.
            </p>
            <div className="flex gap-2.5 justify-end pt-1">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-5 py-2.5 rounded-xl border border-[#e5e5e7] text-sm font-medium text-[#525252] hover:bg-[#f5f5f7] transition-all cursor-pointer"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
