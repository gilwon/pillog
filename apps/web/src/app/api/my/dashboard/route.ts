import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateNutrientStatus } from '@/features/dashboard/utils/calculate-nutrient-status'
import { evaluateInteractions } from '@/features/dashboard/utils/evaluate-interactions'
import { parseRawMaterials, parseAmount } from '@pillog/shared/parse-ingredients'
import type { DashboardResponse, DashboardNutrient, DashboardWarning } from '@/types/api'

export async function GET(request: Request) {
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

    // 날짜 파라미터 (선택적 — 지정 시 해당 날짜에 복용한 영양제만 계산)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // 유저 영양제 + nutrient_rdi 병렬 조회
    const [supplementsResult, rdiResult] = await Promise.all([
      supabase
        .from('user_supplements')
        .select(
          `
          daily_dose,
          product_id,
          product:products(
            name,
            raw_materials,
            standard,
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
        .eq('user_id', user.id),
      supabase
        .from('nutrient_rdi')
        .select('name, category, daily_rdi, daily_ul, rdi_unit, description')
        .limit(500),
    ])

    if (supplementsResult.error) throw supplementsResult.error

    // 날짜 지정 시 해당 날짜에 복용한 제품 ID만 필터
    let takenProductIds: Set<string> | null = null
    if (dateParam) {
      const { data: intakeLogs } = await supabase
        .from('intake_logs')
        .select('product_id')
        .eq('user_id', user.id)
        .eq('taken_date', dateParam)
        .eq('is_taken', true)

      takenProductIds = new Set((intakeLogs || []).map((l) => l.product_id))
    }

    const supplements = supplementsResult.data

    // nutrient_rdi 맵 구축
    const rdiMap = new Map<string, { category: string; daily_rdi: number | null; daily_ul: number | null; rdi_unit: string | null; description: string | null }>()
    for (const r of rdiResult.data || []) {
      rdiMap.set(r.name, r)
      // 띄어쓰기 없는 버전도 추가 (예: "비타민 D" → "비타민D")
      const noSpace = r.name.replace(/\s+/g, '')
      if (noSpace !== r.name) rdiMap.set(noSpace, r)
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

    for (const supp of (supplements || []) as Array<Record<string, unknown>>) {
      const product = supp.product as unknown as Record<string, unknown> | null
      if (!product) continue

      // 날짜 지정 시 해당 날짜에 복용한 제품만 포함
      if (takenProductIds && !takenProductIds.has(supp.product_id as string)) continue

      const dailyDose = Number(supp.daily_dose) || 1

      supplementList.push({
        product_name: product.name as string,
        daily_dose: dailyDose,
      })

      // 1단계: product_ingredients에서 연결된 성분 처리
      const productIngredients = (product.product_ingredients as Array<Record<string, unknown>>) || []
      const processedNames = new Set<string>()

      for (const pi of productIngredients) {
        const ing = pi.ingredient as unknown as Record<string, unknown> | null
        if (!ing) continue

        const name = ing.canonical_name as string
        processedNames.add(name.toLowerCase())

        const rdiRef = rdiMap.get(name)
        const rdi = (ing.daily_rdi as number) ?? rdiRef?.daily_rdi ?? null
        const ul = (ing.daily_ul as number) ?? rdiRef?.daily_ul ?? null
        const rdiUnit = (ing.rdi_unit as string) ?? rdiRef?.rdi_unit ?? null
        const category = (ing.category as string) || rdiRef?.category || '기타'
        const effect = (ing.primary_effect as string) ?? rdiRef?.description ?? null

        const amount = pi.amount != null ? Number(pi.amount) * dailyDose : 0
        if (amount === 0 && rdi == null) continue

        if (nutrientTotals.has(name)) {
          nutrientTotals.get(name)!.total_amount += amount
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

      // 2단계: raw_materials에서 직접 파싱하여 nutrient_rdi 매칭 (product_ingredients에 없는 성분)
      const rawMaterials = product.raw_materials as string | null
      const standard = product.standard as string | null
      if (rawMaterials) {
        const rawNames = parseRawMaterials(rawMaterials)
        for (const rawName of rawNames) {
          const lower = rawName.toLowerCase().trim()
          const noSpace = lower.replace(/\s+/g, '')
          if (processedNames.has(lower) || processedNames.has(noSpace)) continue

          // nutrient_rdi에서 매칭 시도
          const rdiRef = rdiMap.get(rawName) || rdiMap.get(rawName.replace(/\s+/g, ''))
          if (!rdiRef) continue

          processedNames.add(lower)

          // nutrient_rdi 맵에서 원래 이름 찾기
          let rdiName = rawName
          for (const [key, val] of rdiMap) {
            if (val === rdiRef) { rdiName = key; break }
          }

          // standard 필드에서 함량 추출 시도
          let amount = 0
          let amountUnit = rdiRef.rdi_unit || 'mg'
          if (standard) {
            const [parsedAmount, parsedUnit] = parseAmount(standard, rdiName)
            if (parsedAmount != null) {
              amount = parsedAmount * dailyDose
              amountUnit = parsedUnit || amountUnit
            }
          }

          // amount가 0이고 RDI 정보도 없으면 스킵
          if (amount === 0 && rdiRef.daily_rdi == null) continue

          if (nutrientTotals.has(rdiName)) {
            nutrientTotals.get(rdiName)!.total_amount += amount
          } else {
            nutrientTotals.set(rdiName, {
              category: rdiRef.category,
              total_amount: amount,
              unit: amountUnit,
              rdi: rdiRef.daily_rdi,
              ul: rdiRef.daily_ul,
              primary_effect: rdiRef.description,
            })
          }
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
