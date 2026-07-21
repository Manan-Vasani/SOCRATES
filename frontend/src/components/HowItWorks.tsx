import React from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Search, Calendar, TrendingUp } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create Account',
      description: 'Set up your learning profile, set target goals, and select your subjects.',
      icon: UserPlus,
    },
    {
      num: '02',
      title: 'Find Tutor',
      description: 'Browse verified human experts or initialize your instant Socratic AI companion.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Book Session',
      description: 'Schedule a 1-on-1 video call or start an immediate study session anytime.',
      icon: Calendar,
    },
    {
      num: '04',
      title: 'Learn & Grow',
      description: 'Master tough concepts with automated notes, recaps, and peer study groups.',
      icon: TrendingUp,
    },
  ]

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-[#f5f5f7] text-[#1d1d1f] border-t border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            How It Works.
          </h2>
          <p className="text-lg text-[#7a7a7a]">
            Four effortless steps to continuous subject mastery.
          </p>
        </div>

        {/* 4 Large Horizontal Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-[#e0e0e0] rounded-3xl p-8 flex flex-col justify-between hover:border-[#0066cc]/40 transition-colors"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-[#0066cc] bg-[#0066cc]/10 px-3 py-1 rounded-full">
                      STEP {step.num}
                    </span>
                    <Icon className="w-6 h-6 text-[#1d1d1f]" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-[#1d1d1f]">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[#7a7a7a] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
