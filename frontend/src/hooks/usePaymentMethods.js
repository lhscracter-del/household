import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../api/paymentMethods'

export function usePaymentMethods() {
  return useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => updatePaymentMethod(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}
