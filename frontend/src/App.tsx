import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Tutors from './pages/Tutors'
import TutorSchedule from './pages/TutorSchedule'
import StudyRoom from './pages/StudyRoom'
import PracticePage from './pages/PracticePage'
import CommunityPage from './pages/CommunityPage'
import RecordingsPage from './pages/RecordingsPage'
import { useAuthStore } from './store/useAuthStore'
import { fetchAuthenticatedUser } from './services/authService'
import './App.css'

function AuthSync() {
  const { token, setAuth, user } = useAuthStore()
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (token && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      fetchAuthenticatedUser().then((newUser) => {
        if (newUser) {
          // Avoid re-rendering Navbar if cached user matches fetched user
          const hasDiff = !user || newUser._id !== user._id || newUser.avatar !== user.avatar || newUser.fullName !== user.fullName
          if (hasDiff) {
            setAuth(newUser, token)
          }
        }
      })
    }
  }, [token, setAuth, user])

  return null
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const prevPathname = useRef(pathname)

  useLayoutEffect(() => {
    // Prevent dragging images globally across the entire app
    const handleDragStart = (e: DragEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault()
      }
    }
    document.addEventListener('dragstart', handleDragStart)

    // Only force scroll to top when navigating to a DIFFERENT route, NOT on page refresh (F5)
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }

    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }

    return () => {
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [pathname, hash])

  return null
}

import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafc] selection:bg-[#0066cc]/10 transform-gpu overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full flex flex-col min-h-[calc(100vh-180px)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthSync />
      <Toaster position="top-right" richColors duration={1800} closeButton />
      <Routes>
        {/* Main pages wrapped in persistent RootLayout — Navbar and Footer NEVER refresh or unmount */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tutors" element={<Tutors />} />
          <Route path="/tutors/:tutorId/schedule" element={<TutorSchedule />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/recordings" element={<RecordingsPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Standalone full-viewport pages */}
        <Route path="/study-room/:roomId" element={<StudyRoom />} />
        <Route path="/meeting/:meetingId" element={<StudyRoom />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
