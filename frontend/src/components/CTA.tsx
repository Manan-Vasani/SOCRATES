import React from 'react'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="py-28 sm:py-40 bg-[#f5f5f7] text-[#1d1d1f] border-t border-[#e0e0e0] text-center">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <motion.h2 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]"
        >
          Ready to transform your learning journey?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-[#7a7a7a] max-w-2xl mx-auto font-normal"
        >
          Join thousands of students and certified educators building the future of education together.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0066cc] text-white text-base font-medium hover:bg-[#0077ed] transition-colors cursor-pointer"
          >
            Find a Tutor
          </button>

          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-[#0066cc] border border-[#0066cc] text-base font-medium hover:bg-[#0066cc]/5 transition-colors cursor-pointer"
          >
            Become a Tutor
          </button>
        </motion.div>
      </div>
    </section>
  )
}
