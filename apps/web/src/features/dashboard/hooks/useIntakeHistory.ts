'use client'

import { useQuery } from '@tanstack/react-query'
import type { IntakeHistoryDay, IntakeHistoryResponse } from '@/types/api'

export type { IntakeHistoryDay, IntakeHistoryResponse }

async function fetchIntakeHistory(
  year: number,
  month: number
): Promise<IntakeHistoryResponse> {
  const res = await fetch(`/api/my/intake/history?year=${year}&month=${month}`)
  if (!res.ok) throw new Error('Failed to fetch intake history')
  return res.json()
}

export function useIntakeHistory(year: number, month: number) {
  return useQuery({
    queryKey: ['intake', 'history', year, month],
    queryFn: () => fetchIntakeHistory(year, month),
    staleTime: 60 * 1000,
  })
}
