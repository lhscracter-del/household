import api from './axios'

export const getBudgets = () => api.get('/api/budgets').then((r) => r.data)
export const createBudget = (data) => api.post('/api/budgets', data).then((r) => r.data)
export const updateBudget = (id, data) => api.put(`/api/budgets/${id}`, data).then((r) => r.data)
