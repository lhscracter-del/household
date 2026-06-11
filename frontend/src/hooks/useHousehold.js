import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHouseholdMembers,
  getHouseholdInvitations,
  createHouseholdInvitation,
  acceptHouseholdInvitation,
  rejectHouseholdInvitation,
  cancelHouseholdInvitation,
  leaveHousehold,
} from '../api/household'
import { QUERY_KEYS } from '../utils/queryKeys'

export function useHouseholdMembers() {
  return useQuery({ queryKey: [QUERY_KEYS.HOUSEHOLD_MEMBERS], queryFn: getHouseholdMembers })
}

export function useHouseholdInvitations() {
  return useQuery({ queryKey: [QUERY_KEYS.HOUSEHOLD_INVITATIONS], queryFn: getHouseholdInvitations })
}

export function useCreateHouseholdInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createHouseholdInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSEHOLD_INVITATIONS] }),
  })
}

// 공유 데이터 범위가 바뀌므로(가구 변경) 전체 데이터를 다시 불러온다.
const invalidateAll = (qc) => qc.invalidateQueries()

export function useAcceptHouseholdInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acceptHouseholdInvitation,
    onSuccess: () => invalidateAll(qc),
  })
}

export function useRejectHouseholdInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rejectHouseholdInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSEHOLD_INVITATIONS] }),
  })
}

export function useCancelHouseholdInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelHouseholdInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSEHOLD_INVITATIONS] }),
  })
}

export function useLeaveHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leaveHousehold,
    onSuccess: () => invalidateAll(qc),
  })
}
