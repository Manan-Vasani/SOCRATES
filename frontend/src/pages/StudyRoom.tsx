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
import PermissionGuideModal from '../components/study/PermissionGuideModal'
import { useScrollLock } from '../hooks/useScrollLock'
import { useWebRTC } from '../hooks/useWebRTC'
import { useAuthStore } from '../store/useAuthStore'
import {
  fetchStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  endStudyRoom,
  fetchStudyRoomMessages,
  fetchStudyRoomTranscript,
} from '../services/api'
import { useSpeechTranscription, type TranscriptEntry } from '../hooks/useSpeechTranscription'
import LiveTranscriptDrawer from '../components/study/LiveTranscriptDrawer'

function resolveSessionTypeAndDuration(data: any, activeRoomId: string): { sessionType: 'quick-doubt' | 'concept-review' | 'full-session'; sessionTypeLabel: string; duration: 20 | 30 | 60 } {
  const rawDuration = Number(data?.duration)
  if (!isNaN(rawDuration) && rawDuration > 0) {
    if (rawDuration <= 25) return { sessionType: 'quick-doubt', sessionTypeLabel: 'Quick Doubt', duration: 20 }
    if (rawDuration <= 45) return { sessionType: 'concept-review', sessionTypeLabel: 'Concept Review', duration: 30 }
    return { sessionType: 'full-session', sessionTypeLabel: 'Full Session', duration: 60 }
  }

  const tag = (data?.tag || '').toLowerCase()
  const topic = (data?.topic || data?.title || '').toLowerCase()
  const subject = (data?.subject || '').toLowerCase()
  const combined = `${tag} ${topic} ${subject}`

  if (combined.includes('quick') || combined.includes('doubt') || combined.includes('20 min') || combined.includes('lightning')) {
    return { sessionType: 'quick-doubt', sessionTypeLabel: 'Quick Doubt', duration: 20 }
  }
  if (combined.includes('concept') || combined.includes('review') || combined.includes('30 min') || combined.includes('consultation')) {
    return { sessionType: 'concept-review', sessionTypeLabel: 'Concept Review', duration: 30 }
  }

  if (activeRoomId === 'sess-103') {
    return { sessionType: 'concept-review', sessionTypeLabel: 'Concept Review', duration: 30 }
  }

  return { sessionType: 'full-session', sessionTypeLabel: 'Full Session', duration: 60 }
}

