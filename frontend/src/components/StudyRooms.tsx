import React from 'react'
import { motion } from 'framer-motion'
import { Video, Edit3, FileText, Users, ArrowRight, MessageSquare } from 'lucide-react'

export default function StudyRooms() {
  return (
    <section className="py-24 sm:py-32 bg-white text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Mockup Presentation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-[#f5f5f7] border border-[#e0e0e0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0066cc]" />
                <span className="text-xs font-semibold text-[#1d1d1f]">Live Room: Machine Learning Study Group</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#0066cc]/10 text-[#0066cc]">
                6 Active Participants
              </span>
            </div>

            {/* Video Call & Whiteboard Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Video Grid */}
              <div className="bg-white p-4 rounded-2xl border border-[#e0e0e0] space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-[#7a7a7a]">
                  <span className="flex items-center gap-1.5 text-[#1d1d1f]">
                    <Video className="w-3.5 h-3.5 text-[#0066cc]" /> Audio/Video Feed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Maya (Presenter)', 'Liam', 'Priya', 'David'].map((name, i) => (
                    <div key={i} className="aspect-video bg-[#f5f5f7] rounded-xl p-2 flex flex-col justify-end text-[10px] font-medium text-[#1d1d1f] border border-[#e0e0e0]">
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaborative Notes & Whiteboard */}
              <div className="bg-white p-4 rounded-2xl border border-[#e0e0e0] space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-[#7a7a7a]">
                  <span className="flex items-center gap-1.5 text-[#1d1d1f]">
                    <Edit3 className="w-3.5 h-3.5 text-[#0066cc]" /> Shared Whiteboard
                  </span>
                  <span className="text-[10px] text-[#0066cc]">Syncing live</span>
                </div>
                <div className="p-3 bg-[#f5f5f7] rounded-xl text-xs space-y-2 border border-[#e0e0e0]">
                  <div className="font-mono text-[11px] text-[#1d1d1f]">L = ½ ∑ (y - ŷ)²</div>
                  <p className="text-[10px] text-[#7a7a7a]">Deriving Mean Squared Error Gradient Loss...</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-medium text-[#0066cc]">
              <Users className="w-3.5 h-3.5" />
              <span>Collaborative Learning</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
              Peer Study Rooms.
            </h2>

            <p className="text-base sm:text-lg text-[#7a7a7a] leading-relaxed">
              Study is never lonely on SOCRATES. Step into quiet focus lounges or active whiteboard rooms with peers around the globe tackling the exact same problem sets.
            </p>

            <div className="pt-2">
              <button 
                type="button"
                className="px-7 py-3 rounded-full bg-[#0066cc] text-white text-sm font-medium hover:bg-[#0077ed] transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Join Community</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
