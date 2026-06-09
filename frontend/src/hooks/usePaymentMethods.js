import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../api/paymentMethods'
import { QUERY_KEYS } from '../utils/queryKeys'

export function usePaymentMethods() {
  return useQuery({ queryKey: [QUERY_KEYS.PAYMENT_METHODS], queryFn: getPaymentMethods })
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_METHODS] }),
  })
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => updatePaymentMethod(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_METHODS] }),
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_METHODS] }),
  })
}
