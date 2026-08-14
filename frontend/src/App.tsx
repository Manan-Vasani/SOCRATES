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
  const { token, setAuth } = useAuthStore()
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (token && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      fetchAuthenticatedUser().then((user) => {
        if (user) {
          setAuth(user, token)
        }
      })
    }
  }, [token, setAuth])

  return null
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    // Prevent dragging images globally across the entire app
    const handleDragStart = (e: DragEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault()
      }
    }
    document.addEventListener('dragstart', handleDragStart)

    // Force manual scroll restoration so page refresh always renders from top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Instantly scroll to top on page mount, refresh, and route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    return () => {
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthSync />
      <Toaster position="top-right" richColors duration={1800} closeButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutors" element={<Tutors />} />
        <Route path="/tutors/:tutorId/schedule" element={<TutorSchedule />} />
        <Route path="/study-room/:roomId" element={<StudyRoom />} />
        <Route path="/meeting/:meetingId" element={<StudyRoom />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/recordings" element={<RecordingsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
