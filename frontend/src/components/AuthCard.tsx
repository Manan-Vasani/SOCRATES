import React from 'react'
import { motion, Variants } from 'framer-motion'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export default function AuthCard({ children, className = '' }: AuthCardProps) {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`w-[420px] max-w-full bg-white border border-[#e5e5e5] rounded-3xl p-8 sm:p-10 shadow-xs antialiased select-none shrink-0 ${className}`}
    >
      {children}
    </motion.div>
  )
}
