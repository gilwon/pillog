import { useState, useCallback } from 'react'
import type { ProductExplanationData } from '@/types/database'

interface UseIngredientExplainResult {
  explanation: ProductExplanationData | null
  streamingText: string
  isLoading: boolean
  isStreaming: boolean
  isCached: boolean
  error: string | null
  fetchExplanation: () => void
}

export function useIngredientExplain(
  productId: string
): UseIngredientExplainResult {
  const [explanation, setExplanation] = useState<ProductExplanationData | null>(
    null
  )
  const [streamingText, setStreamingText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isCached, setIsCached] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExplanation = useCallback(async () => {
    if (isLoading || explanation) return

    setIsLoading(true)
    setError(null)
    setStreamingText('')

    try {
      const res = await fetch(`/api/products/${productId}/explain`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || '설명을 불러올 수 없습니다.')
      }

      const contentType = res.headers.get('Content-Type') || ''

      // Cached JSON response
      if (contentType.includes('application/json')) {
        const data = await res.json()
        setExplanation(data.explanation)
        setIsCached(true)
        setIsLoading(false)
        return
      }

      // Streaming text response
      setIsStreaming(true)
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) throw new Error('Stream unavailable')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setStreamingText(accumulated)
      }

      // Try to parse the completed JSON (strip markdown code fences if present)
      try {
        const jsonText = accumulated.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
        const parsed: ProductExplanationData = JSON.parse(jsonText)
        setExplanation(parsed)
      } catch {
        setError('AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '설명을 불러올 수 없습니다.'
      )
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [productId, isLoading, explanation])

  return {
    explanation,
    streamingText,
    isLoading,
    isStreaming,
    isCached,
    error,
    fetchExplanation,
  }
}
