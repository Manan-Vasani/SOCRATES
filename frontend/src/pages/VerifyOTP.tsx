import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import OTPInput from '../components/OTPInput'
import BackToHome from '../components/auth/BackToHome'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number>(120) // 2 minutes (120s)

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleResend = () => {
    if (timeLeft > 0) return
    setTimeLeft(120)
    setOtp(Array(6).fill(''))
    setError('')
    toast.success('A new verification code has been sent!')
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    toast.success('Code verified successfully!')
    navigate('/reset-password')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] flex flex-col items-start gap-4">
        <BackToHome />
        <AuthCard>
          <AuthHeader
            title="Verify OTP"
            description="Enter the 6-digit verification code sent to your email."
          />

          <form onSubmit={handleVerify} className="space-y-6">
            <OTPInput
              value={otp}
              onChange={(newOtp) => {
                setOtp(newOtp)
                if (error) setError('')
              }}
              error={error}
            />

            {/* Countdown timer animation & Resend */}
            <div className="flex flex-col items-center justify-center space-y-2 select-none">
              <span className="text-sm font-semibold font-mono text-[#1d1d1f]">
                {formatTime(timeLeft)}
              </span>
              <div className="text-xs text-[#6e6e73]">
                <span>Didn't receive the code? </span>
                {timeLeft > 0 ? (
                  <span className="text-[#6e6e73]/60 cursor-not-allowed">
                    Resend Code
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-semibold text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer shadow-sm select-none"
            >
              Verify OTP
            </motion.button>
          </form>

          <div className="mt-8 text-center select-none">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change email address</span>
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
