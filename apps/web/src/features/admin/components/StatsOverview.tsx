import { Users, Package, FlaskConical, UserPlus } from 'lucide-react'
import { StatsCard } from './StatsCard'
import type { AdminStatsResponse } from '@/types/api'

interface Props {
  data: AdminStatsResponse
}

export function StatsOverview({ data }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="전체 사용자" value={data.total_users} icon={Users} />
      <StatsCard title="최근 30일 가입" value={data.recent_signups} icon={UserPlus} />
      <StatsCard
        title="제품 수"
        value={data.total_products}
        description={`활성: ${data.active_products.toLocaleString()}`}
        icon={Package}
        href="/admin/products"
      />
      <StatsCard title="성분 수" value={data.total_ingredients} icon={FlaskConical} href="/admin/ingredients" />
    </div>
  )
}
