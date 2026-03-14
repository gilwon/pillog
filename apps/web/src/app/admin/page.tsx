import { requireAdmin } from '@/lib/admin'
import { StatsOverview } from '@/features/admin/components/StatsOverview'
import { PopularProducts } from '@/features/admin/components/PopularProducts'
import type { AdminStatsResponse } from '@/types/api'

async function fetchStats(): Promise<AdminStatsResponse> {
  const { supabase } = await requireAdmin()

  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: activeProducts },
    { count: totalIngredients },
    { count: recentSignups },
    { data: popularProducts },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ingredients').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.rpc('get_popular_products', { limit_count: 10 }),
  ])

  return {
    total_users: totalUsers ?? 0,
    total_products: totalProducts ?? 0,
    active_products: activeProducts ?? 0,
    total_ingredients: totalIngredients ?? 0,
    recent_signups: recentSignups ?? 0,
    popular_products: (popularProducts || []).map((p: { id: string; name: string; company: string; user_count: number }) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      user_count: p.user_count,
    })),
  }
}

export default async function AdminDashboardPage() {
  const stats = await fetchStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          서비스 운영 현황을 한눈에 확인하세요.
        </p>
      </div>

      <StatsOverview data={stats} />
      <PopularProducts data={stats.popular_products} />
    </div>
  )
}
