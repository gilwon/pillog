'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2, Minus, Plus as PlusIcon } from 'lucide-react'
import Link from 'next/link'
import type { UserSupplementsResponse } from '@/types/api'

async function fetchSupplements(): Promise<UserSupplementsResponse> {
  const res = await fetch('/api/my/supplements')
  if (!res.ok) throw new Error('Failed to fetch supplements')
  return res.json()
}

async function deleteSupplement(id: string) {
  const res = await fetch(`/api/my/supplements/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
  return res.json()
}

async function updateSupplement(id: string, daily_dose: number) {
  const res = await fetch(`/api/my/supplements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ daily_dose }),
  })
  if (!res.ok) throw new Error('Failed to update')
  return res.json()
}

export function SupplementManager() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['supplements'],
    queryFn: fetchSupplements,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, daily_dose }: { id: string; daily_dose: number }) =>
      updateSupplement(id, daily_dose),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">등록된 영양제가 없습니다.</p>
        <Link
          href="/products"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          제품 검색에서 등록하기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.data.map((supp) => (
        <div
          key={supp.id}
          className="flex items-center justify-between rounded-lg border border-border p-4"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/products/${supp.product.id}`}
              className="font-medium hover:text-primary"
            >
              {supp.product.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {supp.product.company}
              {supp.product.shape && ` / ${supp.product.shape}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dose control */}
            <div className="flex items-center gap-1 rounded-md border border-border">
              <button
                onClick={() =>
                  supp.daily_dose > 1 &&
                  updateMutation.mutate({
                    id: supp.id,
                    daily_dose: supp.daily_dose - 1,
                  })
                }
                disabled={supp.daily_dose <= 1}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {supp.daily_dose}
              </span>
              <button
                onClick={() =>
                  updateMutation.mutate({
                    id: supp.id,
                    daily_dose: supp.daily_dose + 1,
                  })
                }
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">회/일</span>

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm('이 영양제를 삭제하시겠습니까?')) {
                  deleteMutation.mutate(supp.id)
                }
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Link
        href="/dashboard"
        className="block rounded-lg bg-primary/5 p-3 text-center text-sm text-primary hover:bg-primary/10"
      >
        섭취량 대시보드 보기
      </Link>
    </div>
  )
}
