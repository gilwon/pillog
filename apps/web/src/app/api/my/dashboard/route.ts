import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateNutrientStatus } from '@/features/dashboard/utils/calculate-nutrient-status'
import { evaluateInteractions } from '@/features/dashboard/utils/evaluate-interactions'
import type { DashboardResponse, DashboardNutrient, DashboardWarning } from '@/types/api'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    // Fetch user supplements with product and ingredient details
    const { data: supplements, error } = await supabase
      .from('user_supplements')
      .select(
        `
        daily_dose,
        product:products(
          name,
          product_ingredients(
            amount,
            amount_unit,
            ingredient:ingredients(
              canonical_name,
              category,
              primary_effect,
              daily_rdi,
              daily_ul,
              rdi_unit
            )
          )
        )
      `
      )
      .eq('user_id', user.id)

    if (error) throw error

    // nutrient_rdi 테이블에서 RDI/UL 기준 데이터 로드 (ingredients.daily_rdi가 null인 경우 fallback)
    const { data: rdiRows } = await supabase
      .from('nutrient_rdi')
      .select('name, category, daily_rdi, daily_ul, rdi_unit, description')
      .limit(500)

    const rdiMap = new Map<string, { category: string; daily_rdi: number | null; daily_ul: number | null; rdi_unit: string | null; description: string | null }>()
    for (const r of rdiRows || []) {
      rdiMap.set(r.name, r)
    }

    // Calculate total nutrients
    const nutrientTotals = new Map<
      string,
      {
        category: string
        total_amount: number
        unit: string
        rdi: number | null
        ul: number | null
        primary_effect: string | null
      }
    >()

    const supplementList: { product_name: string; daily_dose: number }[] = []

    for (const supp of supplements || []) {
      const product = supp.product as unknown as Record<string, unknown> | null
      if (!product) continue

      supplementList.push({
        product_name: product.name as string,
        daily_dose: supp.daily_dose,
      })

      const productIngredients = (product.product_ingredients as Array<Record<string, unknown>>) || []
      for (const pi of productIngredients) {
        const ing = pi.ingredient as unknown as Record<string, unknown> | null
        if (!ing) continue

        const name = ing.canonical_name as string

        // ingredients 테이블의 RDI가 없으면 nutrient_rdi에서 조회
        const rdiRef = rdiMap.get(name)
        const rdi = (ing.daily_rdi as number) ?? rdiRef?.daily_rdi ?? null
        const ul = (ing.daily_ul as number) ?? rdiRef?.daily_ul ?? null
        const rdiUnit = (ing.rdi_unit as string) ?? rdiRef?.rdi_unit ?? null
        const category = (ing.category as string) || rdiRef?.category || '기타'
        const effect = (ing.primary_effect as string) ?? rdiRef?.description ?? null

        // amount가 없으면 RDI 계산 불가하지만, RDI 정보는 있으므로 0으로 기록
        const amount = pi.amount != null ? Number(pi.amount) * supp.daily_dose : 0

        // amount가 0이고 RDI 정보도 없으면 표시할 게 없으므로 스킵
        if (amount === 0 && rdi == null) continue

        if (nutrientTotals.has(name)) {
          const existing = nutrientTotals.get(name)!
          existing.total_amount += amount
        } else {
          nutrientTotals.set(name, {
            category,
            total_amount: amount,
            unit: (pi.amount_unit as string) || rdiUnit || 'mg',
            rdi,
            ul,
            primary_effect: effect,
          })
        }
      }
    }

    // Build response
    const totalNutrients: DashboardNutrient[] = []
    const warnings: DashboardWarning[] = []

    for (const [name, data] of nutrientTotals) {
      const rdiPercentage =
        data.rdi != null ? (data.total_amount / data.rdi) * 100 : null
      const ulPercentage =
        data.ul != null ? (data.total_amount / data.ul) * 100 : null
      const status = calculateNutrientStatus(rdiPercentage, ulPercentage)

      totalNutrients.push({
        ingredient: name,
        category: data.category,
        total_amount: data.total_amount,
        unit: data.unit,
        rdi: data.rdi,
        ul: data.ul,
        rdi_percentage: rdiPercentage != null ? Math.round(rdiPercentage) : null,
        ul_percentage: ulPercentage != null ? Math.round(ulPercentage) : null,
        status,
        primary_effect: data.primary_effect,
      })

      if (status === 'warning' && data.ul != null) {
        warnings.push({
          ingredient: name,
          message: `1일 상한 섭취량(UL)의 ${Math.round(ulPercentage!)}%를 초과합니다. 과잉 섭취에 주의하세요.`,
          severity: 'warning',
          rdi: data.rdi,
          unit: data.unit,
        })
      } else if (status === 'caution') {
        warnings.push({
          ingredient: name,
          message:
            ulPercentage != null && ulPercentage >= 70
              ? `1일 상한 섭취량(UL)의 ${Math.round(ulPercentage)}%입니다. 주의가 필요합니다.`
              : `1일 권장 섭취량(RDI)의 ${Math.round(rdiPercentage!)}%입니다.`,
          severity: 'caution',
          rdi: data.rdi,
          unit: data.unit,
        })
      } else if (status === 'safe' && data.rdi != null && rdiPercentage != null) {
        warnings.push({
          ingredient: name,
          message: `1일 권장 섭취량(RDI)의 ${Math.round(rdiPercentage)}%입니다.`,
          severity: 'info',
          rdi: data.rdi,
          unit: data.unit,
        })
      }
    }

    // Sort nutrients and warnings: warning → caution → safe/info
    const statusOrder = { warning: 0, caution: 1, safe: 2 }
    totalNutrients.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

    const severityOrder = { warning: 0, caution: 1, info: 2 }
    warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    // Evaluate nutrient interactions
    const nutrientNames = Array.from(nutrientTotals.keys())
    const interactions = evaluateInteractions(nutrientNames)

    const response: DashboardResponse = {
      supplements: supplementList,
      total_nutrients: totalNutrients,
      warnings,
      interactions,
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
