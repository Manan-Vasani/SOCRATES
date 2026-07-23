import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface OTPInputProps {
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export default function OTPInput({ value, onChange, error }: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (val: string, index: number) => {
    // Only allow numeric digits
    if (val && !/^[0-9]$/.test(val)) return

    const newValue = [...value]
    newValue[index] = val
    onChange(newValue)

    // Automatically focus next input field if digit is entered
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        const newValue = [...value]
        newValue[index - 1] = ''
        onChange(newValue)
        inputsRef.current[index - 1]?.focus()
      } else {
        const newValue = [...value]
        newValue[index] = ''
        onChange(newValue)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(pastedData)) return

    const newValue = pastedData.split('')
    onChange(newValue)
    inputsRef.current[5]?.focus()
  }

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      <div className="flex gap-2.5 justify-center w-full select-none">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            ref={(el) => {
              inputsRef.current[index] = el
            }}
            aria-label={`Verification code digit ${index + 1}`}
            className={`w-12 h-14 text-center text-xl font-semibold rounded-xl bg-white border ${
              error
                ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]'
                : 'border-[#e5e5e5] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]'
            } text-[#1d1d1f] outline-none transition-all`}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-[#dc2626] font-medium leading-tight text-center">
          {error}
        </p>
      )}
    </div>
  )
}
