import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/v1'

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
  avatar?: string
}) => {
  try {
    const response = await api.put('/auth/profile', data)
    return response.data
  } catch (error) {
    return { success: false, message: 'Failed to update profile' }
  }
}

// AI Microservice Recommendation Endpoint (FastAPI @ Port 8000)
const AI_SERVICE_URL = 'http://localhost:8000/api/v1/ai'

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
