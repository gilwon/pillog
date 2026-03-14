'use client'

import { IngredientsTable } from '@/features/admin/components/IngredientsTable'
import { IngredientSyncButton } from '@/features/admin/components/IngredientSyncButton'

export default function AdminIngredientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">성분 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            성분 정보를 등록, 수정하고 별칭을 관리합니다.
          </p>
        </div>
        <IngredientSyncButton />
      </div>

      <IngredientsTable />
    </div>
  )
}
