'use client'

import { Sparkles } from 'lucide-react'
import { useMySupplements } from '@/features/my-supplements/hooks/useMySupplements'
import { ChatInterface } from './ChatInterface'
import { ChatSupplementPanel } from './ChatSupplementPanel'

export function ChatPageClient() {
  const { supplements } = useMySupplements()

  const isLoggedIn = !supplements.isLoading && !supplements.error
  const items = supplements.data?.data ?? []
  const showPanel = isLoggedIn && items.length > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI 영양 상담</h1>
          <p className="text-sm text-muted-foreground">
            {showPanel
              ? '내 영양제를 기반으로 맞춤 상담을 제공합니다'
              : '내 영양제를 기반으로 맞춤 상담을 받아보세요'}
          </p>
        </div>
      </div>

      {showPanel ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* 패널: 모바일=아래(order-2), 데스크탑=왼쪽(md:order-1) */}
          <div className="order-2 md:order-1 md:w-72 md:shrink-0">
            <ChatSupplementPanel items={items} />
          </div>
          {/* 채팅: 모바일=위(order-1), 데스크탑=오른쪽(md:order-2) */}
          <div className="order-1 min-w-0 flex-1 md:order-2">
            <ChatInterface />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <ChatInterface />
        </div>
      )}
    </div>
  )
}
