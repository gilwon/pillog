import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'
import { parseRawMaterials, parseAmount } from '@pillog/shared/parse-ingredients'

export const maxDuration = 300

const BATCH_SIZE = 500

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (err) {
    return err as NextResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: { code: 'CONFIG_ERROR', message: 'Supabase 서비스 키가 설정되지 않았습니다.', status: 500 } },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const mode: 'extract' | 'match' = body.mode === 'match' ? 'match' : 'extract'

  const encoder = new TextEncoder()
  const send = (obj: object) => encoder.encode(JSON.stringify(obj) + '\n')
  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (mode === 'extract') {
          // ─── 미매칭 성분 추출 ───────────────────────────────────────────

          // 1. 기존 알려진 성분명 + 별칭 로드
          const knownNames = new Set<string>()
          const { data: ingredients } = await supabase
            .from('ingredients')
            .select('canonical_name')
            .limit(10000)
          const { data: aliases } = await supabase
            .from('ingredient_aliases')
            .select('alias_name')
            .limit(100000)
          for (const i of ingredients ?? []) knownNames.add(i.canonical_name.toLowerCase().trim())
          for (const a of aliases ?? []) knownNames.add(a.alias_name.toLowerCase().trim())

          // 2. 전체 제품 수 조회
          const { count: totalCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .not('raw_materials', 'is', null)
          const total = totalCount ?? 0
          const totalBatches = Math.ceil(total / BATCH_SIZE) || 1

          controller.enqueue(send({ type: 'start', total, totalBatches, mode }))

          // 3. 배치로 스캔 → 미매칭 후보 수집 (제품 ID도 추적)
          const candidates = new Map<string, number>() // name → 등장 횟수
          const candidateProducts = new Map<string, Set<string>>() // name → product_id set
          const productStandards = new Map<string, string>() // product_id → standard
          for (let batch = 1; batch <= totalBatches; batch++) {
            const offset = (batch - 1) * BATCH_SIZE
            const { data: products } = await supabase
              .from('products')
              .select('id, raw_materials, standard')
              .not('raw_materials', 'is', null)
              .range(offset, offset + BATCH_SIZE - 1)

            for (const p of products ?? []) {
              for (const name of parseRawMaterials(p.raw_materials ?? '')) {
                const lower = name.toLowerCase()
                if (!knownNames.has(lower)) {
                  const existing = candidates.get(lower)
                  candidates.set(lower, (existing ?? 0) + 1)
                  if (!candidateProducts.has(lower)) {
                    candidateProducts.set(lower, new Set())
                  }
                  candidateProducts.get(lower)!.add(p.id)
                  if (p.standard) {
                    productStandards.set(p.id, p.standard)
                  }
                }
              }
            }

            controller.enqueue(
              send({ type: 'progress', batch, totalBatches, found: candidates.size, total })
            )
          }

          // 4. 등장 횟수 순 정렬 후 DB 삽입
          const newIngredients = Array.from(candidates.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => ({
              canonical_name: name,
              category: '미분류',
              source_info: '제품 원재료 자동 추출',
            }))

          let inserted = 0
          const INSERT_BATCH = 100
          for (let i = 0; i < newIngredients.length; i += INSERT_BATCH) {
            const chunk = newIngredients.slice(i, i + INSERT_BATCH)
            const { data } = await supabase
              .from('ingredients')
              .upsert(chunk, { onConflict: 'canonical_name', ignoreDuplicates: true })
              .select('id')
            inserted += data?.length ?? 0
          }

          controller.enqueue(
            send({
              type: 'extract_done',
              count: inserted,
              candidates: candidates.size,
              message: `${inserted.toLocaleString()}개 신규 성분 추가 (후보 ${candidates.size.toLocaleString()}개 발견)`,
            })
          )

          // 5. 신규 삽입된 성분에 대해 product_ingredients 자동 연결
          // 삽입된 성분의 canonical_name → id 매핑 조회
          const insertedNames = newIngredients.map((i) => i.canonical_name)
          const nameToId = new Map<string, string>()

          for (let i = 0; i < insertedNames.length; i += INSERT_BATCH) {
            const chunk = insertedNames.slice(i, i + INSERT_BATCH)
            const { data: rows } = await supabase
              .from('ingredients')
              .select('id, canonical_name')
              .in('canonical_name', chunk)
            for (const r of rows ?? []) {
              nameToId.set(r.canonical_name.toLowerCase().trim(), r.id)
            }
          }

          controller.enqueue(
            send({ type: 'link_start', ingredientCount: nameToId.size })
          )

          // product_ingredients 레코드 생성
          let totalLinked = 0
          const piRows: Array<{
            product_id: string
            ingredient_id: string
            amount: number | null
            amount_unit: string | null
            is_functional: boolean
          }> = []

          for (const [name, productIds] of candidateProducts) {
            const ingredientId = nameToId.get(name)
            if (!ingredientId) continue

            for (const productId of productIds) {
              const standard = productStandards.get(productId) ?? ''
              const [amount, amount_unit] = parseAmount(standard, name)
              piRows.push({
                product_id: productId,
                ingredient_id: ingredientId,
                amount,
                amount_unit,
                is_functional: false,
              })
            }
          }

          // 배치 upsert
          const LINK_BATCH = 500
          for (let i = 0; i < piRows.length; i += LINK_BATCH) {
            const chunk = piRows.slice(i, i + LINK_BATCH)
            const { data: upserted } = await supabase
              .from('product_ingredients')
              .upsert(chunk, { onConflict: 'product_id,ingredient_id' })
              .select('id')
            totalLinked += upserted?.length ?? 0

            controller.enqueue(
              send({
                type: 'link_progress',
                linked: totalLinked,
                totalRows: piRows.length,
              })
            )
          }

          controller.enqueue(
            send({
              type: 'done',
              mode,
              count: inserted,
              candidates: candidates.size,
              linked: totalLinked,
              message: `${inserted.toLocaleString()}개 신규 성분 추가, ${totalLinked.toLocaleString()}개 제품-성분 연결 완료`,
            })
          )
        } else {
          // ─── 제품-성분 연결 ─────────────────────────────────────────────

          // 1. 별칭 맵 구축
          const aliasMap = new Map<string, { id: string; canonical_name: string }>()
          const { data: ingredients } = await supabase
            .from('ingredients')
            .select('id, canonical_name')
            .limit(10000)
          const { data: aliases } = await supabase
            .from('ingredient_aliases')
            .select('alias_name, ingredient_id')
            .limit(100000)

          const idToName = new Map<string, string>()
          for (const i of ingredients ?? []) {
            idToName.set(i.id, i.canonical_name)
            aliasMap.set(i.canonical_name.toLowerCase().trim(), {
              id: i.id,
              canonical_name: i.canonical_name,
            })
          }
          for (const a of aliases ?? []) {
            const canonical_name = idToName.get(a.ingredient_id) ?? ''
            aliasMap.set(a.alias_name.toLowerCase().trim(), {
              id: a.ingredient_id,
              canonical_name,
            })
          }

          // 2. 전체 제품 배치 처리
          const { count: totalCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
          const total = totalCount ?? 0
          const totalBatches = Math.ceil(total / BATCH_SIZE) || 1

          controller.enqueue(send({ type: 'start', total, totalBatches, mode }))

          let totalLinked = 0
          let matchedProducts = 0

          for (let batch = 1; batch <= totalBatches; batch++) {
            const offset = (batch - 1) * BATCH_SIZE
            const { data: products } = await supabase
              .from('products')
              .select('id, raw_materials, standard')
              .range(offset, offset + BATCH_SIZE - 1)

            const piRows: Array<{
              product_id: string
              ingredient_id: string
              amount: number | null
              amount_unit: string | null
              is_functional: boolean
            }> = []

            for (const p of products ?? []) {
              const names = parseRawMaterials(p.raw_materials ?? '')
              const seenIds = new Set<string>()

              for (const name of names) {
                const lower = name.toLowerCase()
                let ing = aliasMap.get(lower)

                // 부분 매칭 fallback
                if (!ing) {
                  for (const [alias, candidate] of aliasMap) {
                    if (
                      alias.length >= 3 &&
                      (alias.includes(lower) || (lower.length >= 3 && lower.includes(alias)))
                    ) {
                      ing = candidate
                      break
                    }
                  }
                }

                if (!ing || seenIds.has(ing.id)) continue
                seenIds.add(ing.id)

                const [amount, amount_unit] = parseAmount(p.standard ?? '', ing.canonical_name)
                piRows.push({
                  product_id: p.id,
                  ingredient_id: ing.id,
                  amount,
                  amount_unit,
                  is_functional: false,
                })
              }

              if (seenIds.size > 0) matchedProducts++
            }

            if (piRows.length > 0) {
              const { data: upserted } = await supabase
                .from('product_ingredients')
                .upsert(piRows, { onConflict: 'product_id,ingredient_id' })
                .select('id')
              totalLinked += upserted?.length ?? 0
            }

            controller.enqueue(
              send({ type: 'progress', batch, totalBatches, linked: totalLinked, total })
            )
          }

          controller.enqueue(
            send({
              type: 'done',
              mode,
              count: totalLinked,
              matchedProducts,
              total,
              message: `${matchedProducts.toLocaleString()}개 제품 / ${totalLinked.toLocaleString()}개 성분 연결 완료`,
            })
          )
        }
      } catch (err) {
        controller.enqueue(
          send({ type: 'error', message: err instanceof Error ? err.message : '서버 오류' })
        )
      }
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
