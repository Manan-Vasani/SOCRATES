import React from 'react'
import { MicOff, VideoOff, Pin, Volume2 } from 'lucide-react'

interface Participant {
  id: string
  name: string
  role: 'tutor' | 'student'
  avatar?: string
  isMuted: boolean
  isCameraOff: boolean
  isSpeaking: boolean
  isPinned: boolean
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

export default function VideoGrid({ participants, onPinParticipant, fullStage }: VideoGridProps) {
  const pinned = participants.find((p) => p.isPinned)
  const others = participants.filter((p) => !p.isPinned)

  const renderTile = (p: Participant, large = false) => (
    <div
      key={p.id}
      className={`relative rounded-2xl overflow-hidden group transition-all duration-300 ${
        large ? 'col-span-full row-span-full' : ''
      } ${
        p.isSpeaking
          ? 'ring-[2.5px] ring-emerald-400/50 ring-offset-[3px] ring-offset-[#0a0a0c]'
          : 'ring-1 ring-white/5'
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#18181c] via-[#1e1e24] to-[#12121a]" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Avatar Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          {p.avatar ? (
            <img
              src={p.avatar}
              alt={p.name}
              className={`rounded-full object-cover border-2 border-white/10 shadow-2xl ${large ? 'w-32 h-32' : 'w-20 h-20'}`}
            />
          ) : (
            <div className={`bg-gradient-to-br ${GRADIENT_AVATARS[p.role]} rounded-full flex items-center justify-center font-bold text-white shadow-2xl ${large ? 'w-32 h-32 text-4xl' : 'w-20 h-20 text-2xl'}`}>
              {p.name.charAt(0).toUpperCase()}
            </div>
          )}
          {p.isCameraOff && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8">
              <VideoOff size={12} className="text-white/30" />
              <span className="text-[10px] text-white/30 font-medium">Camera off</span>
            </div>
          )}
        </div>
      </div>

      {/* Speaking audio visualizer */}
      {p.isSpeaking && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-end gap-[2px] h-3">
            {[0.6, 1, 0.75, 0.9, 0.5].map((h, i) => (
              <span
                key={i}
                className="w-[2.5px] bg-emerald-400 rounded-full animate-pulse"
                style={{ height: `${h * 12}px`, animationDelay: `${i * 100}ms`, animationDuration: `${600 + i * 100}ms` }}
              />
            ))}
          </div>
          <span className="text-[9px] text-emerald-400 font-bold ml-0.5">Speaking</span>
        </div>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3.5 py-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-semibold truncate max-w-[140px]">{p.name}</span>
          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            p.role === 'tutor'
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
              : 'bg-[#0066cc]/15 border-[#0066cc]/25 text-[#4d9fff]'
          }`}>
            {p.role}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {p.isMuted && (
            <span className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
              <MicOff size={10} className="text-red-400" />
            </span>
          )}
          <button
            onClick={() => onPinParticipant(p.id)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              p.isPinned
                ? 'bg-[#0066cc]/20 text-[#4d9fff] border border-[#0066cc]/30'
                : 'bg-white/8 text-white/30 opacity-0 group-hover:opacity-100 hover:text-white border border-white/5'
            }`}
            title={p.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={10} />
          </button>
        </div>
      </div>
    </div>
  )

  if (fullStage) {
    const cols = participants.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'
    return (
      <div className={`grid ${cols} gap-3 w-full h-full p-3`}>
        {participants.map((p) => renderTile(p))}
      </div>
    )
  }

  if (pinned) {
    return (
      <div className="flex flex-col gap-2.5 w-full h-full p-2.5">
        <div className="flex-1 min-h-0">{renderTile(pinned, true)}</div>
        {others.length > 0 && (
          <div className="flex gap-2.5 h-28 shrink-0">
            {others.map((p) => (
              <div key={p.id} className="flex-1 min-w-0">{renderTile(p)}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 w-full h-full p-2.5">
      {participants.map((p) => renderTile(p))}
    </div>
  )
}
