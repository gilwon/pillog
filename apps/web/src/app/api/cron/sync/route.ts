import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { runIngredientSync } from '@/lib/admin/ingredient-sync'

export const maxDuration = 300

const C003_BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api'
const SERVICE_ID = 'C003'
const BATCH_SIZE = 1000

function parseFunctionalityTags(functionality: string): string[] {
  if (!functionality) return []

  const tags: string[] = []
  const text = functionality.replace(/\[.+?\]/g, '')
  const parts = text.split(/[①②③④⑤⑥⑦⑧⑨⑩;]/)

  for (const part of parts) {
    let cleaned = part.trim()
    if (!cleaned) continue
    cleaned = cleaned.replace(/에\s*도움을?\s*줄?\s*수\s*있[음습]/g, '')
    cleaned = cleaned.replace(/에\s*도움/g, '')
    cleaned = cleaned.trim()
    if (cleaned.length >= 2) tags.push(cleaned)
  }

  return tags.slice(0, 10)
}

function transformProduct(item: Record<string, string>) {
  const functionality = item.PRIMARY_FNCLTY || ''
  const tags = parseFunctionalityTags(functionality)

  let reportedAt: string | null = null
  const prmsDt = item.PRMS_DT || ''
  if (prmsDt.length >= 8) {
    const y = prmsDt.slice(0, 4)
    const m = prmsDt.slice(4, 6)
    const d = prmsDt.slice(6, 8)
    reportedAt = `${y}-${m}-${d}`
  }

  return {
    report_no: item.PRDLST_REPORT_NO || '',
    name: (item.PRDLST_NM || '').trim(),
    company: (item.BSSH_NM || '').trim(),
    primary_functionality: functionality,
    functionality_tags: tags,
    how_to_take: item.NTK_MTHD || null,
    caution: item.IFTKN_ATNT_MATR_CN || null,
    shape: item.PRDT_SHAP_CD_NM || item.DISPOS || null,
    standard: item.STDR_STND || null,
    shelf_life: item.POG_DAYCNT || null,
    storage_method: item.CSTDY_MTHD || null,
    raw_materials: item.RAWMTRL_NM || null,
    reported_at: reportedAt,
    synced_at: new Date().toISOString(),
    is_active: true,
    removed_from_api: false,
  }
}

async function fetchC003(
  start: number,
  end: number,
  changeDate: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.FOOD_SAFETY_API_KEY
  let url = `${C003_BASE_URL}/${apiKey}/${SERVICE_ID}/json/${start}/${end}`
  if (changeDate) url += `/CHNG_DT=${changeDate}`

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`C003 API error: ${res.status}`)

    const text = await res.text()

    if (text.trimStart().startsWith('<')) {
      const match = text.match(/alert\('([^']+)'\)/)
      const msg = match ? match[1] : '식약처 API 일시 오류'
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      throw new Error(msg)
    }

    return JSON.parse(text)
  }

  throw new Error('식약처 API 응답 실패 (3회 재시도 초과)')
}

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const apiKey = process.env.FOOD_SAFETY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'FOOD_SAFETY_API_KEY not configured' },
      { status: 500 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase credentials not configured' },
      { status: 500 }
    )
  }

  // 어제 날짜 기준 증분 동기화
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const changeDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '')

  try {
    // 총 건수 조회
    const initial = await fetchC003(1, 1, changeDate)
    const serviceData = (initial as Record<string, Record<string, string>>)[SERVICE_ID] || {}
    const total = parseInt(serviceData.total_count || '0', 10)

    if (total === 0) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 제품이 없습니다.',
        total: 0,
        upserted: 0,
      })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const totalBatches = Math.ceil(total / BATCH_SIZE)
    let totalUpserted = 0
    let failedBatches = 0
    const syncStart = new Date().toISOString()

    // sync_log 생성
    const { data: logRow } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'incremental',
        change_date: changeDate,
        started_at: syncStart,
      })
      .select('id')
      .single()
    const syncLogId: string | null = logRow?.id ?? null

    // 배치별 제품 동기화
    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const start = (batchNum - 1) * BATCH_SIZE + 1
      const end = Math.min(batchNum * BATCH_SIZE, total)

      try {
        const data = await fetchC003(start, end, changeDate)
        const rows = (
          (data as Record<string, Record<string, unknown[]>>)[SERVICE_ID]?.row || []
        ) as Record<string, string>[]

        const products = rows
          .filter((row) => row.PRDLST_REPORT_NO)
          .map(transformProduct)

        if (products.length > 0) {
          const { data: upserted, error } = await supabase
            .from('products')
            .upsert(products, { onConflict: 'report_no' })
            .select('id')

          if (error) {
            failedBatches++
          } else {
            totalUpserted += upserted?.length ?? 0
          }
        }
      } catch {
        failedBatches++
      }

      if (batchNum < totalBatches) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    // sync_log 업데이트
    if (syncLogId) {
      try {
        const { data: touched } = await supabase
          .from('products')
          .select('id, created_at')
          .gte('synced_at', syncStart)

        const logProducts = (touched ?? []).map((p: { id: string; created_at: string }) => ({
          sync_log_id: syncLogId,
          product_id: p.id,
          change_type: p.created_at >= syncStart ? 'new' : 'updated',
        }))

        for (let i = 0; i < logProducts.length; i += 500) {
          await supabase.from('sync_log_products').insert(logProducts.slice(i, i + 500))
        }

        await supabase
          .from('sync_logs')
          .update({
            status: failedBatches > 0 && totalUpserted === 0 ? 'failed' : 'completed',
            total_fetched: total,
            new_count: logProducts.filter((p: { change_type: string }) => p.change_type === 'new').length,
            updated_count: logProducts.filter((p: { change_type: string }) => p.change_type === 'updated').length,
            deactivated_count: 0,
            failed_batches: failedBatches,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId)
      } catch {
        // 로그 저장 실패는 동기화 결과에 영향 없음
      }
    }

    // 성분 연결 자동 실행
    let ingredientResult = { totalLinked: 0, matchedProducts: 0, total: 0 }
    try {
      const noop = () => {}
      ingredientResult = await runIngredientSync(supabase, noop, {
        start: 'start',
        progress: 'progress',
        done: 'done',
        error: 'error',
      })
    } catch {
      // 성분 연결 실패는 제품 동기화 결과에 영향 없음
    }

    return NextResponse.json({
      success: true,
      products: {
        total,
        upserted: totalUpserted,
        failedBatches,
      },
      ingredients: {
        linked: ingredientResult.totalLinked,
        matchedProducts: ingredientResult.matchedProducts,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: `동기화 실패: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
