import React from 'react'
import { motion } from 'framer-motion'
import { User, Bot, GraduationCap, Users2, Sparkles, ArrowRight } from 'lucide-react'

export default function LearningJourney() {
  return (
    <section className="py-24 sm:py-32 bg-[#f5f5f7] text-[#1d1d1f] border-y border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Storytelling */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e0e0e0] text-xs font-medium text-[#0066cc]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Ecosystem</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
              Learn Your Way.
            </h2>

            <p className="text-lg text-[#7a7a7a] leading-relaxed font-normal">
              No two minds process information identical. SOCRATES seamlessly links student curiosity, Socratic AI clarity, expert human mentorship, and peer collaboration into a single fluid learning loop.
            </p>

            <div className="pt-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-semibold text-xs mt-0.5">
                  01
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1d1d1f]">Instant Socratic Guidance</h4>
                  <p className="text-sm text-[#7a7a7a]">AI unpacks complex concepts line by line without spoiling solutions.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-semibold text-xs mt-0.5">
                  02
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1d1d1f]">Verified Human Mastery</h4>
                  <p className="text-sm text-[#7a7a7a]">Seamlessly transition to live 1-on-1 human sessions when you need human intuition.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Connected Ecosystem Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-square bg-white border border-[#e0e0e0] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex items-center justify-center">
              {/* Subtle SVG Connection Paths */}
              <svg className="absolute inset-0 w-full h-full stroke-[#e0e0e0]" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
                <path d="M 120 120 L 280 120 L 280 280 L 120 280 Z" />
                <path d="M 120 120 L 280 280" />
                <path d="M 280 120 L 120 280" />
              </svg>

              {/* Center Core Node */}
              <div className="relative z-10 w-20 h-20 rounded-full bg-[#0066cc] text-white flex flex-col items-center justify-center shadow-lg">
                <span className="text-xs font-bold tracking-widest uppercase">SOCRATES</span>
              </div>

              {/* Node Top Left: Student */}
              <div className="absolute top-8 left-8 z-10 bg-white border border-[#e0e0e0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f]">Student</div>
                  <div className="text-[10px] text-[#7a7a7a]">Curiosity core</div>
                </div>
              </div>

              {/* Node Top Right: AI */}
              <div className="absolute top-8 right-8 z-10 bg-white border border-[#e0e0e0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f]">Socratic AI</div>
                  <div className="text-[10px] text-[#7a7a7a]">24/7 Guidance</div>
                </div>
              </div>

              {/* Node Bottom Left: Tutor */}
              <div className="absolute bottom-8 left-8 z-10 bg-white border border-[#e0e0e0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f]">Human Tutor</div>
                  <div className="text-[10px] text-[#7a7a7a]">Expert 1-on-1</div>
                </div>
              </div>

              {/* Node Bottom Right: Community */}
              <div className="absolute bottom-8 right-8 z-10 bg-white border border-[#e0e0e0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f]">Community</div>
                  <div className="text-[10px] text-[#7a7a7a]">Peer Study Rooms</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
