'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IntakeTodayItem, IntakeTodayResponse } from '@/types/api'

export type { IntakeTodayItem, IntakeTodayResponse }

const QUERY_KEY = ['intake', 'today'] as const

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchIntakeToday(): Promise<IntakeTodayResponse> {
  const date = getToday()
  const res = await fetch(`/api/my/intake?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch intake')
  return res.json()
}

async function toggleIntakeApi(body: {
  product_id: string
  taken_date: string
  is_taken: boolean
}) {
  const res = await fetch('/api/my/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to toggle intake')
  return res.json()
}

export function useIntakeToday() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchIntakeToday,
    staleTime: 30 * 1000,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleIntakeApi,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      // Snapshot previous value
      const previous = queryClient.getQueryData<IntakeTodayResponse>(QUERY_KEY)

      // Optimistic update
      if (previous) {
        const updatedSupplements = previous.supplements.map((s) =>
          s.product_id === variables.product_id
            ? { ...s, is_taken: variables.is_taken }
            : s
        )
        const takenCount = updatedSupplements.filter((s) => s.is_taken).length

        queryClient.setQueryData<IntakeTodayResponse>(QUERY_KEY, {
          ...previous,
          supplements: updatedSupplements,
          taken_count: takenCount,
        })
      }

      return { previous }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      // Also invalidate history so calendar reflects changes
      queryClient.invalidateQueries({ queryKey: ['intake', 'history'] })
    },
  })

  const toggle = (productId: string, currentIsTaken: boolean) => {
    toggleMutation.mutate({
      product_id: productId,
      taken_date: getToday(),
      is_taken: !currentIsTaken,
    })
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    toggle,
    isToggling: toggleMutation.isPending,
  }
}
