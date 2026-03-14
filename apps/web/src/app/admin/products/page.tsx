'use client'

import { ProductsTable } from '@/features/admin/components/ProductsTable'
import { SyncButton } from '@/features/admin/components/SyncButton'
import { SyncHistory } from '@/features/admin/components/SyncHistory'

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">제품 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            건강기능식품 제품을 등록, 수정, 관리합니다.
          </p>
        </div>
        <SyncButton />
      </div>

      <ProductsTable />
      <SyncHistory />
    </div>
  )
}
