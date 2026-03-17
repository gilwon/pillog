import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'

export const maxDuration = 300 // 5분 (Vercel Pro 필요, 기본 60초)

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
  // NOTE: API key is embedded in URL path per MFDS API spec.
  // Ensure no request URL logging is enabled to prevent key exposure (SEC-009).
  let url = `${C003_BASE_URL}/${apiKey}/${SERVICE_ID}/json/${start}/${end}`
  if (changeDate) url += `/CHNG_DT=${changeDate}`

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`C003 API 오류: ${res.status}`) // URL deliberately excluded from error message

    const text = await res.text()

    // 식약처 API는 오류 시 HTTP 200 + HTML을 반환함
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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (err) {
    return err as NextResponse
  }

  const apiKey = process.env.FOOD_SAFETY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'FOOD_SAFETY_API_KEY가 설정되지 않았습니다.', status: 500 } }, { status: 500 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase 서비스 키가 설정되지 않았습니다.', status: 500 } }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const full = body.full === true
  const since = body.since as string | undefined

  let changeDate = ''
  if (since) {
    changeDate = since.replace(/-/g, '')
  } else if (!full) {
    const now = new Date()
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
    changeDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '')
  }

  // 총 건수 조회 (실패 시 스트림 시작 전에 에러 반환)
  let total = 0
  try {
    const initial = await fetchC003(1, 1, changeDate)
    const serviceData = (initial as Record<string, Record<string, string>>)[SERVICE_ID] || {}
    total = parseInt(serviceData.total_count || '0', 10)
  } catch (err) {
    return NextResponse.json(
      { error: `식약처 API 연결 실패: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    )
  }

  const totalBatches = Math.ceil(total / BATCH_SIZE)
  const encoder = new TextEncoder()
  const send = (obj: object) => encoder.encode(JSON.stringify(obj) + '\n')

  const stream = new ReadableStream({
    async start(controller) {
      if (total === 0) {
        controller.enqueue(send({ type: 'done', count: 0, total: 0, failedBatches: 0, message: '업데이트할 제품이 없습니다.' }))
        controller.close()
        return
      }

      controller.enqueue(send({ type: 'start', total, totalBatches }))

      const supabase = createSupabaseClient(supabaseUrl!, serviceRoleKey!)
      let totalUpserted = 0
      let failedBatches = 0
      const syncStart = new Date().toISOString()

      // sync_log 생성 (service role supabase 사용)
      const { data: logRow } = await supabase
        .from('sync_logs')
        .insert({
          sync_type: full ? 'full' : 'incremental',
          change_date: changeDate || null,
          started_at: syncStart,
        })
        .select('id')
        .single()
      const syncLogId: string | null = logRow?.id ?? null

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
              controller.enqueue(send({
                type: 'error',
                batch: batchNum,
                totalBatches,
                message: `배치 ${batchNum} upsert 실패: ${error.message}`,
              }))
            } else {
              totalUpserted += upserted?.length ?? 0
            }
          }
        } catch (err) {
          failedBatches++
          const msg = err instanceof Error ? err.message : String(err)
          controller.enqueue(send({
            type: 'error',
            batch: batchNum,
            totalBatches,
            message: `배치 ${batchNum} 실패: ${msg}`,
          }))
        }

        controller.enqueue(send({
          type: 'progress',
          batch: batchNum,
          totalBatches,
          upserted: totalUpserted,
          total,
        }))

        if (batchNum < totalBatches) {
          await new Promise((r) => setTimeout(r, 300))
        }
      }

      let deactivatedCount = 0
      if (full && failedBatches === 0) {
        // 전체 동기화 후 API에 없는 제품 → soft delete (사용자 데이터 CASCADE 보호)
        const { data: deactivatedRows } = await supabase
          .from('products')
          .update({ is_active: false, removed_from_api: true })
          .lt('synced_at', syncStart)
          .eq('removed_from_api', false) // 이미 처리된 항목 재처리 방지
          .select('id')
        deactivatedCount = deactivatedRows?.length ?? 0
        if (deactivatedCount > 0) {
          controller.enqueue(send({ type: 'deactivate', deactivated: deactivatedCount }))
        }

        // deactivated 제품 로그 기록
        if (syncLogId && deactivatedRows && deactivatedRows.length > 0) {
          try {
            for (let i = 0; i < deactivatedRows.length; i += 500) {
              await supabase.from('sync_log_products').insert(
                deactivatedRows.slice(i, i + 500).map((p: { id: string }) => ({
                  sync_log_id: syncLogId,
                  product_id: p.id,
                  change_type: 'deactivated',
                }))
              )
            }
          } catch {
            // 로그 저장 실패는 무시
          }
        }
      }

      // 동기화된 제품 기록
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
              status: failedBatches > 0
                ? totalUpserted === 0 ? 'failed' : 'partial'
                : 'completed',
              total_fetched: total,
              new_count: logProducts.filter((p: { change_type: string }) => p.change_type === 'new').length,
              updated_count: logProducts.filter((p: { change_type: string }) => p.change_type === 'updated').length,
              deactivated_count: deactivatedCount,
              failed_batches: failedBatches,
              completed_at: new Date().toISOString(),
            })
            .eq('id', syncLogId)
        } catch {
          // 로그 저장 실패는 동기화 결과에 영향 없음
        }
      }

      controller.enqueue(send({
        type: 'done',
        count: totalUpserted,
        total,
        failedBatches,
        deactivated: deactivatedCount,
        message: failedBatches > 0
          ? `${totalUpserted.toLocaleString()}개 업데이트 (${failedBatches}개 배치 실패)`
          : deactivatedCount > 0
            ? `${totalUpserted.toLocaleString()}개 업데이트, ${deactivatedCount.toLocaleString()}개 API 제거 처리되었습니다.`
            : `${totalUpserted.toLocaleString()}개 제품이 업데이트되었습니다.`,
      }))

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
