import api from './axios'

export const getRecurring = () => api.get('/api/recurring').then((r) => r.data)
export const createRecurring = (data) => api.post('/api/recurring', data).then((r) => r.data)
export const updateRecurring = (id, data) => api.put(`/api/recurring/${id}`, data).then((r) => r.data)
export const deleteRecurring = (id) => api.delete(`/api/recurring/${id}`)
