import React from 'react'
import {
  VideoOff,
  MicOff,
  SlidersHorizontal,
  RefreshCw,
  X,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { useScrollLock } from '../../hooks/useScrollLock'

interface PermissionGuideModalProps {
  isOpen: boolean
  deviceType: 'microphone' | 'camera' | 'media' | null
  onClose: () => void
  onRetry: () => void
}

export default function PermissionGuideModal({
  isOpen,
  deviceType,
  onClose,
  onRetry,
}: PermissionGuideModalProps) {
  useScrollLock(Boolean(isOpen && deviceType))

  if (!isOpen || !deviceType) return null

  const isCamera = deviceType === 'camera'
  const isMic = deviceType === 'microphone'

  const title = isCamera
    ? 'Camera access is blocked'
    : isMic
    ? 'Microphone access is blocked'
    : 'Camera & microphone access blocked'

  const deviceLabel = isCamera ? 'camera' : isMic ? 'microphone' : 'camera and microphone'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 text-[#1d1d1f] animate-in zoom-in-95 duration-200">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#7a7a7a] hover:text-[#1d1d1f] flex items-center justify-center transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header with Device Warning Icon */}
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20 flex items-center justify-center text-[#ff3b30] shrink-0">
            {isCamera ? (
              <VideoOff size={24} />
            ) : isMic ? (
              <MicOff size={24} />
            ) : (
              <ShieldAlert size={24} />
            )}
          </div>
          <div className="space-y-1 pr-6">
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
              {title}
            </h2>
            <p className="text-xs text-[#7a7a7a] leading-relaxed">
              Your browser has blocked access to your {deviceLabel}. Follow the steps below to enable it so others can hear and see you.
            </p>
          </div>
        </div>

        {/* Step-by-Step Visual Guidance Card */}
        <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] space-y-4 text-xs">
          
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="font-semibold text-[#1d1d1f] block">
                Click the settings icon in your address bar
              </span>
              <p className="text-[#7a7a7a] leading-normal text-[11px]">
                Look to the left of the URL <strong className="text-[#1d1d1f] font-semibold">{window.location.host}</strong> for the lock or tune icon.
              </p>
              {/* Visual Mockup of Address Bar */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e5e5e7] shadow-2xs text-[11px] font-mono text-[#525252]">
                <div className="flex items-center gap-1 text-[#0066cc] font-semibold">
                  <SlidersHorizontal size={13} className="text-[#0066cc]" />
                  <span>View site information</span>
                </div>
                <span className="text-[#a1a1a6]">|</span>
                <span className="text-[#1d1d1f]">{window.location.host}</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="font-semibold text-[#1d1d1f] block">
                Turn on the switch or click "Reset permissions"
              </span>
              <p className="text-[#7a7a7a] leading-normal text-[11px]">
                In the popup, toggle <strong>Camera</strong> and <strong>Microphone</strong> to <span className="text-[#34c759] font-bold">ON</span>, or click the <strong>Reset permissions</strong> button.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-0.5 flex-1">
              <span className="font-semibold text-[#1d1d1f] block">
                Click "Try Again" below
              </span>
              <p className="text-[#7a7a7a] leading-normal text-[11px]">
                Once granted, click the button below to turn on your device immediately.
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={onRetry}
            className="w-full sm:flex-1 h-11 px-5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-xs tracking-wide transition-colors duration-150 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:flex-1 h-11 px-5 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e5e5e7] text-[#1d1d1f] font-semibold text-xs transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Reload Page</span>
          </button>
        </div>

      </div>
    </div>
  )
}
