import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

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

  const passwordValue = watch('password', '')
  const confirmPasswordValue = watch('confirmPassword', '')

  const showMatchStatus = passwordValue.length > 0 && confirmPasswordValue.length > 0
  const isMatching = passwordValue === confirmPasswordValue

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
      <div className="w-full max-w-[420px] flex flex-col items-start gap-4">
        <BackToHome />
        <AuthCard>
          <AuthHeader
            title="Create New Password"
            description="Please enter your new password below."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Live password requirements checklist */}
            <PasswordStrength value={passwordValue} />

            <div className="space-y-1.5">
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {/* Live pass match feedback */}
              {showMatchStatus && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold select-none justify-end pt-1 ${
                    isMatching ? 'text-[#16a34a]' : 'text-[#dc2626]'
                  }`}
                >
                  {isMatching ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] hover:shadow-md hover:shadow-[#0066cc]/20 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer transition-all duration-200 shadow-sm select-none disabled:opacity-50"
            >
              <span>{isLoading ? 'Resetting Password...' : 'Reset Password'}</span>
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
