import React, { forwardRef, useState, InputHTMLAttributes } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        <label className="text-[13px] font-semibold text-[#1d1d1f] select-none">
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6e6e73]">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`w-full pl-10.5 pr-11 py-3 rounded-xl bg-white border ${
              error
                ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]'
                : 'border-[#e5e5e5] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]'
            } text-[#1d1d1f] placeholder-[#6e6e73]/40 text-sm font-normal outline-none transition-all`}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6e6e73] hover:text-[#1d1d1f] transition-colors focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded-lg cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4.5 h-4.5" />
            ) : (
              <Eye className="w-4.5 h-4.5" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-[#dc2626] font-medium leading-tight pt-0.5">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
