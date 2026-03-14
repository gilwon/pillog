'use client'

import { useQuery } from '@tanstack/react-query'
import { useCompareStore } from '@/features/compare/store/compare-store'
import type { ProductCompareResponse } from '@/types/api'

async function fetchCompareProducts(ids: string[]): Promise<ProductCompareResponse> {
  if (ids.length < 2) {
    return { products: [], comparison_table: [] }
  }

  const params = new URLSearchParams({ ids: ids.join(',') })
  const res = await fetch(`/api/products/compare?${params}`)
  if (!res.ok) throw new Error('Compare request failed')
  return res.json()
}

export function useCompare() {
  const { items, addItem, removeItem, clearAll, isMaxed } = useCompareStore()

  const ids = items.map((item) => item.id)

  const compareQuery = useQuery({
    queryKey: ['products', 'compare', ids],
    queryFn: () => fetchCompareProducts(ids),
    enabled: ids.length >= 2,
    staleTime: 60 * 1000,
  })

  function addToCompare(item: { id: string; name: string; company: string }) {
    addItem(item)
  }

  function removeFromCompare(id: string) {
    removeItem(id)
  }

  function clearCompare() {
    clearAll()
  }

  function isInCompare(id: string) {
    return items.some((item) => item.id === id)
  }

  return {
    compareItems: items,
    isMaxed: isMaxed(),
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    compareProducts: compareQuery,
  }
}
