import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import InputField from '../components/InputField'
import PasswordInput from '../components/PasswordInput'
import GoogleButton from '../components/GoogleButton'
import Divider from '../components/Divider'
import { api } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { redirectToGoogleOAuth } from '../services/authService'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFields = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleGoogleSignIn = () => {
    redirectToGoogleOAuth()
  }

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      })

      if (response.data?.success && response.data?.token) {
        setAuth(response.data.user, response.data.token)
        toast.success(`Welcome back, ${response.data.user.fullName || response.data.user.name}!`)
        navigate('/dashboard')
      } else {
        toast.error(response.data?.message || 'Login failed')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-[420px] max-w-full flex flex-col items-start gap-4 shrink-0">
        <BackToHome />
        <AuthCard>
          <AuthHeader
            title="Welcome Back"
            description="Continue your learning journey."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <InputField
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="Enter your email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1.5">
              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-medium text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] hover:shadow-md hover:shadow-[#0066cc]/20 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer transition-all duration-200 shadow-sm select-none inline-flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <Divider />

          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />

          <div className="mt-8 text-center text-xs select-none text-[#6e6e73]">
            <span>Don't have an account? </span>
            <Link
              to="/signup"
              className="font-semibold text-[#0066cc] hover:underline focus-visible:outline-2 focus-visible:outline-[#0066cc] rounded"
            >
              Create Account
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}

