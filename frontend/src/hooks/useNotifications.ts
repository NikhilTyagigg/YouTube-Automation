import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../constants/routes'
import { notificationService } from '../services/notificationService'

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: notificationService.list, refetchInterval: 60_000 })
}

export function useMarkNotificationRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markRead,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.notifications })
      const previous = client.getQueryData(queryKeys.notifications)
      client.setQueryData(queryKeys.notifications, (items: Array<{ id: string; read: boolean }> = []) => items.map((item) => item.id === id ? { ...item, read: true } : item))
      return { previous }
    },
    onError: (_error, _id, context) => client.setQueryData(queryKeys.notifications, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  })
}

export function useDeleteNotification() {
  const client = useQueryClient()
  return useMutation({ mutationFn: notificationService.remove, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }) })
}