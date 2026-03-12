'use client'

import { SupplementManager } from '@/features/my-supplements/components/SupplementManager'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Heart, Pill } from 'lucide-react'
import Link from 'next/link'
import type { UserFavoritesResponse } from '@/types/api'

async function fetchFavorites(): Promise<UserFavoritesResponse> {
  const res = await fetch('/api/my/favorites')
  if (!res.ok) throw new Error('Failed to fetch favorites')
  return res.json()
}

export default function MyPage() {
  const {
    data: favorites,
    isLoading: favoritesLoading,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">내 영양제 관리</h1>

      {/* Supplement Manager */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">복용 중인 영양제</h2>
        </div>
        <SupplementManager />
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
            {favorites.data.map((fav) => (
              <Link
                key={fav.id}
                href={`/products/${fav.product.id}`}
                className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <p className="font-medium">{fav.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {fav.product.company}
                </p>
              </Link>
            ))}
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
