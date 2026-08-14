import React, { useCallback, useEffect } from 'react'
import { MicOff, VideoOff, Pin, Hand, Monitor } from 'lucide-react'

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
}: {
  p: Participant
  large?: boolean
  onPinParticipant: (id: string) => void
}) {
  const isSelf = p.name.includes('(You)')

  // Callback ref guarantees srcObject assignment and .play() immediately upon mounting DOM node
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && p.stream) {
        if (node.srcObject !== p.stream) {
          node.srcObject = p.stream
        }
        node
          .play()
          .catch((err) => {
            console.warn('[VideoTile] Video play warning:', err)
          })
      }
    },
    [p.stream]
  )

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
          ref={setVideoRef}
          autoPlay
          playsInline
          muted={isSelf} // Mute self video feed locally to prevent audio echo loop
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
                className={`bg-gradient-to-br ${
                  GRADIENT_AVATARS[p.role] || 'from-[#0066cc] to-indigo-600'
                } rounded-full flex items-center justify-center font-bold text-white shadow-2xl ${
                  large
                    ? 'w-28 h-28 text-3xl md:w-36 md:h-36 md:text-4xl'
                    : 'w-16 h-16 text-xl md:w-20 md:h-20 md:text-2xl'
                }`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8">
              <VideoOff size={12} className="text-white/30" />
              <span className="text-[10px] text-white/30 font-medium">Camera off</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Status Badges Row - Unified container preventing any overlapping */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2">
          {p.isScreenSharing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0066cc]/30 border border-[#0066cc]/45 text-[#4d9fff] backdrop-blur-md shadow-md">
              <Monitor size={12} />
              <span className="text-[10px] font-bold tracking-wide">Presenting</span>
            </div>
          )}

          {p.isSpeaking && !p.isMuted && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md shadow-md">
              <div className="flex items-end gap-[2px] h-3">
                {[0.6, 1, 0.75, 0.9, 0.5].map((h, i) => (
                  <span
                    key={i}
                    className="w-[2px] bg-emerald-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 12}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: `${600 + i * 100}ms`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-emerald-400 font-bold">Speaking</span>
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
          {p.isMuted && (
            <span className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20" title="Muted">
              <MicOff size={10} className="text-red-400" />
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

export default function VideoGrid({ participants, onPinParticipant, fullStage }: VideoGridProps) {
  // If someone is screen sharing or pinned, prioritize them in spotlight
  const screenSharer = participants.find((p) => p.isScreenSharing)
  const pinned = screenSharer || participants.find((p) => p.isPinned)
  const others = participants.filter((p) => p.id !== pinned?.id)

  if (fullStage) {
    const cols =
      participants.length <= 1
        ? 'grid-cols-1'
        : participants.length <= 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-2'

    return (
      <div className={`grid ${cols} gap-3 w-full h-full p-3 bg-[#0a0a0c]`}>
        {participants.map((p) => (
          <VideoTile key={p.id} p={p} onPinParticipant={onPinParticipant} />
        ))}
      </div>
    )
  }

  if (pinned) {
    return (
      <div className="flex flex-col gap-2.5 w-full h-full p-2.5 bg-[#0a0a0c]">
        <div className="flex-1 min-h-0 w-full">
          <VideoTile p={pinned} large onPinParticipant={onPinParticipant} />
        </div>
        {others.length > 0 && (
          <div className="flex gap-2.5 h-28 shrink-0 w-full overflow-x-auto">
            {others.map((p) => (
              <div key={p.id} className="flex-1 min-w-[140px] h-full">
                <VideoTile key={p.id} p={p} onPinParticipant={onPinParticipant} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 w-full h-full p-2.5 bg-[#0a0a0c]">
      {participants.map((p) => (
        <div key={p.id} className="flex-1 min-h-0 w-full">
          <VideoTile key={p.id} p={p} onPinParticipant={onPinParticipant} />
        </div>
      ))}
    </div>
  )
}
