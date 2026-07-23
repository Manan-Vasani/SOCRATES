import React from 'react'
import AuthFooter from './AuthFooter'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] font-sans flex flex-col justify-between items-center px-4 py-8 select-none">
      {/* Main card center container */}
      <div className="w-full flex-grow flex items-center justify-center py-6">
        {children}
      </div>
      <AuthFooter />
    </div>
  )
}
