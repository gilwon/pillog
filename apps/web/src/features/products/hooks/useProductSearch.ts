'use client'

import { useQuery } from '@tanstack/react-query'
import type { ProductSearchResponse } from '@/types/api'

async function fetchSearchResults(
  query: string,
  page: number,
  match: 'all' | 'any'
): Promise<ProductSearchResponse> {
  if (!query.trim()) {
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
    }
  }

  const params = new URLSearchParams({
    q: query,
    page: String(page),
    match,
  })
  const res = await fetch(`/api/products/search?${params}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

export function useProductSearch(query: string, page: number = 1, match: 'all' | 'any' = 'all') {
  return useQuery({
    queryKey: ['products', 'search', query, page, match],
    queryFn: () => fetchSearchResults(query, page, match),
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  })
}
