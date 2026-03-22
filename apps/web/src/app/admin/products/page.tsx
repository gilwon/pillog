'use client'

import { useRef } from 'react'
import { ProductsTable } from '@/features/admin/components/ProductsTable'
import { SyncButton } from '@/features/admin/components/SyncButton'
import { SyncHistory } from '@/features/admin/components/SyncHistory'
import type { SyncButtonHandle } from '@/features/admin/components/SyncButton'

export default function AdminProductsPage() {
  const syncRef = useRef<SyncButtonHandle>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">제품 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            건강기능식품 제품을 등록, 수정, 관리합니다.
          </p>
        </div>
        <SyncButton ref={syncRef} />
      </div>

      <ProductsTable />
      <SyncHistory
        onResume={(logId, fromBatch, full) => syncRef.current?.resume(logId, fromBatch, full)}
        isSyncing={syncRef.current?.isLoading}
      />
    </div>
  )
}
