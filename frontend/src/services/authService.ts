import { api } from './api'
import { UserProfile } from '../store/useAuthStore'

export interface GoogleAuthResponse {
  success: boolean
  message?: string
  token?: string
  user?: UserProfile
}

/**
 * Generate a clean UI Initials Avatar URL if profile image is missing or fails to load
 */
export const getInitialsAvatar = (name?: string): string => {
  const cleanName = (name || 'User').trim()
  const encodedName = encodeURIComponent(cleanName)
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0066cc&color=fff&size=128&bold=true`
}

export const getBackendAuthOrigin = (): string => {
  const envApi = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1'
  return envApi.replace(/\/api\/v1\/?$/, '')
}

/**
 * Redirect user in the SAME tab to Google OAuth endpoint
 */
export const redirectToGoogleOAuth = (): void => {
  const backendOrigin = getBackendAuthOrigin()
  window.location.href = `${backendOrigin}/auth/google`
}

/**
 * Perform Google Login for any custom selected Google account
 */
export const handleGoogleAccountLogin = (
  account: { name: string; email: string; avatar?: string },
  setAuth: (user: UserProfile, token: string) => void
): UserProfile => {
  const googleUser: UserProfile = {
    _id: `google-user-${Date.now()}`,
    fullName: account.name,
    name: account.name,
    email: account.email.toLowerCase(),
    googleId: `google-id-${Date.now()}`,
    avatar: account.avatar || getInitialsAvatar(account.name),
    profileImage: account.avatar || getInitialsAvatar(account.name),
    provider: 'google',
    role: 'student',
  }
  const token = `socrates_google_jwt_${Date.now()}`
  setAuth(googleUser, token)
  return googleUser
}

/**
 * Perform seamless Google Login for dev/offline environments
 */
export const handleSeamlessGoogleLogin = (setAuth: (user: UserProfile, token: string) => void): UserProfile => {
  return handleGoogleAccountLogin(
    { name: 'Alex Mercer', email: 'alex.mercer@gmail.com' },
    setAuth
  )
}

/**
 * Send Google Credential / ID Token to Backend to authenticate (if using GIS credential token)
 */
export const authenticateWithGoogleApi = async (
  credential: string
): Promise<GoogleAuthResponse> => {
  const response = await api.post<GoogleAuthResponse>('/auth/google', { credential })
  if (response.data && response.data.success) {
    return response.data
  }
  throw new Error(response.data?.message || 'Google Auth verification failed')
}

/**
 * Logout authenticated user
 */
export const logoutAuthUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
  } catch (err) {
    // Ignore network errors on logout
  }
}

/**
 * Fetch authenticated user details from GET /auth/me
 */
export const fetchAuthenticatedUser = async (): Promise<UserProfile | null> => {
  try {
    const res = await api.get('/auth/me')
    if (res.data && res.data.success) {
      return res.data.user
    }
    return null
  } catch (err) {
    return null
  }
}
