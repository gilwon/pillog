import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { AdminStatsResponse } from '@/types/api'

export async function GET() {
  try {
    const { supabase } = await requireAdmin()

    // 병렬로 통계 쿼리 실행
    const [
      { count: totalUsers },
      { count: totalProducts },
      { count: activeProducts },
      { count: totalIngredients },
      { count: recentSignups },
      { data: popularProducts },
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('ingredients')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.rpc('get_popular_products', { limit_count: 10 }),
    ])

    const topProducts = (popularProducts || []).map((p: { id: string; name: string; company: string; user_count: number }) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      user_count: p.user_count,
    }))

    const response: AdminStatsResponse = {
      total_users: totalUsers ?? 0,
      total_products: totalProducts ?? 0,
      active_products: activeProducts ?? 0,
      total_ingredients: totalIngredients ?? 0,
      recent_signups: recentSignups ?? 0,
      popular_products: topProducts,
    }

    return NextResponse.json(response)
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
