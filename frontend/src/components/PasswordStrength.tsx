import React from 'react'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  value: string
  confirmValue?: string
}

export default function PasswordStrength({ value = '', confirmValue }: PasswordStrengthProps) {
  const hasTypedPassword = value.length > 0
  const hasTypedConfirm = typeof confirmValue === 'string' && confirmValue.length > 0
  const isMatching = hasTypedConfirm && value === confirmValue && value.length > 0

  const baseRequirements = [
    { id: 'length', label: 'Minimum 8 characters', met: value.length >= 8, typed: hasTypedPassword },
    { id: 'upper', label: 'One uppercase letter', met: /[A-Z]/.test(value), typed: hasTypedPassword },
    { id: 'lower', label: 'One lowercase letter', met: /[a-z]/.test(value), typed: hasTypedPassword },
    { id: 'number', label: 'One number', met: /[0-9]/.test(value), typed: hasTypedPassword },
    { id: 'special', label: 'One special character', met: /[^A-Za-z0-9]/.test(value), typed: hasTypedPassword },
  ]

  if (typeof confirmValue === 'string') {
    baseRequirements.push({
      id: 'match',
      label: !hasTypedConfirm
        ? 'Passwords match'
        : isMatching
        ? 'Passwords match'
        : 'Passwords do not match',
      met: isMatching,
      typed: hasTypedConfirm,
    })
  }

  return (
    <div className="w-full bg-[#f8f9fa] border border-[#e5e5e5] rounded-2xl p-4 space-y-2.5 text-left select-none">
      <p className="text-[12px] font-semibold text-[#1d1d1f]">
        Password Requirements
      </p>
      <ul className="space-y-2">
        {baseRequirements.map((req) => {
          let statusColor = 'text-[#6e6e73]'
          let Icon = () => (
            <div className="w-3.5 h-3.5 rounded-full border border-[#6e6e73]/30 bg-transparent" />
          )

          if (req.typed) {
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
              key={req.id}
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
