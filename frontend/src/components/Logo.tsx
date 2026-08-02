import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  textClassName?: string
}

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}: LogoProps) {
  const textSizes = {
    sm: 'text-lg font-extrabold tracking-tight',
    md: 'text-xl font-extrabold tracking-tight',
    lg: 'text-3xl font-extrabold tracking-tight',
  }

  const dotSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <span
        className={`font-sans text-[#1d1d1f] ${textSizes[size]} ${textClassName}`}
      >
        SOCRATES
      </span>
      <span className={`text-[#0066cc] font-black leading-none ml-0.5 ${dotSizes[size]}`}>
        .
      </span>
    </div>
  )
}
