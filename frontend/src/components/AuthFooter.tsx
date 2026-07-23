import React from 'react'

export default function AuthFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full max-w-md mx-auto pt-8 pb-4 text-center select-none text-[11px] text-[#6e6e73]">
      <div className="flex justify-center gap-4 mb-2">
        <a 
          href="#" 
          className="hover:underline hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]"
        >
          Privacy Policy
        </a>
        <span className="text-[#e5e5e5]" aria-hidden="true">|</span>
        <a 
          href="#" 
          className="hover:underline hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]"
        >
          Terms of Service
        </a>
        <span className="text-[#e5e5e5]" aria-hidden="true">|</span>
        <a 
          href="#" 
          className="hover:underline hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc]"
        >
          Cookie Preferences
        </a>
      </div>
      <p>
        Copyright &copy; {currentYear} SOCRATES Inc. All rights reserved.
      </p>
    </footer>
  )
}
