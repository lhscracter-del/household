import api from './axios'

export const getSummary = (params) => api.get('/api/stats/summary', { params }).then((r) => r.data)
export const getByCategory = (params) => api.get('/api/stats/by-category', { params }).then((r) => r.data)
export const getByPayment = (params) => api.get('/api/stats/by-payment', { params }).then((r) => r.data)
export const getTrend = (params) => api.get('/api/stats/trend', { params }).then((r) => r.data)
export const getYearlyTotal = (params) => api.get('/api/stats/yearly-total', { params }).then((r) => r.data)
