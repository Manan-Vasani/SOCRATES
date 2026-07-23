import React, { forwardRef, InputHTMLAttributes } from 'react'
import { LucideIcon } from 'lucide-react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: LucideIcon
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, icon: Icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        <label className="text-[13px] font-semibold text-[#1d1d1f] select-none">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6e6e73]">
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`w-full ${
              Icon ? 'pl-10.5' : 'px-3.5'
            } pr-3.5 py-3 rounded-xl bg-white border ${
              error
                ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]'
                : 'border-[#e5e5e5] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]'
            } text-[#1d1d1f] placeholder-[#6e6e73]/40 text-sm font-normal outline-none transition-all`}
            {...props}
          />
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

InputField.displayName = 'InputField'

export default InputField
