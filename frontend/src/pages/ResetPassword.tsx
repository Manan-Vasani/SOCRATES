import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import BackToHome from '../components/auth/BackToHome'
import { api } from '../services/api'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Must contain one uppercase letter')
      .regex(/[a-z]/, 'Must contain one lowercase letter')
      .regex(/[0-9]/, 'Must contain one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain one special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Input focus tracking states for smooth animated expansion
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)

  // Retrieve email, token & otp from URL query params or sessionStorage
  const urlToken = searchParams.get('token')
  const urlEmail = searchParams.get('email')

  const email = urlEmail || sessionStorage.getItem('reset_email') || ''
  const resetToken = urlToken || sessionStorage.getItem('reset_token') || ''
  const otp = sessionStorage.getItem('verified_otp') || ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordRegister = register('password')
  const confirmPasswordRegister = register('confirmPassword')

  const passwordValue = watch('password', '')
  const confirmPasswordValue = watch('confirmPassword', '')

  const isMatching = passwordValue === confirmPasswordValue && confirmPasswordValue.length > 0

  const onSubmit = async (data: ResetPasswordFields) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        resetToken,
        newPassword: data.password,
      })

      if (response.data?.success) {
        // Clear reset session storage
        sessionStorage.removeItem('reset_email')
        sessionStorage.removeItem('reset_token')
        sessionStorage.removeItem('verified_otp')

        toast.success(response.data?.message || 'Password reset successfully! Redirecting to Sign In...')
        
        // Redirect to main Sign In page (/login)
        setTimeout(() => {
          navigate('/login')
        }, 1200)
      } else {
        toast.error(response.data?.message || 'Password reset failed')
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Password reset failed. Please request a new code.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] min-w-[320px] flex flex-col items-start gap-4 shrink-0">
        <BackToHome />
        <AuthCard>
          <AuthHeader
            title="Create New Password"
            description="Please enter your new password below."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password Field */}
            <div className="space-y-1.5">
              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...passwordRegister}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={(e) => {
                  passwordRegister.onBlur(e)
                  setIsPasswordFocused(false)
                }}
              />

              {/* Password Requirements Panel - closed by default, opens on focus or typing */}
              <AnimatePresence>
                {(isPasswordFocused || passwordValue.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-1.5"
                  >
                    <PasswordStrength value={passwordValue} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...confirmPasswordRegister}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={(e) => {
                  confirmPasswordRegister.onBlur(e)
                  setIsConfirmPasswordFocused(false)
                }}
              />

              {/* Confirm Password Requirements Panel - matches Signup.tsx exactly */}
              <AnimatePresence>
                {(isConfirmPasswordFocused || confirmPasswordValue.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-1"
                  >
                    <div className="w-full bg-[#f5f5f7] border border-[#e5e5e5] rounded-2xl p-4 space-y-2 text-left select-none">
                      <p className="text-[12px] font-semibold text-[#1d1d1f]">
                        Confirm Password Requirements
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div
                          className={`flex items-center gap-2 font-medium transition-colors ${
                            confirmPasswordValue.length > 0
                              ? isMatching
                                ? 'text-emerald-600'
                                : 'text-red-600'
                              : 'text-[#6e6e73]'
                          }`}
                        >
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            {confirmPasswordValue.length > 0 ? (
                              isMatching ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />
                              )
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-[#6e6e73]/30" />
                            )}
                          </div>
                          <span>
                            {confirmPasswordValue.length === 0
                              ? 'Must match password exactly'
                              : isMatching
                              ? 'Passwords match perfectly'
                              : 'Passwords do not match yet'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] hover:shadow-md hover:shadow-[#0066cc]/20 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer transition-all duration-200 shadow-sm select-none inline-flex items-center justify-center gap-2 disabled:opacity-75 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center select-none">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel and Sign In</span>
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
