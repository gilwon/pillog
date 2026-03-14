'use client'

import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useIngredientExplain } from '@/features/ingredients/hooks/useIngredientExplain'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

interface IngredientExplainProps {
  productId: string
}

export function IngredientExplain({ productId }: IngredientExplainProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    explanation,
    streamingText,
    isLoading,
    isStreaming,
    error,
    fetchExplanation,
  } = useIngredientExplain(productId)

  const handleToggle = () => {
    if (!isOpen && !explanation && !isLoading) {
      fetchExplanation()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="mt-4">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
          isOpen
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
          isLoading && 'cursor-wait opacity-70'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isOpen ? '성분 설명 접기' : '성분 쉽게 보기'}
      </button>

      {/* Explanation Panel */}
      {isOpen && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Streaming state */}
          {isStreaming && !explanation && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>AI가 성분을 분석하고 있습니다...</span>
            </div>
          )}

          {/* Parsed explanation */}
          {explanation && (
            <div className="space-y-4">
              {/* Overall summary */}
              {explanation.overall && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">전체 요약</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {explanation.overall}
                  </p>
                </div>
              )}

              {/* Per-ingredient explanations */}
              {explanation.ingredients.length > 0 && (
                <div className="space-y-3">
                  {explanation.ingredients.map((item) => (
                    <div key={item.name}>
                      <h4 className="text-sm font-medium text-foreground">
                        {item.name}
                      </h4>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                AI가 생성한 정보로, 의학적 조언이 아닙니다. 정확한 정보는 전문가와
                상담하세요.
              </p>
            </div>
          )}

          {/* Loading initial state */}
          {isLoading && !isStreaming && !explanation && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
