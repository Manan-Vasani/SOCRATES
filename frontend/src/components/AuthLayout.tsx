import React from 'react'
import AuthFooter from './AuthFooter'
import CursorGrid from './CursorGrid'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#ffffff] text-[#1d1d1f] font-sans flex flex-col justify-between items-center px-4 py-8 select-none overflow-hidden">
      {/* Background Interactive CursorGrid Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <CursorGrid
          cellSize={65}
          color="#0066CC"
          radius={160}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.8}
          fillOpacity={0.06}
          gridOpacity={0.03}
          cellRadius={4}
          clickPulse={true}
          pulseSpeed={700}
        />
      </div>

      {/* Main card center container */}
      <div className="relative z-10 w-full flex-grow flex items-center justify-center py-6">
        {children}
      </div>
      <div className="relative z-10 w-full flex justify-center">
        <AuthFooter />
      </div>
    </div>
  )
}
