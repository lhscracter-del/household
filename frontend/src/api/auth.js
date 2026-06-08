import api from './axios'

export const register = (data) => api.post('/api/auth/register', data).then((r) => r.data)
export const login = (data) => api.post('/api/auth/login', data).then((r) => r.data)
export const refresh = (refreshToken) =>
  api.post('/api/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data)
export const logout = (refreshToken) =>
  api.delete('/api/auth/logout', { data: { refresh_token: refreshToken } })
