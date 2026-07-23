import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e0e0e0]/60 transition-all select-none">
      <nav 
        className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-xs font-normal text-[#1d1d1f]"
        aria-label="Global navigation"
      >
        <Link to="/" className="hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc] rounded-lg">
          <Logo size="sm" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[#1d1d1f]/80">
          <a href="#why-socrates" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Why SOCRATES</a>
          <a href="#ai-tutor" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">AI Tutor</a>
          <a href="#how-it-works" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">How It Works</a>
          <a href="#tutors" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Tutors</a>
          <a href="#pricing" className="hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]">Pricing</a>
        </div>

        <div className="flex items-center gap-5">
          <Link 
            to="/login" 
            className="hover:text-[#0066cc] transition-colors font-medium focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
          >
            Sign In
          </Link>
          <Link 
            to="/login" 
            className="px-3 py-1 rounded-full bg-[#0066cc] text-white font-medium hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}

