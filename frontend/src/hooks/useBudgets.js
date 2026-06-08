import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../utils/queryKeys'
import * as budgetsApi from '../api/budgets'

export function useBudgets() {
  return useQuery({
    queryKey: [QUERY_KEYS.BUDGETS],
    queryFn: budgetsApi.getBudgets,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: budgetsApi.createBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BUDGETS] }),
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => budgetsApi.updateBudget(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BUDGETS] }),
  })
}
