import axios from 'axios'

const apiBaseUrl = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('taskflow_auth')
    if (stored) {
      const auth = JSON.parse(stored)
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
      }
    }
  } catch {
    // ignore parse errors
  }
  return config
})

// Redirect to login on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taskflow_auth')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default client
