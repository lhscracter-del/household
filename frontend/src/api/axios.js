import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
        const refreshToken = stored?.state?.refreshToken
        if (refreshToken) {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/api/auth/refresh`,
            { refresh_token: refreshToken }
          )
          useAuthStore.getState().setAuth(data.access_token, useAuthStore.getState().user)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        }
      } catch {
        useAuthStore.getState().clearAuth()
      }
    }
    return Promise.reject(error)
  }
)

export default api
