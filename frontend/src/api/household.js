import api from './axios'

export const getHouseholdMembers = () => api.get('/api/household/members').then((r) => r.data)
export const getHouseholdInvitations = () => api.get('/api/household/invitations').then((r) => r.data)
export const createHouseholdInvitation = (email) => api.post('/api/household/invitations', { email }).then((r) => r.data)
export const acceptHouseholdInvitation = (id) => api.post(`/api/household/invitations/${id}/accept`).then((r) => r.data)
export const rejectHouseholdInvitation = (id) => api.post(`/api/household/invitations/${id}/reject`).then((r) => r.data)
export const cancelHouseholdInvitation = (id) => api.delete(`/api/household/invitations/${id}`)
export const leaveHousehold = () => api.post('/api/household/leave').then((r) => r.data)
