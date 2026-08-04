import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
})

// Automatically attach JWT token to headers if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('socrates_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface StatItem {
  numericValue: number
  suffix: string
  label: string
}

export interface TutorItem {
  _id?: string
  id?: string
  name: string
  subject: string
  experience: string
  rating: string | number
  reviews: string
  image: string
}

export interface FAQItem {
  q: string
  a: string
}

export const fetchHomepageOverview = async () => {
  try {
    const response = await api.get('/homepage/overview')
    return response.data?.data
  } catch (error) {
    console.warn('[API Client] Could not reach backend server. Utilizing fallback data.')
    return null
  }
}

export const fetchPlatformStats = async (): Promise<StatItem[] | null> => {
  try {
    const response = await api.get('/homepage/stats')
    return response.data?.data || null
  } catch (error) {
    return null
  }
}

export const fetchFeaturedTutors = async (): Promise<TutorItem[] | null> => {
  try {
    const response = await api.get('/homepage/tutors/featured')
    return response.data?.data || null
  } catch (error) {
    return null
  }
}

export const fetchAllTutors = async (): Promise<TutorItem[] | null> => {
  try {
    const response = await api.get('/tutors')
    return response.data?.data || null
  } catch (error) {
    return null
  }
}

export const fetchFAQs = async (): Promise<FAQItem[] | null> => {
  try {
    const response = await api.get('/homepage/faqs')
    return response.data?.data || null
  } catch (error) {
    return null
  }
}

export const subscribeLead = async (email: string, role: string = 'general') => {
  try {
    const response = await api.post('/homepage/leads/subscribe', { email, role })
    return response.data
  } catch (error) {
    return { success: true, message: 'Thank you for subscribing!' }
  }
}

// Auth & User Profile API Endpoints
export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/auth/me')
    return response.data?.user
  } catch (error) {
    return null
  }
}

export const updateUserProfileApi = async (data: {
  name?: string
  bio?: string
  subjects?: string[]
  hourlyRate?: number
  rate20Min?: number
  rate30Min?: number
  avatar?: string
  availability?: any[]
}) => {
  try {
    const response = await api.put('/auth/profile', data)
    return response.data
  } catch (error) {
    return { success: false, message: 'Failed to update profile' }
  }
}

// AI Microservice Recommendation Endpoint (FastAPI @ Port 8000)
const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL as string) || 'http://localhost:8000/api/v1/ai'

export interface AiRecommendRequest {
  query?: string
  subject?: string
  max_budget?: number
  candidates?: any[]
}

