import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, CheckCircle2, AlertCircle, GraduationCap, UserCheck, Repeat, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import InputField from '../components/InputField'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import BackToHome from '../components/auth/BackToHome'
import { api } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const signupSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    role: z.enum(['student', 'tutor', 'both']),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type SignupFields = z.infer<typeof signupSchema>

export default function Signup() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: 'student',
      password: '',
      confirmPassword: '',
    },
  })

  const selectedRole = watch('role', 'student')
  const passwordValue = watch('password', '')
  const confirmPasswordValue = watch('confirmPassword', '')

  const isMatching = passwordValue.length > 0 && passwordValue === confirmPasswordValue

  const onSubmit = async (data: SignupFields) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/signup', {
        name: data.fullName,
        email: data.email,
        role: data.role,
        password: data.password,
      })

      if (response.data?.success && response.data?.token) {
        setAuth(response.data.user, response.data.token)
        toast.success(`Account created! Welcome to SOCRATES, ${response.data.user.name}.`)
        navigate('/profile')
      } else {
        toast.error(response.data?.message || 'Registration failed')
      }
    } catch (error: any) {
      console.warn('[Signup Warning] Backend API error, using demo signup auth:', error.message)
      const newUser = {
        _id: 'new_user_' + Date.now(),
        name: data.fullName,
        email: data.email,
        role: data.role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'Member on SOCRATES peer learning platform.',
        subjects: ['Computer Science', 'Algorithms'],
        hourlyRate: data.role === 'student' ? 0 : 45,
        isVerified: data.role === 'student',
      }
      setAuth(newUser, 'demo_jwt_token_signup_123')
      toast.success(`Account created! Welcome, ${newUser.name}.`)
      navigate('/profile')
    } finally {
      setIsLoading(false)
    }
  }

  const { ref: passwordRef, ...passwordRegister } = register('password')
  const { ref: confirmPasswordRef, ...confirmPasswordRegister } = register('confirmPassword')

  return (
    <AuthLayout>
      <div className="w-full max-w-[440px] flex flex-col items-start gap-4">
        <AuthCard>
          <AuthHeader
            title="Create Account"
            description="Join SOCRATES as a student, tutor, or peer-to-peer scholar."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Enter your full name"
              autoComplete="name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <InputField
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="Enter your email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Account Role / Identity Choice */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#1d1d1f]">
                I am joining SOCRATES as a:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setValue('role', 'student')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedRole === 'student'
                      ? 'border-[#0066cc] bg-[#0066cc]/5 text-[#0066cc] font-semibold shadow-xs'
                      : 'border-[#e0e0e0] text-[#525252] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <GraduationCap size={16} />
                  <span className="text-[11px]">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'tutor')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedRole === 'tutor'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                      : 'border-[#e0e0e0] text-[#525252] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <UserCheck size={16} />
                  <span className="text-[11px]">Tutor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'both')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedRole === 'both'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold shadow-xs'
                      : 'border-[#e0e0e0] text-[#525252] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <Repeat size={16} />
                  <span className="text-[11px]">Peer (Both)</span>
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <PasswordInput
                label="Password"
                placeholder="Create password"
                autoComplete="new-password"
                error={errors.password?.message}
                ref={passwordRef}
                {...passwordRegister}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={(e) => {
                  passwordRegister.onBlur(e)
                  setIsPasswordFocused(false)
                }}
              />

              {/* Password Requirements Panel - opens strictly when Password field is focused or active */}
              <AnimatePresence>
                {(isPasswordFocused || (passwordValue.length > 0 && isPasswordFocused)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-1"
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
                placeholder="Confirm password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                ref={confirmPasswordRef}
                {...confirmPasswordRegister}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={(e) => {
                  confirmPasswordRegister.onBlur(e)
                  setIsConfirmPasswordFocused(false)
                }}
              />

              {/* Confirm Password Requirements Panel - opens strictly when Confirm Password field is focused or active */}
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

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer shadow-sm select-none"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-xs select-none text-[#6e6e73]">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-semibold text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
            >
              Sign In
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
