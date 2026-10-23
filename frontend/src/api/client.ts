import axios from 'axios'

function getApiBaseUrl(): string {
  const envUrl = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL?.trim()
  if (envUrl && envUrl !== '/api') {
    const cleaned = envUrl.replace(/\/+$/, '')
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
  }
  return '/api'
}

const client = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request and intercept unconfigured production deployments
client.interceptors.request.use((config) => {
  const isRemoteProduction =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'

  const rawEnv = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL?.trim()

  if (isRemoteProduction && (!rawEnv || rawEnv === '' || rawEnv === '/api')) {
    return Promise.reject(
      new Error(
        'Backend API URL is not configured. Please set the VITE_API_BASE_URL environment variable in your Vercel Project Settings to your deployed backend URL (e.g. https://your-backend.onrender.com/api).'
      )
    )
  }

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
