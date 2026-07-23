import React from 'react'

export default function Divider() {
  return (
    <div className="relative my-6 select-none flex items-center justify-center">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-[#e5e5e5]" />
      </div>
      <div className="relative bg-white px-3 text-xs font-semibold tracking-wider text-[#6e6e73]">
        OR
      </div>
    </div>
  )
}
