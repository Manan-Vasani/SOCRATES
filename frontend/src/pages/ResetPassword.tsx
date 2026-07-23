import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import BackToHome from '../components/auth/BackToHome'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
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

  const onSubmit = (data: ResetPasswordFields) => {
    toast.success('Password has been reset successfully!')
    navigate('/login')
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

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer shadow-sm select-none"
            >
              Reset Password
            </motion.button>
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
