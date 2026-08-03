import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, ChevronsLeftRight } from 'lucide-react'
import RoomHeader, { type StageMode } from '../components/study/RoomHeader'
import VideoGrid from '../components/study/VideoGrid'
import Whiteboard from '../components/study/Whiteboard'
import CodeSandbox from '../components/study/CodeSandbox'
import StudyRoomChat from '../components/study/StudyRoomChat'
import AIAssistantDrawer from '../components/study/AIAssistantDrawer'

const DEMO_PARTICIPANTS = [
  {
    id: 'tutor-1',
    name: 'Dr. Alex Vance',
    role: 'tutor' as const,
    isMuted: false,
    isCameraOff: false,
    isSpeaking: true,
    isPinned: false,
    isHandRaised: false,
  },
  {
    id: 'student-1',
    name: 'You',
    role: 'student' as const,
    isMuted: false,
    isCameraOff: true,
    isSpeaking: false,
    isPinned: false,
    isHandRaised: false,
  },
]

export default function StudyRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const [stageMode, setStageMode] = useState<StageMode>('split')
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [participants, setParticipants] = useState(DEMO_PARTICIPANTS)

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

  const handlePinParticipant = useCallback((id: string) => {
    setParticipants((prev) =>
      prev.map((p) => ({ ...p, isPinned: p.id === id ? !p.isPinned : false }))
    )
  }, [])

  const handleLeave = () => setShowLeaveModal(true)
  const confirmLeave = () => {
    setShowLeaveModal(false)
    navigate('/profile')
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
              {/* Bottom mini controls for video section */}
              <div className="h-9 bg-[#0e0e12] border-t border-white/5 flex items-center justify-center">
                <span className="text-[10px] text-white/20 font-medium tracking-wide uppercase">
                  {participants.length} participant{participants.length > 1 ? 's' : ''} connected
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
        roomTitle={`Study Room — ${roomId || 'demo-101'}`}
        subject="Mathematics"
        participantCount={participants.length}
        stageMode={stageMode}
        onStageModeChange={setStageMode}
        isMicOn={isMicOn}
        onMicToggle={() => setIsMicOn(!isMicOn)}
        isCameraOn={isCameraOn}
        onCameraToggle={() => setIsCameraOn(!isCameraOn)}
        isScreenSharing={isScreenSharing}
        onScreenShareToggle={() => setIsScreenSharing(!isScreenSharing)}
        isHandRaised={isHandRaised}
        onHandRaise={() => setIsHandRaised(!isHandRaised)}
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
              <StudyRoomChat participants={participants} />
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
