'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { DashboardNutrient } from '@/types/database'

const STATUS_COLORS = {
  safe: '#22c55e',
  caution: '#f59e0b',
  warning: '#ef4444',
}

interface NutrientChartProps {
  nutrients: DashboardNutrient[]
}

export function NutrientChart({ nutrients }: NutrientChartProps) {
  const chartData = nutrients
    .filter((n) => n.rdi_percentage != null)
    .map((n) => ({
      name: n.ingredient,
      rdi_pct: n.rdi_percentage,
      status: n.status,
      amount: `${n.total_amount}${n.unit}`,
    }))

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        RDI 대비 섭취량 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 font-semibold">1일 섭취량 vs 권장량 (RDI)</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={75}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'RDI 대비']}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.name === label)
                return `${label} (${item?.amount || ''})`
              }}
            />
            <ReferenceLine
              x={100}
              stroke="#22c55e"
              strokeDasharray="3 3"
              label={{ value: '100% RDI', position: 'top', fontSize: 11 }}
            />
            <Bar dataKey="rdi_pct" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-safe" />
          <span>안전 (0~150%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-caution" />
          <span>주의 (150~300%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-warning" />
          <span>경고 (UL 초과)</span>
        </div>
      </div>
    </div>
  )
}
