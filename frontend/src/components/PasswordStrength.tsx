import React from 'react'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  value: string
}

export default function PasswordStrength({ value = '' }: PasswordStrengthProps) {
  const requirements = [
    { label: 'Minimum 8 characters', met: value.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(value) },
    { label: 'One lowercase letter', met: /[a-z]/.test(value) },
    { label: 'One number', met: /[0-9]/.test(value) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(value) },
  ]

  const hasTyped = value.length > 0

  return (
    <div className="w-full bg-[#f5f5f7] border border-[#e5e5e5] rounded-2xl p-4.5 space-y-2.5 text-left select-none">
      <p className="text-[12px] font-semibold text-[#1d1d1f]">
        Password Requirements
      </p>
      <ul className="space-y-2">
        {requirements.map((req, i) => {
          let statusColor = 'text-[#6e6e73]'
          // Return dot if not typed, green check if met, red X if typed and unmet.
          let Icon = () => (
            <div className="w-3.5 h-3.5 rounded-full border border-[#6e6e73]/30 bg-transparent" />
          )

          if (hasTyped) {
            if (req.met) {
              statusColor = 'text-[#16a34a]'
              Icon = () => <Check className="w-3.5 h-3.5 text-[#16a34a] stroke-[3px]" />
            } else {
              statusColor = 'text-[#dc2626]'
              Icon = () => <X className="w-3.5 h-3.5 text-[#dc2626] stroke-[3px]" />
            }
          }

          return (
            <li
              key={i}
              className={`flex items-center gap-2.5 text-xs font-medium transition-colors duration-200 ${statusColor}`}
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <Icon />
              </div>
              <span>{req.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
