import { create } from 'zustand'

export interface UserProfile {
  _id: string
  fullName?: string
  name: string
  email: string
  googleId?: string
  profileImage?: string
  avatar: string
  provider?: 'local' | 'google'
  role: 'student' | 'tutor' | 'both' | 'admin'
  bio?: string
  subjects?: string[]
  hourlyRate?: number
  rate20Min?: number
  rate30Min?: number
  availability?: any[]
  isVerified?: boolean
  createdAt?: string
  updatedAt?: string
}

export type ProfilePerspective = 'student' | 'tutor' | 'both'

interface AuthState {
  user: UserProfile | null
  token: string | null
  activePerspective: ProfilePerspective
  setAuth: (user: UserProfile, token: string) => void
  updateUser: (updatedUser: Partial<UserProfile>) => void
  setPerspective: (perspective: ProfilePerspective) => void
  logout: () => void
}

const getInitialToken = () => localStorage.getItem('socrates_token') || null
const getInitialUser = (): UserProfile | null => {
  const stored = localStorage.getItem('socrates_user')
  try {
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return {
      ...parsed,
      fullName: parsed.fullName || parsed.name || '',
      name: parsed.fullName || parsed.name || '',
      profileImage: parsed.profileImage || parsed.avatar || '',
      avatar: parsed.profileImage || parsed.avatar || '',
    }
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  activePerspective: 'both',

  setAuth: (user, token) => {
    const normalizedUser: UserProfile = {
      ...user,
      fullName: user.fullName || user.name,
      name: user.fullName || user.name,
      profileImage: user.profileImage || user.avatar,
      avatar: user.profileImage || user.avatar,
      provider: user.provider || 'local',
    }
    localStorage.setItem('socrates_token', token)
    localStorage.setItem('socrates_user', JSON.stringify(normalizedUser))
    set({ user: normalizedUser, token })
  },

  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return state
      const newUser = {
        ...state.user,
        ...updatedUser,
        fullName: updatedUser.fullName || updatedUser.name || state.user.fullName || state.user.name,
        name: updatedUser.fullName || updatedUser.name || state.user.name,
        profileImage: updatedUser.profileImage || updatedUser.avatar || state.user.profileImage || state.user.avatar,
        avatar: updatedUser.profileImage || updatedUser.avatar || state.user.avatar,
      }
      localStorage.setItem('socrates_user', JSON.stringify(newUser))
      return { user: newUser }
    })
  },

  setPerspective: (perspective) => {
    set({ activePerspective: perspective })
  },

  logout: () => {
    localStorage.removeItem('socrates_token')
    localStorage.removeItem('socrates_user')
    set({ user: null, token: null })
  },
}))

