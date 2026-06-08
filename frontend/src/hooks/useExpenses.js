import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../utils/queryKeys'
import * as expensesApi from '../api/expenses'

export function useExpenses(filters) {
  return useQuery({
    queryKey: [QUERY_KEYS.EXPENSES, filters],
    queryFn: () => expensesApi.getExpenses(filters),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => expensesApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
    },
  })
}
