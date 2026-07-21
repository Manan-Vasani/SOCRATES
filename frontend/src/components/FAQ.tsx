import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: 'How does Socratic AI differ from standard ChatGPT or search engines?',
      a: 'Unlike general AI models that immediately give away raw code or answers, Socratic AI is engineered specifically for pedagogy. It analyzes your current knowledge level and prompts you with targeted sub-questions so you derive the concept yourself.',
    },
    {
      q: 'How are human tutors verified on SOCRATES?',
      a: 'Every human tutor undergoes a 3-stage vetting process: academic credentials verification (degree transcripts or research positions), a live technical teaching demonstration, and background checks.',
    },
    {
      q: 'Can I combine AI study sessions with human tutors?',
      a: 'Yes! That is the core architecture of SOCRATES. You can use Socratic AI to isolate your exact confusion points, and then book a targeted 20-minute session with a human tutor to resolve high-level intuition.',
    },
    {
      q: 'Are peer study rooms free to join?',
      a: 'Public peer study rooms are completely free for all registered SOCRATES users. Student Pro members can also spawn private invite-only study lounges.',
    },
    {
      q: 'How are AI Session Recaps created?',
      a: 'During live sessions, our AI transcribes audio and whiteboard notes in real time, automatically extracting key formulas, step-by-step algorithms, and downloadable flashcards.',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-white text-[#1d1d1f]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">
            Frequently Asked Questions.
          </h2>
          <p className="text-base sm:text-lg text-[#7a7a7a]">
            Everything you need to know about the SOCRATES platform.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div 
                key={index}
                className="border border-[#e0e0e0] rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between font-semibold text-base sm:text-lg text-[#1d1d1f] hover:bg-[#f5f5f7]/50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] shrink-0 ml-4">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-6 pb-6 text-sm sm:text-base text-[#7a7a7a] leading-relaxed border-t border-[#e0e0e0]/60 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
