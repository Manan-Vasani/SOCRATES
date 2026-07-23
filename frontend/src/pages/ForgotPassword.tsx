import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import InputField from '../components/InputField'
import BackToHome from '../components/auth/BackToHome'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const navigate = useNavigate()
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

  const onSubmit = (data: ForgotPasswordFields) => {
    toast.success(`Verification code sent to ${data.email}`)
    navigate('/verify-otp')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] flex flex-col items-start gap-4">
        <BackToHome />
        <AuthCard>
          <AuthHeader
            title="Forgot Password"
            description="Enter your email address to receive a verification code."
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

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer shadow-sm select-none"
            >
              Send OTP
            </motion.button>
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
