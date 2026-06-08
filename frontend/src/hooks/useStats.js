import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../utils/queryKeys'
import * as statsApi from '../api/stats'

export function useSummary(params) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATS, 'summary', params],
    queryFn: () => statsApi.getSummary(params),
    enabled: !!(params.year && params.month),
  })
}

export function useByCategory(params) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATS, 'by-category', params],
    queryFn: () => statsApi.getByCategory(params),
    enabled: !!(params.year && params.month),
  })
}

export function useByPayment(params) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATS, 'by-payment', params],
    queryFn: () => statsApi.getByPayment(params),
    enabled: !!(params.year && params.month),
  })
}

export function useTrend(params) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATS, 'trend', params],
    queryFn: () => statsApi.getTrend(params),
    enabled: !!(params.type && params.year),
  })
}
