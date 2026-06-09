import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../utils/queryKeys'
import * as budgetsApi from '../api/budgets'

export function useBudgets(year) {
  return useQuery({
    queryKey: [QUERY_KEYS.BUDGETS, year],
    queryFn: () => budgetsApi.getBudgets(year ? { year } : undefined),
  })
}

export function useUpsertBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: budgetsApi.upsertBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BUDGETS] }),
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: budgetsApi.deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BUDGETS] }),
  })
}
