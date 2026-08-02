import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export default function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div
      className={`w-full max-w-[420px] bg-white border border-[#e5e5e5] rounded-3xl p-8 sm:p-10 shadow-xs antialiased select-none ${className}`}
    >
      {children}
    </div>
  )
}
