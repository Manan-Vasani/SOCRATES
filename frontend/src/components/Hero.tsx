import React from 'react'
import { motion, Variants } from 'framer-motion'
import { 
  Sparkles, 
  Bot, 
  User, 
  Video, 
  FileText, 
  Star, 
  ChevronDown 
} from 'lucide-react'

export default function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  }

  const mockupVariants: Variants = {
    hidden: { opacity: 0, y: 35, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.0,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <section 
      aria-label="Hero"
      className="relative min-h-[92vh] bg-white text-[#1d1d1f] pt-12 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between overflow-hidden"
    >
      {/* Radial subtle highlight */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
        aria-hidden="true"
      >
        <div className="w-[800px] h-[500px] bg-radial from-[#0066cc]/[0.035] via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center w-full"
      >
        {/* Headline */}
        <h1 className="mt-4 mb-6 text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-tight leading-[1.08] text-[#1d1d1f]">
          <span>Learn from the source.</span>
          <br className="hidden sm:inline" />
          <span className="block mt-1 sm:mt-2 text-[#1d1d1f]">
            AI + Human Tutors, together.
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#7a7a7a] font-normal leading-relaxed">
          Master every subject through personalized tutoring, AI-powered guidance, live video sessions, and collaborative learning—all in one platform.
        </p>

        {/* Buttons */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0066cc] text-white text-sm font-medium hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer"
          >
            Find a Tutor
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-white text-[#0066cc] border border-[#0066cc] text-sm font-medium hover:bg-[#0066cc]/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer"
          >
            Become a Tutor
          </motion.button>
        </motion.div>

        {/* Product Mockup */}
        <motion.div
          variants={mockupVariants}
          className="mt-14 sm:mt-16 w-full max-w-[900px]"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full bg-white border border-[#e0e0e0] rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden text-left"
          >
            {/* Window Header */}
            <div className="px-5 py-3.5 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
                <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
                <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#7a7a7a]">
                <Bot className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>SOCRATES AI Workspace</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Content */}
            <div className="p-6 sm:p-10 space-y-6">
              <div className="bg-[#f5f5f7] rounded-xl p-4 sm:p-5 max-w-xl">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#7a7a7a] tracking-wide uppercase">
                  <User className="w-3.5 h-3.5 text-[#7a7a7a]" />
                  <span>Student</span>
                </div>
                <p className="text-sm sm:text-base font-medium text-[#1d1d1f]">
                  Explain Binary Search Tree.
                </p>
              </div>

              <div className="bg-[#f5f5f7] rounded-xl p-4 sm:p-5 max-w-2xl ml-auto border-l-2 border-[#0066cc]">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#0066cc] tracking-wide uppercase">
                  <Bot className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span>AI Tutor</span>
                </div>
                <p className="text-sm sm:text-base font-normal text-[#1d1d1f] leading-relaxed">
                  Let's solve it together. What happens if the array is already sorted?
                </p>
              </div>

              <div className="pt-4 border-t border-[#e0e0e0] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium text-[#1d1d1f]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f5f5f7] text-[#1d1d1f]">
                  <Video className="w-4 h-4 text-[#0066cc]" />
                  <span>Live Tutor Available</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f5f5f7] text-[#1d1d1f]">
                  <FileText className="w-4 h-4 text-[#0066cc]" />
                  <span>AI Notes Ready</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f5f5f7] text-[#1d1d1f]">
                  <Star className="w-4 h-4 text-[#0066cc]" />
                  <span>Session Summary</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
