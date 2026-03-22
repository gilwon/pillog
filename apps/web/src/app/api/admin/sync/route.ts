import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'
import { runIngredientSync, applyNutrientRdi } from '@/lib/admin/ingredient-sync'

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
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '관리자 권한이 필요합니다.', status: 401 } },
      { status: 401 }
    )
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
  // 이어하기 파라미터
  const resumeLogId = body.resumeLogId as string | undefined
  const resumeFromBatch = body.resumeFromBatch as number | undefined

  const adminSupabase = createSupabaseClient(supabaseUrl!, serviceRoleKey!)

  // 이어하기가 아닌 경우: 중복 실행 방지
  if (!resumeLogId) {
    const { data: runningLog } = await adminSupabase
      .from('sync_logs')
      .select('id, sync_type, started_at')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (runningLog) {
      return NextResponse.json(
        { error: { code: 'SYNC_IN_PROGRESS', message: '이미 동기화가 진행 중입니다.', syncLogId: runningLog.id } },
        { status: 409 }
      )
    }
  }

  let changeDate = ''
  if (since) {
    changeDate = since.replace(/-/g, '')
  } else if (!full) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
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
  const startBatch = resumeFromBatch && resumeFromBatch > 0 ? resumeFromBatch : 1
  const encoder = new TextEncoder()
  const send = (obj: object) => encoder.encode(JSON.stringify(obj) + '\n')

  const stream = new ReadableStream({
    async start(controller) {
      if (total === 0) {
        controller.enqueue(send({ type: 'done', count: 0, total: 0, failedBatches: 0, message: '업데이트할 제품이 없습니다.' }))
        controller.close()
        return
      }

      const supabase = createSupabaseClient(supabaseUrl!, serviceRoleKey!)
      let totalUpserted = 0
      let failedBatches = 0

      // 이어하기: 기존 sync_log 재사용 / 신규: 새로 생성
      let syncLogId: string | null = null
      let syncStart: string

      if (resumeLogId) {
        syncLogId = resumeLogId
        // 기존 sync_log의 started_at 조회
        const { data: existingLog } = await supabase
          .from('sync_logs')
          .select('started_at, new_count, failed_batches')
          .eq('id', resumeLogId)
          .single()
        syncStart = existingLog?.started_at ?? new Date().toISOString()
        totalUpserted = existingLog?.new_count ?? 0
        failedBatches = existingLog?.failed_batches ?? 0
      } else {
        syncStart = new Date().toISOString()
        const { data: logRow } = await supabase
          .from('sync_logs')
          .insert({
            sync_type: full ? 'full' : 'incremental',
            change_date: changeDate || null,
            started_at: syncStart,
          })
          .select('id')
          .single()
        syncLogId = logRow?.id ?? null
      }

      controller.enqueue(send({
        type: 'start',
        total,
        totalBatches,
        syncLogId,
        resumedFrom: startBatch > 1 ? startBatch : undefined,
      }))

      const PROGRESS_UPDATE_INTERVAL = 3

      for (let batchNum = startBatch; batchNum <= totalBatches; batchNum++) {
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
            const { error } = await supabase
              .from('products')
              .upsert(products, { onConflict: 'report_no', count: 'exact' })

            if (error) {
              failedBatches++
            } else {
              totalUpserted += products.length
            }
          }
        } catch {
          failedBatches++
        }

        controller.enqueue(send({
          type: 'progress',
          batch: batchNum,
          totalBatches,
          upserted: totalUpserted,
          total,
          syncLogId,
        }))

        // sync_logs에 중간 진행상황 업데이트
        if (syncLogId && (batchNum % PROGRESS_UPDATE_INTERVAL === 0 || batchNum === totalBatches)) {
          supabase
            .from('sync_logs')
            .update({
              total_fetched: total,
              new_count: totalUpserted,
              updated_count: 0,
              failed_batches: failedBatches,
              progress_batch: batchNum,
              progress_total_batches: totalBatches,
            })
            .eq('id', syncLogId)
            .then(() => {}) // fire-and-forget
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

      // 동기화된 제품 카운트 (신규 vs 업데이트)
      if (syncLogId) {
        try {
          // 카운트만 조회 (전체 행을 가져오지 않음 — Supabase 1000행 limit 회피)
          const [{ count: newCount }, { count: updatedCount }] = await Promise.all([
            supabase
              .from('products')
              .select('id', { count: 'exact', head: true })
              .gte('synced_at', syncStart)
              .gte('created_at', syncStart),
            supabase
              .from('products')
              .select('id', { count: 'exact', head: true })
              .gte('synced_at', syncStart)
              .lt('created_at', syncStart),
          ])

          await supabase
            .from('sync_logs')
            .update({
              status: failedBatches > 0 && totalUpserted === 0 ? 'failed' : 'completed',
              total_fetched: total,
              new_count: newCount ?? 0,
              updated_count: updatedCount ?? 0,
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

      // ─── 성분 연결: 증분 동기화에서만 실행 (전체 동기화는 제품 수가 많아 타임아웃) ──
      if (!full) {
        controller.enqueue(send({ type: 'ingredient-sync-start' }))

        try {
          const writer = (msg: object) => controller.enqueue(send(msg))

          await runIngredientSync(supabase, writer, {
            start: 'ingredient-start',
            progress: 'ingredient-progress',
            done: 'ingredient-done',
            error: 'ingredient-error',
          }, syncStart)
        } catch (err) {
          controller.enqueue(
            send({
              type: 'ingredient-error',
              message: err instanceof Error ? err.message : '성분 연결 중 오류 발생',
            })
          )
        }

        // RDI/UL 데이터 복사 (nutrient_rdi → ingredients)
        try {
          const rdiCount = await applyNutrientRdi(supabase)
          if (rdiCount > 0) {
            controller.enqueue(send({ type: 'rdi-applied', count: rdiCount }))
          }
        } catch {
          // RDI 복사 실패는 동기화에 영향 없음
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
