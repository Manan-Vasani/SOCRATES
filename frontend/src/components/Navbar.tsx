import React from 'react'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e0e0e0]/60 transition-all">
      <nav 
        className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-xs font-normal text-[#1d1d1f]"
        aria-label="Global navigation"
      >
        <div className="flex items-center gap-2 font-semibold text-sm tracking-tight text-[#1d1d1f]">
          <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-[10px]">
            S
          </span>
          <span>SOCRATES</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[#1d1d1f]/80">
          <a href="#why-socrates" className="hover:text-[#1d1d1f] transition-colors">Why SOCRATES</a>
          <a href="#ai-tutor" className="hover:text-[#1d1d1f] transition-colors">AI Tutor</a>
          <a href="#how-it-works" className="hover:text-[#1d1d1f] transition-colors">How It Works</a>
          <a href="#tutors" className="hover:text-[#1d1d1f] transition-colors">Tutors</a>
          <a href="#pricing" className="hover:text-[#1d1d1f] transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <a 
            href="#get-started" 
            className="px-3 py-1 rounded-full bg-[#0066cc] text-white font-medium hover:bg-[#0077ed] transition-colors"
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  )
}
