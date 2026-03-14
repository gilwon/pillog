'use client'

import { useState } from 'react'
import type { HealthConcernKey, RecommendedProduct } from '../types'

interface RecommendationState {
  products: RecommendedProduct[]
  total: number
  loading: boolean
  searched: boolean
  error: string | null
}

interface UseRecommendationReturn extends RecommendationState {
  fetchRecommendations: (concerns: HealthConcernKey[]) => Promise<void>
  reset: () => void
}

export function useRecommendation(): UseRecommendationReturn {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async (concerns: HealthConcernKey[]) => {
    if (concerns.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concerns }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? '추천 조회에 실패했습니다.')
        setProducts([])
        setTotal(0)
      } else {
        setProducts(data.products ?? [])
        setTotal(data.total ?? 0)
      }
      setSearched(true)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setProducts([])
    setTotal(0)
    setSearched(false)
    setError(null)
  }

  return { products, total, loading, searched, error, fetchRecommendations, reset }
}
