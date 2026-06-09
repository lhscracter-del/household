import api from './axios'

export const getPaymentMethods = () => api.get('/api/payment-methods').then((r) => r.data)
export const createPaymentMethod = (data) => api.post('/api/payment-methods', data).then((r) => r.data)
export const updatePaymentMethod = (id, data) => api.put(`/api/payment-methods/${id}`, data).then((r) => r.data)
export const deletePaymentMethod = (id) => api.delete(`/api/payment-methods/${id}`)
