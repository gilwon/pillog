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
  safe: '#2a9d8f',
  caution: '#e9a030',
  warning: '#e63946',
}

interface NutrientChartProps {
  nutrients: DashboardNutrient[]
}

const formatNumber = (num: number) =>
  Math.round(num).toLocaleString('ko-KR')

export function NutrientChart({ nutrients }: NutrientChartProps) {
  const chartData = nutrients
    .filter((n) => n.rdi_percentage != null)
    .map((n) => ({
      name: n.ingredient,
      rdi_pct: n.rdi_percentage,
      status: n.status,
      amount: `${formatNumber(n.total_amount)}${n.unit}`,
      rdi: n.rdi != null ? `${formatNumber(n.rdi)}${n.unit}` : null,
      primary_effect: n.primary_effect,
    }))

  const effectList = nutrients.filter((n) => n.primary_effect)

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        RDI 대비 섭취량 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <h2 className="mb-4 font-semibold">1일 섭취량 vs 권장량 (RDI)</h2>
      <div className="h-[400px] overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tickFormatter={(v) => `${v}%`}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={55}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'RDI 대비']}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.name === label)
                const rdiInfo = item?.rdi ? ` / 권장: ${item.rdi}` : ''
                return `${label} (섭취: ${item?.amount || ''}${rdiInfo})`
              }}
              wrapperStyle={{ zIndex: 10, maxWidth: '90vw' }}
              contentStyle={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            />
            <ReferenceLine
              x={100}
              stroke="#2a9d8f"
              strokeDasharray="3 3"
              label={{ value: '100% RDI', position: 'top', fontSize: 10 }}
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
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
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

      {/* Ingredient descriptions */}
      {effectList.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">성분 설명</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {effectList.map((n) => (
              <div key={n.ingredient} className="flex gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
                <span className="shrink-0 font-medium text-foreground">{n.ingredient}</span>
                <span className="text-muted-foreground">{n.primary_effect}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
