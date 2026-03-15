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

  const encoder = new TextEncoder()
  const send = (obj: object) => encoder.encode(JSON.stringify(obj) + '\n')
  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ─── 제품-성분 연결 (등록된 성분 기준) ──────────────────────────

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

        controller.enqueue(send({ type: 'start', total, totalBatches }))

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
            count: totalLinked,
            matchedProducts,
            total,
            message: `${matchedProducts.toLocaleString()}개 제품 / ${totalLinked.toLocaleString()}개 성분 연결 완료`,
          })
        )
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
