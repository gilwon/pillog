'use client'

import { SupplementManager } from '@/features/my-supplements/components/SupplementManager'
import { IntakeCalendar } from '@/features/my-supplements/components/IntakeCalendar'
import { useMySupplements } from '@/features/my-supplements/hooks/useMySupplements'
import { ShareDialog } from '@/features/share/components/ShareDialog'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Heart, Pill, BarChart3, CalendarDays, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import type { UserFavoritesResponse } from '@/types/api'

async function fetchFavorites(): Promise<UserFavoritesResponse> {
  const res = await fetch('/api/my/favorites')
  if (!res.ok) throw new Error('Failed to fetch favorites')
  return res.json()
}

export default function MyPage() {
  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  })
  const { supplements, addSupplement } = useMySupplements()
  const supplementProductIds = new Set(
    supplements.data?.data.map((s) => s.product.id) ?? []
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">내 영양제 관리</h1>

      {/* Dashboard shortcut */}
      <section className="mb-10">
        <Link
          href="/dashboard"
          className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5 transition-colors hover:bg-primary/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-primary">영양소 대시보드</h2>
            <p className="text-sm text-muted-foreground">
              오늘 복용 체크 + 영양소 섭취량 분석
            </p>
          </div>
        </Link>
      </section>

      {/* Supplement Manager */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">복용 중인 영양제</h2>
          </div>
          <ShareDialog type="supplements" />
        </div>
        <SupplementManager />
      </section>

      {/* Intake calendar */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">복용 이력</h2>
        </div>
        <IntakeCalendar />
      </section>

      {/* Favorites */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-destructive" />
          <h2 className="text-xl font-semibold">즐겨찾기</h2>
        </div>

        {favoritesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : favorites && favorites.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {favorites.data.map((fav) => {
              const alreadyAdded = supplementProductIds.has(fav.product.id)
              const isPending =
                addSupplement.isPending &&
                addSupplement.variables?.product_id === fav.product.id
              return (
                <div
                  key={fav.id}
                  className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <Link href={`/products/${fav.product.id}`} className="block">
                    <p className="font-medium">{fav.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {fav.product.company}
                    </p>
                  </Link>
                  <button
                    onClick={() =>
                      addSupplement.mutate({
                        product_id: fav.product.id,
                        daily_dose: 1,
                      })
                    }
                    disabled={alreadyAdded || isPending}
                    className="mt-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-default disabled:opacity-60"
                  >
                    {alreadyAdded ? (
                      <>
                        <Check className="h-3 w-3" />
                        등록됨
                      </>
                    ) : isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        추가 중...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        내 영양제에 추가
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            즐겨찾기한 제품이 없습니다.
          </p>
        )}
      </section>
    </div>
  )
}
