import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, User, Send, Sparkles, RefreshCw, Terminal, Check } from 'lucide-react'

export default function AITutor() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      student: "Explain Binary Search Tree.",
      ai: "Imagine ordering a bookshelf. In a Binary Search Tree (BST), every node has a simple rule: everything smaller goes to the left, everything larger goes to the right.",
      socraticQuestion: "If you want to find the number 14, and you start at node 10, which branch do you choose?",
    },
    {
      student: "I would go to the right branch because 14 is greater than 10.",
      ai: "Exactly right! Now suppose you reach node 15. Where do you look next?",
      socraticQuestion: "What happens if 14 is not on the left of 15?",
    },
  ]

  return (
    <section id="ai-tutor" className="py-24 sm:py-32 bg-white text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-medium text-[#0066cc]">
            <Bot className="w-3.5 h-3.5" />
            <span>Interactive Product Showcase</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            The Socratic AI Experience.
          </h2>

          <p className="text-base sm:text-lg text-[#7a7a7a]">
            Designed to foster true critical thinking by leading you step-by-step to discovery.
          </p>
        </motion.div>

        {/* Massive AI Product Interface */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto bg-white border border-[#e0e0e0] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.05)] overflow-hidden text-left"
        >
          {/* macOS Minimal Header Bar */}
          <div className="px-6 py-4 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
              <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
              <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#7a7a7a]">
              <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>SOCRATES Core AI Engine v4.2</span>
            </div>
            <button 
              onClick={() => setActiveStep((prev) => (prev === 0 ? 1 : 0))}
              className="text-xs font-medium text-[#0066cc] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Toggle Dialogue</span>
            </button>
          </div>

          {/* Dialogue Content Area */}
          <div className="p-6 sm:p-10 space-y-8 bg-white min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6">
              {/* Student Query */}
              <div className="bg-[#f5f5f7] p-5 rounded-2xl max-w-xl">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>Student Question</span>
                </div>
                <p className="text-sm sm:text-base font-medium text-[#1d1d1f]">
                  "{steps[activeStep].student}"
                </p>
              </div>

              {/* AI Socratic Response */}
              <div className="bg-[#f5f5f7] p-6 rounded-2xl max-w-2xl ml-auto border-l-4 border-[#0066cc]">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#0066cc] uppercase tracking-wider">
                  <Bot className="w-4 h-4" />
                  <span>SOCRATES AI Guidance</span>
                </div>
                <p className="text-sm sm:text-base text-[#1d1d1f] leading-relaxed mb-4">
                  {steps[activeStep].ai}
                </p>
                <div className="p-4 rounded-xl bg-white border border-[#e0e0e0] text-xs sm:text-sm font-medium text-[#1d1d1f]">
                  <span className="text-[#0066cc] font-semibold block mb-1">Key Question:</span>
                  {steps[activeStep].socraticQuestion}
                </div>
              </div>
            </div>

            {/* Input Simulation Bar */}
            <div className="mt-8 pt-4 border-t border-[#e0e0e0] flex items-center gap-3">
              <div className="flex-1 bg-[#f5f5f7] border border-[#e0e0e0] rounded-full px-5 py-3 text-sm text-[#7a7a7a] flex items-center justify-between">
                <span>Ask follow-up question or explain your reasoning...</span>
                <Sparkles className="w-4 h-4 text-[#0066cc]" />
              </div>
              <button 
                type="button" 
                aria-label="Send query"
                className="w-10 h-10 rounded-full bg-[#0066cc] text-white flex items-center justify-center hover:bg-[#0077ed] transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
