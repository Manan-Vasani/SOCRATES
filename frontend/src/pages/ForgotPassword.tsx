import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import InputField from '../components/InputField'
import BackToHome from '../components/auth/BackToHome'
import { api } from '../services/api'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFields) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', {
        email: data.email,
      })

      if (response.data?.success) {
        sessionStorage.setItem('reset_email', data.email)
        toast.success(response.data?.message || `Verification OTP code sent to ${data.email}`)
        navigate('/verify-otp')
      } else {
        toast.error(response.data?.message || 'Failed to send OTP')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to request password reset'
      toast.error(errorMsg)
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
            title="Forgot Password"
            description="Enter your email address to receive a 6-digit verification code."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <InputField
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] hover:shadow-md hover:shadow-[#0066cc]/20 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer transition-all duration-200 shadow-sm select-none disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending Verification Code...' : 'Send Verification OTP'}</span>
            </button>
          </form>

          <div className="mt-8 text-center select-none">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
