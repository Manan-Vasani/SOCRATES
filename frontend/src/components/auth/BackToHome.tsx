import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const motionLinkVariants = {
  initial: { opacity: 0.85 },
  hover: { opacity: 1 },
}

const arrowVariants = {
  initial: { x: 0 },
  hover: { x: -3 },
}

export default function BackToHome() {
  return (
    <div className="w-full flex justify-start select-none">
      <motion.div
        initial="initial"
        whileHover="hover"
        animate="initial"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6e6e73] hover:text-[#0066cc] focus-visible:outline-2 focus-visible:outline-[#0066cc] focus-visible:outline-offset-4 rounded transition-colors duration-200"
          aria-label="Back to Home"
        >
          <motion.span
            className="flex items-center"
            variants={arrowVariants}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.span>
          <motion.span
            variants={motionLinkVariants}
            transition={{ duration: 0.2 }}
          >
            Back to Home
          </motion.span>
        </Link>
      </motion.div>
    </div>
  )
}
