'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserSupplementsResponse } from '@/types/api'

const QUERY_KEY = ['my', 'supplements'] as const

async function fetchSupplements(): Promise<UserSupplementsResponse> {
  const res = await fetch('/api/my/supplements')
  if (!res.ok) throw new Error('Failed to fetch supplements')
  return res.json()
}

async function addSupplementApi(body: {
  product_id: string
  daily_dose?: number
  note?: string
}) {
  const res = await fetch('/api/my/supplements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw err
  }
  return res.json()
}

async function removeSupplementApi(id: string) {
  const res = await fetch(`/api/my/supplements/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove supplement')
  return res.json()
}

async function updateSupplementApi(
  id: string,
  body: { daily_dose?: number; note?: string; started_at?: string }
) {
  const res = await fetch(`/api/my/supplements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to update supplement')
  return res.json()
}

export function useMySupplements() {
  const queryClient = useQueryClient()

  const supplements = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSupplements,
    staleTime: 30 * 1000,
  })

  const addSupplement = useMutation({
    mutationFn: addSupplementApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const removeSupplement = useMutation({
    mutationFn: removeSupplementApi,
    onMutate: async (id: string) => {
      // 진행 중인 fetch 취소
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      // 이전 데이터 백업
      const previous = queryClient.getQueryData<UserSupplementsResponse>(QUERY_KEY)
      // 낙관적으로 즉시 제거
      if (previous) {
        queryClient.setQueryData<UserSupplementsResponse>(QUERY_KEY, {
          ...previous,
          data: previous.data.filter((s) => s.id !== id),
        })
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      // 실패 시 롤백
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const updateSupplement = useMutation({
    mutationFn: ({ id, ...body }: { id: string; daily_dose?: number; note?: string; started_at?: string }) =>
      updateSupplementApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    supplements,
    addSupplement,
    removeSupplement,
    updateSupplement,
  }
}
