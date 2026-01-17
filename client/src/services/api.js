import axios from 'axios'

// Use proxy in development, or direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method, config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    })
    const message = error.response?.data?.error || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getHistory: (refId) => api.get(`/bookings/${refId}`),
  depart: (refId, data) => api.post(`/bookings/${refId}/depart`, data),
  arrive: (refId, data) => api.post(`/bookings/${refId}/arrive`, data),
  deliver: (refId, data) => api.post(`/bookings/${refId}/deliver`, data),
  cancel: (refId) => api.post(`/bookings/${refId}/cancel`),
}

export const flightAPI = {
  getRoute: (params) => api.get('/flights/route', { params }),
}

export default api
