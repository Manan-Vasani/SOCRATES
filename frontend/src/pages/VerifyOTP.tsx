import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import OTPInput from '../components/OTPInput'
import BackToHome from '../components/auth/BackToHome'
import { api } from '../services/api'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string>('')
  const [isResending, setIsResending] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)

  const email = sessionStorage.getItem('reset_email') || ''

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address first.')
      navigate('/forgot-password')
      return
    }

    setIsResending(true)
    try {
      const response = await api.post('/auth/forgot-password', { email })
      if (response.data?.success) {
        setOtp(Array(6).fill(''))
        setError('')
        toast.success(response.data?.message || 'A new verification code has been sent to your email!')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the code.')
      return
    }

    setIsVerifying(true)
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpCode,
      })

      if (response.data?.success) {
        if (response.data?.resetToken) {
          sessionStorage.setItem('reset_token', response.data.resetToken)
        }
        sessionStorage.setItem('verified_otp', otpCode)
        toast.success('Code verified successfully! Enter your new password.')
        navigate('/reset-password')
      } else {
        setError(response.data?.message || 'Invalid verification code.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] flex flex-col items-start gap-4">
        <BackToHome />
        <AuthCard>
          <AuthHeader
            title="Verify OTP"
            description={
              email
                ? `Enter the 6-digit verification code sent to ${email}.`
                : 'Enter the 6-digit verification code sent to your email.'
            }
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

            {/* Resend Verification Code Action */}
            <div className="w-full space-y-2 select-none">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || isVerifying}
                className="w-full py-2.5 rounded-xl border border-[#0066cc]/30 bg-[#0066cc]/5 hover:bg-[#0066cc]/10 hover:border-[#0066cc]/60 text-[#0066cc] text-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#0066cc] cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 select-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#0066cc] ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending New Code...' : 'Resend Verification Code'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying || isResending}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] hover:shadow-md hover:shadow-[#0066cc]/20 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer transition-all duration-200 shadow-sm select-none inline-flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <span>Verify OTP</span>
              )}
            </button>
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
