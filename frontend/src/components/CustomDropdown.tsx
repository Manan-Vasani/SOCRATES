import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface DropdownOption<T extends string | number> {
  value: T
  label: string
  icon?: React.ReactNode
  badge?: string
}

interface CustomDropdownProps<T extends string | number> {
  options: DropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  placeholder?: string
  label?: string
  icon?: React.ReactNode
  className?: string
  buttonClassName?: string
  menuClassName?: string
  align?: 'left' | 'right' | 'center'
}

export default function CustomDropdown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 180,
  })

  const selectedOption = options.find((opt) => opt.value === value)

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = menuRef.current?.offsetWidth || Math.max(rect.width, 180)
      
      let left = rect.left
      if (align === 'right') {
        left = rect.right - menuWidth
      } else if (align === 'center') {
        left = rect.left + (rect.width / 2) - (menuWidth / 2)
      }

      // Ensure dropdown does not overflow viewport edges
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12
      }
      if (left < 12) {
        left = 12
      }

      setCoords({
        top: rect.bottom + 6,
        left: left,
        minWidth: Math.max(rect.width, 180),
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('resize', updateCoords)
      window.addEventListener('scroll', updateCoords, true)
    }

    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [isOpen, align])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={`relative text-left ${className.includes('w-full') ? 'w-full block' : 'inline-block'} ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[#86868b] mb-1.5 select-none">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-semibold text-[#1d1d1f] hover:bg-[#eaeaea] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-colors cursor-pointer select-none ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="text-[#0066cc] shrink-0">{icon}</span>}
          {selectedOption ? (
            <span className="truncate flex items-center gap-1.5">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-[#86868b] truncate">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          size={14}
          className={`text-[#7a7a7a] transition-transform duration-200 shrink-0 transform-gpu ${
            isOpen ? 'rotate-180 text-[#0066cc]' : ''
          }`}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                minWidth: `${coords.minWidth}px`,
                zIndex: 99999,
              }}
              className={`max-h-60 overflow-y-auto rounded-2xl bg-white/95 border border-[#e5e5e7] shadow-2xl shadow-black/15 p-1.5 backdrop-blur-xl transform-gpu ${menuClassName}`}
              role="listbox"
            >
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer select-none text-left transform-gpu ${
                      isSelected
                        ? 'bg-[#0066cc]/10 text-[#0066cc] font-bold'
                        : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {option.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}`}>
                          {option.icon}
                        </span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </span>

                    <span className="flex items-center gap-1.5 shrink-0 ml-2">
                      {option.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-[#f0f0f2] text-[#525252]">
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-[#0066cc]" />}
                    </span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
