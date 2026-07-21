import React from 'react'
import { motion } from 'framer-motion'
import { Video, Bot, Users, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

export default function WhySocrates() {
  const featureBlocks = [
    {
      id: 'tutoring',
      icon: Video,
      title: 'Paid 1-on-1 Tutoring',
      description: 'Connect directly with certified human experts for personalized, live video instruction tailored to your exact curriculum.',
      bg: 'bg-white',
      illustration: (
        <div className="w-full bg-[#f5f5f7] border border-[#e0e0e0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-semibold flex items-center justify-center text-sm">
                DR
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Dr. Elena Rostova</h4>
                <p className="text-xs text-[#7a7a7a]">Quantum Computing Specialist</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#0066cc] text-white">
              Live Session
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e0e0e0] flex items-center justify-between text-xs font-medium text-[#1d1d1f]">
            <span>1-on-1 Interactive Screen Share</span>
            <span className="text-[#0066cc]">45m remaining</span>
          </div>
        </div>
      ),
    },
    {
      id: 'socratic-ai',
      icon: Bot,
      title: 'Socratic AI',
      description: 'An AI engine designed not to deliver copy-paste answers, but to ask the exact right questions that guide you to deep understanding.',
      bg: 'bg-[#f5f5f7]',
      illustration: (
        <div className="w-full bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0066cc]">
            <Bot className="w-4 h-4" />
            <span>SOCRATES GUIDED PROMPT</span>
          </div>
          <p className="text-sm text-[#1d1d1f] font-medium leading-relaxed">
            "Before we code the tree rotation, what property of a Binary Search Tree must remain invariant?"
          </p>
          <div className="flex gap-2 text-xs text-[#7a7a7a] pt-2 border-t border-[#e0e0e0]">
            <span className="px-2.5 py-1 rounded-md bg-[#f5f5f7]">Hint 1: In-order traversal</span>
            <span className="px-2.5 py-1 rounded-md bg-[#f5f5f7]">Hint 2: Key ordering</span>
          </div>
        </div>
      ),
    },
    {
      id: 'study-rooms',
      icon: Users,
      title: 'Peer Study Rooms',
      description: 'Drop into virtual study lounges with peers studying your exact topics. Share notes, discuss concepts, and solve problem sets together.',
      bg: 'bg-white',
      illustration: (
        <div className="w-full bg-[#f5f5f7] border border-[#e0e0e0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1d1d1f]">Active Room: CS 106B Algorithm Design</span>
            <span className="text-xs font-medium text-[#7a7a7a]">4 Students Online</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Alex M.', 'Sarah K.', 'Marcus T.', 'You'].map((name, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-[#e0e0e0] flex items-center gap-2 text-xs font-medium text-[#1d1d1f]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'session-recaps',
      icon: FileText,
      title: 'AI Session Recaps',
      description: 'Never miss a detail. Every live tutoring or study session is automatically transcribed into structured notes, key formulas, and flashcards.',
      bg: 'bg-[#f5f5f7]',
      illustration: (
        <div className="w-full bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
            <span>Automated Notes summary</span>
            <span className="text-[#0066cc]">Generated in 3s</span>
          </div>
          <ul className="space-y-2 text-xs text-[#7a7a7a]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>BST Insertion Time Complexity: O(h) average, O(n) worst</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>AVL Self-balancing threshold criteria</span>
            </li>
          </ul>
        </div>
      ),
    },
  ]

  return (
    <section id="why-socrates" className="py-24 sm:py-32 bg-white text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#1d1d1f] mb-6">
            Why SOCRATES.
          </h2>
          <p className="text-lg sm:text-xl text-[#7a7a7a] font-normal leading-relaxed">
            The first learning platform combining the instant power of Socratic artificial intelligence with high-impact human mentorship.
          </p>
        </div>

        {/* 4 Feature Blocks */}
        <div className="space-y-12 sm:space-y-16">
          {featureBlocks.map((block, index) => {
            const Icon = block.icon
            const isEven = index % 2 === 0
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-3xl border border-[#e0e0e0] ${block.bg} p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center`}
              >
                <div className={`lg:col-span-6 space-y-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                    {block.title}
                  </h3>
                  <p className="text-base sm:text-lg text-[#7a7a7a] leading-relaxed font-normal">
                    {block.description}
                  </p>
                </div>

                <div className={`lg:col-span-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  {block.illustration}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
