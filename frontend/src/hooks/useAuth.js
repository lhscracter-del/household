import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import * as authApi from '../api/auth'
import api from '../api/axios'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.user ?? null)
      navigate('/')
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.user ?? null)
      navigate('/')
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  return async () => {
    const stored = useAuthStore.getState()
    if (stored.refreshToken) {
      try { await api.delete('/api/auth/logout', { data: { refresh_token: stored.refreshToken } }) } catch {}
    }
    clearAuth()
    navigate('/login')
  }
}
