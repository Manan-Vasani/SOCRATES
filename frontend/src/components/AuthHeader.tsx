import React from 'react'

interface AuthHeaderProps {
  title: string
  description?: string
}

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-1.5 mb-8 select-none w-full">
      <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
        {title}
      </h1>
      {description && (
        <p className="text-sm font-normal text-[#6e6e73] leading-relaxed max-w-[340px]">
          {description}
        </p>
      )}
    </div>
  )
}