export const fetchAiTutorRecommendations = async (req: AiRecommendRequest) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/recommend/tutors`, req, {
      timeout: 4000,
    })
    return response.data
  } catch (error) {
    console.warn('[AI Microservice] Microservice offline. Operating local ML model fallback.')
    return null
  }
}

// Real Backend Tutor & Schedule API Endpoints
export const fetchTutorDetailsApi = async (tutorId: string) => {
  try {
    const response = await api.get(`/tutors/${tutorId}`)
    return response.data?.data || null
  } catch (error) {
    return null
  }
}

export const fetchTutorBookingsApi = async (tutorId: string) => {
  try {
    const response = await api.get(`/tutors/${tutorId}/bookings`)
    return response.data?.data || []
  } catch (error) {
    return []
  }
}

export const createTutorBookingApi = async (
  tutorId: string,
  bookingData: {
    studentName: string
    date: string
    time: string
    subject: string
    duration: number
    topic?: string
    fee: number
  }
) => {
  try {
    const response = await api.post(`/tutors/${tutorId}/book`, bookingData)
    return response.data
  } catch (error) {
    return { success: false, message: 'Could not connect to backend server for booking.' }
  }
}

// ═══════════════════════════════════════════════════════════════
//  COMMUNITY / DOUBT BOARD API
// ═══════════════════════════════════════════════════════════════

export const fetchCommunityThreads = async (params?: {
  page?: number
  limit?: number
  subject?: string
  filter?: string
  sort?: string
  search?: string
}) => {
  try {
    const response = await api.get('/community/threads', { params })
    return response.data
  } catch (error) {
    console.warn('[API] Could not fetch community threads')
    return { success: false, data: [], pagination: { page: 1, total: 0, pages: 0 } }
  }
}

export const fetchCommunityThread = async (threadId: string) => {
  try {
    const response = await api.get(`/community/threads/${threadId}`)
    return response.data
  } catch (error) {
    return null
  }
}

export const createCommunityThread = async (data: {
  title: string
  content: string
  subject: string
  tags?: string[]
  codeSnippet?: string
  media?: { url: string; type: 'image' | 'video'; publicId?: string }[]
}) => {
  const response = await api.post('/community/threads', data)
  return response.data
}

export const voteCommunityThread = async (threadId: string, vote: 'up' | 'down') => {
  const response = await api.post(`/community/threads/${threadId}/vote`, { vote })
  return response.data
}

export const bookmarkCommunityThread = async (threadId: string) => {
  const response = await api.post(`/community/threads/${threadId}/bookmark`)
  return response.data
}

export const solveCommunityThread = async (threadId: string, solvedByCommentAuthor?: string) => {
  const response = await api.post(`/community/threads/${threadId}/solve`, { solvedByCommentAuthor })
  return response.data
}

export const createCommunityComment = async (
  threadId: string,
  data: { text: string; parentComment?: string; media?: { url: string; type: 'image' | 'video' }[] }
) => {
  const response = await api.post(`/community/threads/${threadId}/comments`, data)
  return response.data
}

export const voteCommunityComment = async (commentId: string, vote: 'up' | 'down') => {
  const response = await api.post(`/community/comments/${commentId}/vote`, { vote })
  return response.data
}

export const editCommunityComment = async (commentId: string, text: string) => {
  const response = await api.put(`/community/comments/${commentId}`, { text })
  return response.data
}

export const deleteCommunityComment = async (commentId: string) => {
  const response = await api.delete(`/community/comments/${commentId}`)
  return response.data
}

export const fetchCommunityLeaderboard = async (limit = 10) => {
  try {
    const response = await api.get('/community/leaderboard', { params: { limit } })
    return response.data?.data || []
  } catch (error) {
    return []
  }
}

export const fetchCommunityBookmarks = async () => {
  try {
    const response = await api.get('/community/bookmarks')
    return response.data?.data || []
  } catch (error) {
    return []
  }
}

// ═══════════════════════════════════════════════════════════════
//  STUDY ROOM API
// ═══════════════════════════════════════════════════════════════

export const fetchStudyRooms = async (params?: {
  page?: number
  limit?: number
  subject?: string
  tag?: string
  search?: string
}) => {
  try {
    const response = await api.get('/study-rooms', { params })
    return response.data
  } catch (error) {
    return { success: false, data: [], pagination: { page: 1, total: 0, pages: 0 } }
  }
}

export const createStudyRoom = async (data: {
  title: string
  subject: string
  description?: string
  maxCapacity?: number
  tag?: string
  isPrivate?: boolean
  accessCode?: string
}) => {
  const response = await api.post('/study-rooms', data)
  return response.data
}

export const fetchStudyRoom = async (roomId: string) => {
  try {
    const response = await api.get(`/study-rooms/${roomId}`)
    return response.data
  } catch (error) {
    return null
  }
}

export const joinStudyRoom = async (roomId: string, accessCode?: string) => {
  const response = await api.post(`/study-rooms/${roomId}/join`, { accessCode })
  return response.data
}

export const leaveStudyRoom = async (roomId: string) => {
  const response = await api.post(`/study-rooms/${roomId}/leave`)
  return response.data
}

export const endStudyRoom = async (roomId: string) => {
  const response = await api.post(`/study-rooms/${roomId}/end`)
  return response.data
}

export const fetchStudyRoomMessages = async (roomId: string, page = 1) => {
  try {
    const response = await api.get(`/study-rooms/${roomId}/messages`, { params: { page } })
    return response.data
  } catch (error) {
    return { success: false, data: [] }
  }
}

export const createStudyRoomFromThread = async (threadId: string) => {
  const response = await api.post(`/study-rooms/from-thread/${threadId}`)
  return response.data
}

// ═══════════════════════════════════════════════════════════════
//  MEDIA UPLOAD API
// ═══════════════════════════════════════════════════════════════

export const uploadMedia = async (files: File[]) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const response = await api.post('/upload/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
  return response.data
}
