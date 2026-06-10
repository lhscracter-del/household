import { useMutation } from '@tanstack/react-query'
import * as backupApi from '../api/backup'
import { queryClient } from '../utils/queryClient'

export function useRestoreBackup() {
  return useMutation({
    mutationFn: backupApi.restoreBackup,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
