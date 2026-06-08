import api from './axios'

export const getExpenses = (params) => api.get('/api/expenses', { params }).then((r) => r.data)
export const createExpense = (data) => api.post('/api/expenses', data).then((r) => r.data)
export const updateExpense = (id, data) => api.put(`/api/expenses/${id}`, data).then((r) => r.data)
export const deleteExpense = (id) => api.delete(`/api/expenses/${id}`)
