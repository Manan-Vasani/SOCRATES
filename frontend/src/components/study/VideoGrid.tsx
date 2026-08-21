import React, { useCallback, useEffect, useRef } from 'react'
import { Mic, MicOff, VideoOff, Pin, Hand, Monitor } from 'lucide-react'

export interface Participant {
  id: string
  socketId?: string
  name: string
  role: 'tutor' | 'student'
  avatar?: string
  stream?: MediaStream
  isMuted: boolean
  isCameraOff: boolean
  isSpeaking: boolean
  isPinned: boolean
  isHandRaised?: boolean
  isScreenSharing?: boolean
}

interface VideoGridProps {
  participants: Participant[]
  onPinParticipant: (id: string) => void
  onMuteParticipant?: (id: string) => void
  currentUserRole?: 'tutor' | 'student'
  fullStage?: boolean
}

const GRADIENT_AVATARS: Record<string, string> = {
  tutor: 'from-emerald-500 to-teal-600',
  student: 'from-[#0066cc] to-indigo-600',
}

function VideoTile({
  p,
  large = false,
  onPinParticipant,
  onMuteParticipant,
  currentUserRole,
}: {
  p: Participant
  large?: boolean
  onPinParticipant: (id: string) => void
  onMuteParticipant?: (id: string) => void
  currentUserRole?: 'tutor' | 'student'
}) {
  const isSelf = p.name.includes('(You)')
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current && p.stream) {
      if (videoRef.current.srcObject !== p.stream) {
        videoRef.current.srcObject = p.stream
      }
      videoRef.current
        .play()
        .catch((err) => {
          console.warn('[VideoTile] Video play warning:', err)
        })
    }
  }, [p.stream, p.isCameraOff])

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden group transition-all duration-300 ${
        p.isSpeaking
          ? 'ring-[2.5px] ring-emerald-400/50 ring-offset-[3px] ring-offset-[#0a0a0c]'
          : 'ring-1 ring-white/5'
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#18181c] via-[#1e1e24] to-[#12121a]" />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Video element or Avatar Fallback */}
      {p.stream && !p.isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf} // Mute self video feed locally to prevent audio echo loop
          onLoadedMetadata={(e) => {
            e.currentTarget.play().catch((err) => {
              console.warn('[VideoTile] play onLoadedMetadata error:', err)
            })
          }}
          className={`w-full h-full ${
            p.isScreenSharing ? 'object-contain bg-black' : 'object-cover'
          } ${isSelf && !p.isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            {p.avatar ? (
              <img
                src={p.avatar}
                alt={p.name}
                className={`rounded-full object-cover border-2 border-white/10 shadow-2xl ${
                  large ? 'w-28 h-28 md:w-36 md:h-36' : 'w-16 h-16 md:w-20 md:h-20'
                }`}
              />
            ) : (
              <div
                className={`rounded-full bg-gradient-to-br ${
                  GRADIENT_AVATARS[p.role] || GRADIENT_AVATARS.student
                } flex items-center justify-center font-bold text-white shadow-2xl border-2 border-white/10 ${
                  large ? 'w-28 h-28 md:w-36 md:h-36 text-3xl md:text-4xl' : 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl'
                }`}
              >
                {p.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-white/80 font-medium text-xs sm:text-sm">{p.name}</span>
              {p.isMuted && <MicOff size={13} className="text-red-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Top badges bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          {p.isSpeaking && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-md shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Speaking</span>
            </div>
          )}
          {p.isScreenSharing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0066cc]/25 border border-[#0066cc]/40 text-[#4d9fff] backdrop-blur-md shadow-md">
              <Monitor size={11} />
              <span className="text-[10px] font-bold">Presenting</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {p.isHandRaised && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/25 border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-md animate-bounce">
              <Hand size={12} />
              <span className="text-[10px] font-bold">Hand Raised</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3.5 py-2.5 flex items-end justify-between z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white text-xs font-semibold truncate max-w-[140px]">{p.name}</span>
          <span
            className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
              p.role === 'tutor'
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                : 'bg-[#0066cc]/15 border-[#0066cc]/25 text-[#4d9fff]'
            }`}
          >
            {p.role}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {currentUserRole === 'tutor' && !isSelf && !p.isMuted && onMuteParticipant && (
            <button
              type="button"
              onClick={() => onMuteParticipant(p.socketId || p.id)}
              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer select-none flex items-center gap-1 shadow-sm transform-gpu active:scale-95"
              title="Remote Mute Student"
            >
              <MicOff size={10} />
              <span>Mute</span>
            </button>
          )}

          {p.isMuted ? (
            <span className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20" title="Muted">
              <MicOff size={10} className="text-red-400" />
            </span>
          ) : (
            <span className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20" title="Unmuted">
              <Mic size={10} className="text-emerald-400" />
            </span>
          )}
          <button
            onClick={() => onPinParticipant(p.id)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer select-none ${
              p.isPinned
                ? 'bg-[#0066cc]/20 border-[#0066cc]/40 text-[#4d9fff]'
                : 'bg-white/8 border-white/10 text-white/40 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            title={p.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VideoGrid({
  participants,
  onPinParticipant,
  onMuteParticipant,
  currentUserRole,
  fullStage,
}: VideoGridProps) {
  // If someone is screen sharing or pinned, prioritize them in spotlight
  const screenSharer = participants.find((p) => p.isScreenSharing)
  const pinned = screenSharer || participants.find((p) => p.isPinned)
  const others = participants.filter((p) => p.id !== pinned?.id)

  const count = participants.length

  if (fullStage) {
    let gridLayoutClass = 'grid-cols-1 grid-rows-1'
    if (count === 2) gridLayoutClass = 'grid-cols-1 sm:grid-cols-2 grid-rows-1'
    else if (count === 3) gridLayoutClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    else if (count === 4) gridLayoutClass = 'grid-cols-2 grid-rows-2'
    else if (count >= 5) gridLayoutClass = 'grid-cols-2 md:grid-cols-3'

    return (
      <div className={`grid ${gridLayoutClass} gap-3 w-full h-full p-3 bg-[#0a0a0c] content-center`}>
        {participants.map((p) => (
          <VideoTile
            key={p.id}
            p={p}
            onPinParticipant={onPinParticipant}
            onMuteParticipant={onMuteParticipant}
            currentUserRole={currentUserRole}
          />
        ))}
      </div>
    )
  }

  if (pinned) {
    return (
      <div className="flex flex-col gap-2.5 w-full h-full p-2.5 bg-[#0a0a0c]">
        <div className="flex-1 min-h-0 w-full">
          <VideoTile
            p={pinned}
            large
            onPinParticipant={onPinParticipant}
            onMuteParticipant={onMuteParticipant}
            currentUserRole={currentUserRole}
          />
        </div>
        {others.length > 0 && (
          <div className="flex gap-2.5 h-28 shrink-0 w-full overflow-x-auto scrollbar-none">
            {others.map((p) => (
              <div key={p.id} className="flex-1 min-w-[140px] h-full">
                <VideoTile
                  key={p.id}
                  p={p}
                  onPinParticipant={onPinParticipant}
                  onMuteParticipant={onMuteParticipant}
                  currentUserRole={currentUserRole}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 w-full h-full p-2.5 bg-[#0a0a0c] overflow-y-auto">
      {participants.map((p) => (
        <div key={p.id} className="flex-1 min-h-[140px] w-full">
          <VideoTile
            key={p.id}
            p={p}
            onPinParticipant={onPinParticipant}
            onMuteParticipant={onMuteParticipant}
            currentUserRole={currentUserRole}
          />
        </div>
      ))}
    </div>
  )
}
