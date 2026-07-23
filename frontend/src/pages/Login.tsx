import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import InputField from '../components/InputField'
import PasswordInput from '../components/PasswordInput'
import GoogleButton from '../components/GoogleButton'
import Divider from '../components/Divider'
import BackToHome from '../components/auth/BackToHome'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

type LoginFields = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
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

  const onSubmit = (data: LoginFields) => {
    toast.success('Successfully signed in!')
    navigate('/')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] flex flex-col items-start gap-4">
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

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full py-3 rounded-xl bg-[#0066cc] text-white text-sm font-semibold hover:bg-[#0077ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] cursor-pointer shadow-sm select-none"
            >
              Sign In
            </motion.button>
          </form>

          <Divider />

          <GoogleButton />

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

