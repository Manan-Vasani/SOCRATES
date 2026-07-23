import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

interface AuthHeaderProps {
  title: string
  description?: string
}

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 mb-8 select-none">
      <Link 
        to="/" 
        className="hover:opacity-95 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-xl"
        aria-label="SOCRATES Home"
      >
        <Logo size="lg" />
      </Link>
      <div className="space-y-1.5 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
          {title}
        </h1>
        {description && (
          <p className="text-sm font-normal text-[#6e6e73]">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
