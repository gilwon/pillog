'use client'

import { useQuery } from '@tanstack/react-query'
import type { AdminStatsResponse } from '@/types/api'

async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const res = await fetch('/api/admin/stats')
  if (!res.ok) throw new Error('Failed to fetch admin stats')
  return res.json()
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 60 * 1000, // 1분
  })
}
