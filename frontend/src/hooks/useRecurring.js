import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../utils/queryKeys'
import { getRecurring } from '../api/recurring'

export function useRecurring() {
  return useQuery({
    queryKey: [QUERY_KEYS.RECURRING],
    queryFn: getRecurring,
  })
}
