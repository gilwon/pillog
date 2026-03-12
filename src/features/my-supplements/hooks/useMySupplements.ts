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
    onSuccess: () => {
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
