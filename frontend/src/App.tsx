import React, { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Tutors from './pages/Tutors'
import TutorSchedule from './pages/TutorSchedule'
import './App.css'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const prevPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    // Initial mount/refresh: preserve browser's native scroll position unless hash target exists
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname
      if (hash) {
        const element = document.getElementById(hash.replace('#', ''))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
      return
    }

    // Only scroll to top when navigating to a new route pathname
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      if (!hash) {
        window.scrollTo(0, 0)
      } else {
        const element = document.getElementById(hash.replace('#', ''))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" richColors duration={1800} closeButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutors" element={<Tutors />} />
        <Route path="/tutors/:tutorId/schedule" element={<TutorSchedule />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


