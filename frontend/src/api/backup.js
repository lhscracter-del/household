import api from './axios'

export const getBackup = () => api.get('/api/export/backup').then((r) => r.data)
export const restoreBackup = (data) => api.post('/api/export/restore', data).then((r) => r.data)
