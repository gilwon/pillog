import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { escapeLike } from '@/lib/utils/escape-like'
import {
  HEALTH_CONCERN_MAP,
  HEALTH_CONCERNS,
} from '@/features/recommendation/constants/health-concerns'
import type { HealthConcernKey, RecommendedProduct } from '@/features/recommendation/types'

const VALID_KEYS = new Set<string>(HEALTH_CONCERNS.map((c) => c.key))

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const concerns: HealthConcernKey[] = body?.concerns

  if (!concerns || !Array.isArray(concerns) || concerns.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'concerns 배열이 필요합니다.', status: 400 } },
      { status: 400 }
    )
  }

  const validConcerns = concerns.filter((c) => VALID_KEYS.has(c))
  if (validConcerns.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '유효한 건강 고민 카테고리가 없습니다.', status: 400 } },
      { status: 400 }
    )
  }

  if (validConcerns.length > 3) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'concerns는 최대 3개까지 선택 가능합니다.', status: 400 } },
      { status: 400 }
    )
  }

  const keywords = validConcerns.flatMap((c) => HEALTH_CONCERN_MAP[c])

  const supabase = await createClient()
  // primary_functionality는 plain text 컬럼 → .or() ilike 안정적으로 지원
  const orFilter = keywords.map((k) => `primary_functionality.ilike.%${escapeLike(k)}%`).join(',')
  const { data, error } = await supabase
    .from('products')
    .select('id, name, company, functionality_tags, shape, primary_functionality, reported_at')
    .eq('is_active', true)
    .or(orFilter)

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '추천 쿼리 실패', status: 500 } },
      { status: 500 }
    )
  }

  const scored: RecommendedProduct[] = (data || [])
    .map((p) => {
      const tags = (p.functionality_tags as string[]) ?? []
      const primaryFunc = (p.primary_functionality as string) ?? ''

      // 1차: functionality_tags 부분 일치
      const matchedTags = tags.filter((tag) =>
        keywords.some((k) => tag.includes(k) || k.includes(tag))
      )
      // 2차: tags 미매칭 시 primary_functionality 기반 점수로 fallback
      const matchScore =
        matchedTags.length > 0
          ? matchedTags.length
          : keywords.filter((k) => primaryFunc.includes(k)).length

      return {
        id: p.id as string,
        name: p.name as string,
        company: p.company as string,
        functionality_tags: tags,
        shape: (p.shape as string) ?? null,
        reported_at: (p.reported_at as string) ?? null,
        matchedTags,
        matchScore,
      }
    })
    .filter((p) => p.matchScore > 0)
    // 최근 신고일 기준 정렬 (reported_at DESC), 동일한 경우 matchScore DESC
    .sort((a, b) => {
      const dateA = a.reported_at ? new Date(a.reported_at).getTime() : 0
      const dateB = b.reported_at ? new Date(b.reported_at).getTime() : 0
      if (dateB !== dateA) return dateB - dateA
      return b.matchScore - a.matchScore
    })

  const total = scored.length

  return NextResponse.json({ products: scored, total })
}
