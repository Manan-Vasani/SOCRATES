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
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }

  const textSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base font-bold tracking-tight',
    lg: 'text-2xl font-bold tracking-tight',
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* High-End Modern Brand Logo Mark */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 shadow-sm border border-[#333333]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${svgSizes[size]}`}
          aria-hidden="true"
        >
          {/* Classical Pillar Lines */}
          <path
            d="M5 20H19M7 16V8M12 16V8M17 16V8M5 4H19M7 4L12 8L17 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Glowing Action Blue AI Spark Node */}
          <circle cx="12" cy="12" r="2.25" fill="#0066cc" />
        </svg>

        {/* Small Active Badge Dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#0066cc] ring-2 ring-white" />
      </div>

      {/* Brand Typography with Action Blue Dot */}
      {showText && (
        <div className="flex items-center">
          <span
            className={`font-sans text-[#1d1d1f] ${textSizes[size]} ${textClassName}`}
          >
            SOCRATES
          </span>
          <span className="text-[#0066cc] font-black text-lg leading-none ml-0.5">.</span>
        </div>
      )}
    </div>
  )
}
