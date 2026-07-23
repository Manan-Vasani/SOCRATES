import React from 'react'
import { motion, Variants } from 'framer-motion'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export default function AuthCard({ children, className = '' }: AuthCardProps) {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier matching premium Apple feel
      },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`w-full max-w-[420px] bg-white border border-[#e5e5e5] rounded-3xl p-8 sm:p-10 ${className}`}
    >
      {children}
    </motion.div>
  )
}
