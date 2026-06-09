import api from './axios'

export const getBudgets = (params) => api.get('/api/budgets', { params }).then((r) => r.data)
export const upsertBudget = (data) => api.post('/api/budgets', data).then((r) => r.data)
export const updateBudget = (id, data) => api.put(`/api/budgets/${id}`, data).then((r) => r.data)
export const deleteBudget = (id) => api.delete(`/api/budgets/${id}`)