export default function StudyRoom() {
  const { roomId, meetingId } = useParams<{ roomId?: string; meetingId?: string }>()
  const activeRoomId = meetingId || roomId || 'demo-101'
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [hasJoined, setHasJoined] = useState(() => {
    try {
      return sessionStorage.getItem(`socrates_room_joined_${activeRoomId}`) === 'true'
    } catch {
      return false
    }
  })
  const [guestName, setGuestName] = useState('')
  const [sessionDetails, setSessionDetails] = useState<any>(() => {
    try {
      const cached = sessionStorage.getItem(`socrates_room_details_${activeRoomId}`)
      if (cached) return JSON.parse(cached)
      const stored = localStorage.getItem('socrates_profile_sessions')
      if (stored) {
        const list = JSON.parse(stored)
        const matched = list.find((s: any) => s.id === activeRoomId || s.meetingId === activeRoomId)
        if (matched) {
          const typeInfo = resolveSessionTypeAndDuration(matched, activeRoomId)
          return { ...matched, duration: typeInfo.duration, sessionTypeLabel: typeInfo.sessionTypeLabel }
        }
      }
    } catch {}
    return null
  })
  const [isDetailsLoading, setIsDetailsLoading] = useState(!sessionDetails)
  const [authorization, setAuthorization] = useState<{
    isAuthorized?: boolean
    reason?: string
    message?: string
    studentName?: string
  } | null>(null)

  const hasInitializedName = useRef(false)

  const [displayName, setDisplayName] = useState(() => {
    if (user?.fullName || user?.name) return user.fullName || user.name
    return ''
  })

  useEffect(() => {
    if (hasJoined) {
      document.documentElement.classList.add('no-scrollbar')
      document.body.classList.add('no-scrollbar')
      const originalGutter = document.documentElement.style.scrollbarGutter
      document.documentElement.style.scrollbarGutter = 'auto'

      return () => {
        document.documentElement.classList.remove('no-scrollbar')
        document.body.classList.remove('no-scrollbar')
        document.documentElement.style.scrollbarGutter = originalGutter
      }
    }
  }, [hasJoined])

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

  // Persistent session start timestamp: remains stable across page refreshes
  const sessionStartTime = useMemo(() => {
    try {
      const key = `socrates_session_start_${activeRoomId}`
      const existing = sessionStorage.getItem(key)
      if (existing) {
        const parsed = parseInt(existing, 10)
        if (!isNaN(parsed)) return parsed
      }
      const now = Date.now()
      sessionStorage.setItem(key, String(now))
      return now
    } catch {
      return Date.now()
    }
  }, [activeRoomId])

  const {
    socket,
    localStream,
    participants,
    messages,
    socketRef,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isHandRaised,
    connectionStatus,
    hasWhiteboardPermission,
    whiteboardRequests,
    whiteboardPermissionsMap,
    toggleMic,
    toggleCamera,
    toggleHandRaise,
    toggleScreenShare,
    muteParticipant,
    requestWhiteboardPermission,
    grantWhiteboardPermission,
    revokeWhiteboardPermission,
    denyWhiteboardRequest,
    sendMessage,
    leaveRoom,
    setParticipants,
    setMessages,
    permissionDeniedType,
    setPermissionDeniedType,
  } = useWebRTC({
    roomId: activeRoomId,
    currentUser,
  })

  // Fetch room metadata, authorization and chat history
  useEffect(() => {
    setIsDetailsLoading(true)
    let matchedLocalSession: any = null
    try {
      const stored = localStorage.getItem('socrates_profile_sessions')
      if (stored) {
        const list = JSON.parse(stored)
        matchedLocalSession = list.find((s: any) => s.id === activeRoomId || s.meetingId === activeRoomId)
      }
    } catch (e) {}

    fetchStudyRoom(activeRoomId)
      .then((res) => {
        const apiData = res?.data || {}
        const rawTitle = apiData.title || apiData.description || ''
        const isGeneric = !rawTitle || rawTitle.includes('sess-') || rawTitle.includes('Study Session (')
        const hostName = apiData.host?.fullName || apiData.tutorName

        if (apiData.authorization) {
          setAuthorization(apiData.authorization)
        }

        const typeInfo = resolveSessionTypeAndDuration(
          matchedLocalSession || apiData,
          activeRoomId
        )

        const finalDetails = {
          subject:
            matchedLocalSession?.subject ||
            (apiData.subject && apiData.subject !== 'Tutoring Session' ? apiData.subject : 'Linear Algebra'),
          topic:
            matchedLocalSession?.topic ||
            (isGeneric ? 'Matrix Decompositions, Vector Spaces & Core Practice' : rawTitle),
          tutorName:
            matchedLocalSession?.tutorName ||
            (hostName && hostName !== 'Tutor' ? hostName : 'Marcus Chen'),
          studentName: matchedLocalSession?.studentName || apiData.studentName || user?.fullName || user?.name || 'Student',
          dateStr: matchedLocalSession?.dateStr || apiData.dateStr || 'Mon, Aug 17, 2026',
          timeStr: matchedLocalSession?.timeStr || apiData.timeStr || '04:30 PM',
          fee: matchedLocalSession?.fee || apiData.fee || 55,
          duration: typeInfo.duration,
          sessionType: typeInfo.sessionType,
          sessionTypeLabel: typeInfo.sessionTypeLabel,
        }
        setSessionDetails(finalDetails)
        try {
          sessionStorage.setItem(`socrates_room_details_${activeRoomId}`, JSON.stringify(finalDetails))
        } catch {}
        setIsDetailsLoading(false)
      })
      .catch(() => {
        setIsDetailsLoading(false)
      })

    // Fetch existing room chat history from MongoDB
    fetchStudyRoomMessages(activeRoomId)
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const rawMessages = res.data.map((m: any) => ({
            id: m._id || String(Date.now()),
            sender: m.sender?.fullName || m.sender?.name || 'Participant',
            senderId: m.sender?._id || m.sender,
            role: m.sender?.role === 'tutor' ? 'tutor' : m.type === 'system' ? 'system' : 'student',
            text: m.text,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
          // Deduplicate consecutive identical system messages
          const dedupedMessages: any[] = []
          rawMessages.forEach((msg: any) => {
            const last = dedupedMessages[dedupedMessages.length - 1]
            if (msg.role === 'system' && last && last.role === 'system' && last.text === msg.text) {
              return
            }
            dedupedMessages.push(msg)
          })

          setMessages((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const filtered = dedupedMessages.filter((m: any) => !existingIds.has(m.id))
            return [...filtered, ...prev]
          })
        }
      })
      .catch(() => {})
  }, [activeRoomId, user, setMessages])

  const [stageMode, setStageMode] = useState<StageMode>('split')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'ai' | 'transcript'>('chat')
  const [isCCOn, setIsCCOn] = useState(true)
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([])
  const [activeCCEntry, setActiveCCEntry] = useState<TranscriptEntry | null>(null)
  const ccTimeoutRef = useRef<any>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  useScrollLock(showLeaveModal)

  // Fetch initial room transcript from MongoDB
  useEffect(() => {
    if (!activeRoomId) return
    fetchStudyRoomTranscript(activeRoomId).then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setTranscriptEntries(res.data)
      }
    })
  }, [activeRoomId])

  // Handle new local speech transcription
  const handleNewLocalTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscriptEntries((prev) => [...prev, entry])
    setActiveCCEntry(entry)
    if (ccTimeoutRef.current) clearTimeout(ccTimeoutRef.current)
    ccTimeoutRef.current = setTimeout(() => setActiveCCEntry(null), 5000)
  }, [])

  // Hook into browser SpeechRecognition whenever mic is unmuted
  const {
    isListening: isSpeechListening,
    interimText,
    speechError,
    isSoundDetected,
    micVolume,
    restartRecognition,
  } = useSpeechTranscription({
    roomId: activeRoomId,
    isMicOn,
    currentUser: {
      id: currentUser.id,
      name: currentUser.name,
      role: (currentUser.role as any) || 'student',
    },
    socket,
    onNewLocalTranscript: handleNewLocalTranscript,
    localStream,
  })

  // Listen for speech transcript segments from other members via Socket.IO
  useEffect(() => {
    if (!socket) return

    const handleRemoteTranscript = (entry: TranscriptEntry) => {
      if (entry.speakerName !== currentUser.name) {
        setTranscriptEntries((prev) => [...prev, entry])
      }
      setActiveCCEntry(entry)
      if (ccTimeoutRef.current) clearTimeout(ccTimeoutRef.current)
      ccTimeoutRef.current = setTimeout(() => setActiveCCEntry(null), 5000)
    }

    socket.on('live-transcript-entry', handleRemoteTranscript)
    return () => {
      socket.off('live-transcript-entry', handleRemoteTranscript)
    }
  }, [socket, currentUser.name])

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
    try {
      sessionStorage.removeItem(`socrates_room_joined_${activeRoomId}`)
      sessionStorage.removeItem(`socrates_room_details_${activeRoomId}`)
    } catch {}
    leaveStudyRoom(activeRoomId).catch(() => {})
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
        isDetailsLoading={isDetailsLoading}
        displayName={displayName}
        onNameChange={setDisplayName}
        isMicOn={isMicOn}
        onMicToggle={toggleMic}
        isCameraOn={isCameraOn}
        onCameraToggle={toggleCamera}
        localStream={localStream}
        permissionDeniedType={permissionDeniedType}
        onClearPermissionDenied={() => setPermissionDeniedType(null)}
        onJoinMeeting={async () => {
          if (user) {
            await joinStudyRoom(activeRoomId).catch(() => {})
          }
          try {
            sessionStorage.setItem(`socrates_room_joined_${activeRoomId}`, 'true')
          } catch {}
          setHasJoined(true)
        }}
      />
    )
  }

  const renderStage = () => {
    switch (stageMode) {
      case 'whiteboard':
        return (
          <div className="flex-1 min-h-0 flex bg-white">
            <Whiteboard
              canDraw={currentUser.role === 'tutor' || hasWhiteboardPermission}
              isTutor={currentUser.role === 'tutor'}
              socket={socket}
              socketRef={socketRef}
              roomId={activeRoomId}
              onRequestPermission={requestWhiteboardPermission}
              onGrantPermission={grantWhiteboardPermission}
              onRevokePermission={revokeWhiteboardPermission}
              whiteboardRequests={whiteboardRequests}
              onDenyRequest={denyWhiteboardRequest}
            />
          </div>
        )
      case 'code':
        return (
          <div className="flex-1 min-h-0 flex">
            <CodeSandbox
              socket={socket}
              socketRef={socketRef}
              roomId={activeRoomId}
              runnerName={currentUser.name}
            />
          </div>
        )
      case 'grid':
        return (
          <div className="flex-1 min-h-0 bg-[#0a0a0c]">
            <VideoGrid
              participants={participants}
              onPinParticipant={handlePinParticipant}
              onMuteParticipant={muteParticipant}
              currentUserRole={currentUser.role}
              fullStage
            />
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
                <VideoGrid
                  participants={participants}
                  onPinParticipant={handlePinParticipant}
                  onMuteParticipant={muteParticipant}
                  currentUserRole={currentUser.role}
                />
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
              <Whiteboard
                canDraw={currentUser.role === 'tutor' || hasWhiteboardPermission}
                isTutor={currentUser.role === 'tutor'}
                socket={socket}
                socketRef={socketRef}
                roomId={activeRoomId}
                onRequestPermission={requestWhiteboardPermission}
                onGrantPermission={grantWhiteboardPermission}
                onRevokePermission={revokeWhiteboardPermission}
                whiteboardRequests={whiteboardRequests}
                onDenyRequest={denyWhiteboardRequest}
              />
            </div>
          </div>
        )
    }
  }

  // Listen for live session duration updates from tutor
  useEffect(() => {
    if (!socket) return

    const handleDurationChange = (data: { duration: number; sessionTypeLabel?: string; updatedBy?: string }) => {
      setSessionDetails((prev: any) => {
        if (!prev) return prev
        const updated = {
          ...prev,
          duration: data.duration,
          sessionTypeLabel: data.sessionTypeLabel || `${data.duration}m Session`,
        }
        try {
          sessionStorage.setItem(`socrates_room_details_${activeRoomId}`, JSON.stringify(updated))
        } catch {}
        return updated
      })
      toast.info(
        data.updatedBy
          ? `${data.updatedBy} updated session to ${data.duration} min (${data.sessionTypeLabel || 'Session'})`
          : `Session duration updated to ${data.duration} min`
      )
    }

    socket.on('session-duration-change', handleDurationChange)
    return () => {
      socket.off('session-duration-change', handleDurationChange)
    }
  }, [socket, activeRoomId])

  const handleUpdateDuration = useCallback((newDuration: number, newLabel: string) => {
    setSessionDetails((prev: any) => {
      if (!prev) return prev
      const updated = { ...prev, duration: newDuration, sessionTypeLabel: newLabel }
      try {
        sessionStorage.setItem(`socrates_room_details_${activeRoomId}`, JSON.stringify(updated))
      } catch {}
      return updated
    })

    if (socket) {
      socket.emit('session-duration-change', {
        roomId: activeRoomId,
        duration: newDuration,
        sessionTypeLabel: newLabel,
        updatedBy: currentUser.name,
      })
    }
    toast.success(`Session updated to ${newDuration} min (${newLabel})`)
  }, [socket, activeRoomId, currentUser.name])

  // Listen for session ended broadcast from tutor or server auto-end
  useEffect(() => {
    if (!socket) return

    const handleSessionEnded = (data?: { reason?: string }) => {
      try {
        sessionStorage.removeItem(`socrates_room_joined_${activeRoomId}`)
        sessionStorage.removeItem(`socrates_room_details_${activeRoomId}`)
        sessionStorage.removeItem(`socrates_session_start_${activeRoomId}`)
      } catch {}

      toast.info(data?.reason ? `Session concluded: ${data.reason}` : 'Study session officially concluded by tutor.')
      leaveRoom()
      navigate('/profile')
    }

    socket.on('study-session-ended-by-tutor', handleSessionEnded)
    return () => {
      socket.off('study-session-ended-by-tutor', handleSessionEnded)
    }
  }, [socket, activeRoomId, leaveRoom, navigate])

  const handleAutoEndSession = useCallback(async () => {
    try {
      sessionStorage.removeItem(`socrates_room_joined_${activeRoomId}`)
      sessionStorage.removeItem(`socrates_room_details_${activeRoomId}`)
      sessionStorage.removeItem(`socrates_session_start_${activeRoomId}`)
    } catch {}

    toast.warning('Session concluded. The 1-minute wrap-up window has ended.', {
      duration: 5000,
    })

    if (currentUser.role === 'tutor') {
      try {
        await endStudyRoom(activeRoomId)
      } catch {}
      if (socket) {
        socket.emit('end-study-session', {
          roomId: activeRoomId,
          reason: '1-minute wrap-up window completed',
        })
      }
    }

    leaveRoom()
    navigate('/profile')
  }, [activeRoomId, currentUser.role, socket, leaveRoom, navigate])

  const handleEndSession = async () => {
    try {
      sessionStorage.removeItem(`socrates_room_joined_${activeRoomId}`)
      sessionStorage.removeItem(`socrates_room_details_${activeRoomId}`)
      sessionStorage.removeItem(`socrates_session_start_${activeRoomId}`)
    } catch {}
    try {
      await endStudyRoom(activeRoomId)
      toast.success('Study session ended. Session recaps dispatched to all participants!')
    } catch (e) {}
    if (socket) {
      socket.emit('end-study-session', {
        roomId: activeRoomId,
        reason: 'Concluded by tutor',
      })
    }
    leaveRoom()
    setShowLeaveModal(false)
    navigate('/profile')
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0c] overflow-hidden select-none">
      {/* Top Header Bar */}
      <RoomHeader
        roomTitle={sessionDetails?.topic || ''}
        subject={sessionDetails?.subject || ''}
        isLoading={isDetailsLoading && !sessionDetails}
        participantCount={participants.length}
        plannedDuration={sessionDetails?.duration || 60}
        sessionTypeLabel={sessionDetails?.sessionTypeLabel}
        plannedTimeStr={sessionDetails?.timeStr}
        plannedDateStr={sessionDetails?.dateStr}
        sessionStartTime={sessionStartTime}
        onAutoEndSession={handleAutoEndSession}
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
        isAIOpen={isChatOpen && sidebarTab === 'ai'}
        onAIToggle={() => {
          if (isChatOpen && sidebarTab === 'ai') {
            setIsChatOpen(false)
          } else {
            setSidebarTab('ai')
            setIsChatOpen(true)
          }
        }}
        onLeave={handleLeave}
        isChatOpen={isChatOpen && sidebarTab === 'chat'}
        onChatToggle={() => {
          if (isChatOpen && sidebarTab === 'chat') {
            setIsChatOpen(false)
          } else {
            setSidebarTab('chat')
            setIsChatOpen(true)
          }
        }}
        isTranscriptOpen={isChatOpen && sidebarTab === 'transcript'}
        onTranscriptToggle={() => {
          if (isChatOpen && sidebarTab === 'transcript') {
            setIsChatOpen(false)
          } else {
            setSidebarTab('transcript')
            setIsChatOpen(true)
          }
        }}
        isCCOn={isCCOn}
        onCCToggle={() => setIsCCOn((v) => !v)}
        onShareLink={activeRoomId.startsWith('sess-') ? undefined : handleShareLink}
        currentUserRole={currentUser.role}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative z-0">
        {/* Stage Area */}
        <div className="flex-1 min-w-0 flex flex-col relative">
          {renderStage()}

          {/* Floating Closed Captions (Live Subtitles) */}
          {isCCOn && (Boolean(interimText) || Boolean(activeCCEntry)) && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-xl px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 shadow-2xl text-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                    (interimText ? currentUser.role === 'tutor' : activeCCEntry?.role === 'tutor')
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {interimText ? (currentUser.role === 'tutor' ? 'Tutor' : 'Student') : (activeCCEntry?.role === 'tutor' ? 'Tutor' : 'Student')}
                </span>
                <span className="text-xs font-bold text-white/90">
                  {interimText ? `${currentUser.name} (Speaking)` : activeCCEntry?.speakerName}
                </span>
              </div>
              <p className="text-xs text-white/95 font-medium leading-relaxed">
                "{interimText || activeCCEntry?.text}"
              </p>
            </div>
          )}
        </div>

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

        {/* Right Sidebar: Chat / Socrates AI / Transcript */}
        {isChatOpen && (
          <div
            style={{ width: `${rightPanelWidth}px` }}
            className="shrink-0 flex flex-col h-full overflow-hidden border-l border-[#e5e5e7] bg-white relative max-w-full z-30"
          >
            {sidebarTab === 'ai' ? (
              <AIAssistantDrawer
                isOpen={true}
                onClose={() => setSidebarTab('chat')}
                roomId={activeRoomId}
                activeTopic={sessionDetails?.topic || sessionDetails?.subject || 'Mathematics'}
                isHandRaised={isHandRaised}
                onHandRaise={toggleHandRaise}
                currentUserRole={currentUser.role}
              />
            ) : sidebarTab === 'transcript' ? (
              <LiveTranscriptDrawer
                isOpen={true}
                onClose={() => setSidebarTab('chat')}
                entries={transcriptEntries}
                interimText={interimText}
                currentUserName={currentUser.name}
                isMicOn={isMicOn}
                speechError={speechError}
                isSoundDetected={isSoundDetected}
                micVolume={micVolume}
                onRestartSpeech={restartRecognition}
                onAddManualTranscript={(text) => {
                  const entry: TranscriptEntry = {
                    speakerId: currentUser.id,
                    speakerName: currentUser.name,
                    role: (currentUser.role as any) || 'student',
                    text,
                    timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().toISOString(),
                  }
                  if (socket) {
                    socket.emit('speech-transcript-segment', {
                      roomId: activeRoomId,
                      speakerId: currentUser.id,
                      speakerName: currentUser.name,
                      role: currentUser.role,
                      text,
                    })
                  }
                  handleNewLocalTranscript(entry)
                }}
              />
            ) : (
              <StudyRoomChat
                participants={participants}
                messages={messages}
                onSendMessage={sendMessage}
                currentUserRole={currentUser.role}
                onGrantWhiteboardPermission={grantWhiteboardPermission}
                onRevokeWhiteboardPermission={revokeWhiteboardPermission}
                whiteboardPermissionsMap={whiteboardPermissionsMap}
                isHandRaised={isHandRaised}
                onHandRaise={toggleHandRaise}
                onMuteParticipant={muteParticipant}
              />
            )}
          </div>
        )}
      </div>

      {/* Leave / End Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl p-7 w-full max-w-sm mx-4 space-y-5 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1d1d1f]">
                {currentUser.role === 'tutor' ? 'Manage Study Session' : 'Leave Session?'}
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#f0f0f2] text-[#7a7a7a] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[#525252] leading-relaxed">
              {currentUser.role === 'tutor'
                ? 'Would you like to temporarily step out or officially conclude the session and dispatch summary recaps to all learners?'
                : 'Are you sure you want to leave this study session? You can rejoin later using the same room link.'}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              {currentUser.role === 'tutor' && (
                <button
                  onClick={handleEndSession}
                  className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all cursor-pointer shadow-lg shadow-red-500/20"
                >
                  End Session & Dispatch Recaps
                </button>
              )}
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e5e5e7] text-sm font-medium text-[#525252] hover:bg-[#f5f5f7] transition-all cursor-pointer"
                >
                  Stay
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 py-2.5 rounded-xl bg-[#1d1d1f] hover:bg-black text-white text-sm font-bold transition-all cursor-pointer"
                >
                  {currentUser.role === 'tutor' ? 'Step Out' : 'Leave Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Meet / Apple Style Browser Permission Block Guidance Modal */}
      <PermissionGuideModal
        isOpen={Boolean(permissionDeniedType)}
        deviceType={permissionDeniedType}
        onClose={() => setPermissionDeniedType(null)}
        onRetry={() => {
          if (permissionDeniedType === 'camera') {
            toggleCamera()
          } else {
            toggleMic()
          }
        }}
      />
    </div>
  )
}
