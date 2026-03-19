'use client'

import { IngredientsTable } from '@/features/admin/components/IngredientsTable'

export default function AdminIngredientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">성분 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          성분 정보를 등록, 수정하고 별칭을 관리합니다. 제품-성분 연결은 식약처 동기화 시 자동 실행됩니다.
        </p>
      </div>

      <IngredientsTable />
    </div>
  )
}
