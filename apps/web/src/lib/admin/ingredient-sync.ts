import { SupabaseClient } from '@supabase/supabase-js'
import { parseRawMaterials, parseAmount, isExcipient } from '@pillog/shared/parse-ingredients'

const BATCH_SIZE = 500

/**
 * 별칭 맵에 한국어 건강기능식품 변형 패턴 자동 추가.
 * 예: "비타민C" → "비타민 C", "비타민 c", "L-아스코르브산" 등
 */
function expandAliases(
  aliasMap: Map<string, { id: string; canonical_name: string; is_functional: boolean }>
): void {
  const additions: Array<[string, { id: string; canonical_name: string; is_functional: boolean }]> = []

  for (const [key, value] of aliasMap) {
    const name = value.canonical_name

    // 1. 띄어쓰기 변형: "비타민C" ↔ "비타민 C"
    const noSpace = name.replace(/\s+/g, '').toLowerCase()
    if (noSpace !== key) {
      additions.push([noSpace, value])
    }

    // 2. 괄호 제거: "코엔자임Q10(고시형)" → "코엔자임Q10"
    const noParen = name.replace(/\([^)]*\)/g, '').trim().toLowerCase()
    if (noParen && noParen !== key) {
      additions.push([noParen, value])
    }

    // 3. "추출물/분말/농축액/혼합/에스테르" 접미사 변형
    const suffixes = ['추출물', '분말', '농축액', '혼합분말', '에스테르', '함유', '배양물']
    for (const suffix of suffixes) {
      // "프로폴리스추출물" → "프로폴리스" (접미사 제거)
      if (name.endsWith(suffix) && name.length > suffix.length + 1) {
        const base = name.slice(0, -suffix.length).trim().toLowerCase()
        if (base.length >= 2 && !aliasMap.has(base)) {
          additions.push([base, value])
        }
      }
      // "프로폴리스" → "프로폴리스추출물" (접미사 추가)
      const withSuffix = (name + suffix).toLowerCase()
      if (!aliasMap.has(withSuffix)) {
        additions.push([withSuffix, value])
      }
    }
  }

  for (const [key, value] of additions) {
    if (!aliasMap.has(key)) {
      aliasMap.set(key, value)
    }
  }
}

/**
 * 제품-성분 연결 동기화 핵심 로직.
 *
 * @param supabase  service-role Supabase 클라이언트
 * @param writer    NDJSON 한 줄을 스트림에 기록하는 콜백
 * @param messageTypes  스트림 메시지 type 필드 (호출처마다 다름)
 * @param since     이 시점 이후 synced_at 제품만 처리 (증분 매칭). null이면 전체.
 */
export async function runIngredientSync(
  supabase: SupabaseClient,
  writer: (msg: object) => void,
  messageTypes: {
    start: string
    progress: string
    done: string
    error: string
  } = {
    start: 'start',
    progress: 'progress',
    done: 'done',
    error: 'error',
  },
  since?: string | null
): Promise<{ totalLinked: number; matchedProducts: number; total: number }> {
  // 1. 별칭 맵 구축
  const aliasMap = new Map<string, { id: string; canonical_name: string; is_functional: boolean }>()
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, canonical_name, is_functional')
    .limit(10000)
  const { data: aliases } = await supabase
    .from('ingredient_aliases')
    .select('alias_name, ingredient_id')
    .limit(100000)

  const idToIngredient = new Map<string, { canonical_name: string; is_functional: boolean }>()
  for (const i of ingredients ?? []) {
    idToIngredient.set(i.id, { canonical_name: i.canonical_name, is_functional: i.is_functional ?? false })
    aliasMap.set(i.canonical_name.toLowerCase().trim(), {
      id: i.id,
      canonical_name: i.canonical_name,
      is_functional: i.is_functional ?? false,
    })
  }
  // ingredient_id → alias_name[] (for amount extraction fallback)
  const ingredientAliases = new Map<string, string[]>()

  for (const a of aliases ?? []) {
    const info = idToIngredient.get(a.ingredient_id)
    aliasMap.set(a.alias_name.toLowerCase().trim(), {
      id: a.ingredient_id,
      canonical_name: info?.canonical_name ?? '',
      is_functional: info?.is_functional ?? false,
    })

    // Build reverse alias map for parseAmount fallback
    const existing = ingredientAliases.get(a.ingredient_id)
    if (existing) {
      existing.push(a.alias_name)
    } else {
      ingredientAliases.set(a.ingredient_id, [a.alias_name])
    }
  }

  // 자동 별칭 확장
  expandAliases(aliasMap)

  // 2. 대상 제품 카운트 (증분 또는 전체)
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  if (since) {
    countQuery = countQuery.gte('synced_at', since)
  }
  const { count: totalCount } = await countQuery
  const total = totalCount ?? 0
  const totalBatches = Math.ceil(total / BATCH_SIZE) || 1

  writer({
    type: messageTypes.start,
    total,
    totalBatches,
    ...(since ? { mode: 'incremental' } : { mode: 'full' }),
  })

  if (total === 0) {
    writer({
      type: messageTypes.done,
      count: 0,
      matchedProducts: 0,
      total: 0,
      message: '매칭할 제품이 없습니다.',
    })
    return { totalLinked: 0, matchedProducts: 0, total: 0 }
  }

  let totalLinked = 0
  let matchedProducts = 0

  for (let batch = 1; batch <= totalBatches; batch++) {
    const offset = (batch - 1) * BATCH_SIZE
    let productQuery = supabase
      .from('products')
      .select('id, raw_materials, standard')
    if (since) {
      productQuery = productQuery.gte('synced_at', since)
    }
    const { data: products } = await productQuery
      .order('synced_at', { ascending: true })
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
        const lower = name.toLowerCase().trim()
        // 띄어쓰기 제거 버전도 시도
        const noSpace = lower.replace(/\s+/g, '')

        let ing = aliasMap.get(lower) || aliasMap.get(noSpace)

        // 부분 매칭 fallback (최소 4글자 이상만, 부형제 제외)
        if (!ing && !isExcipient(name)) {
          for (const [alias, candidate] of aliasMap) {
            if (alias.length >= 4 && lower.length >= 4) {
              if (alias.includes(lower) || lower.includes(alias)) {
                ing = candidate
                break
              }
            }
          }
        }

        if (!ing || seenIds.has(ing.id)) continue
        seenIds.add(ing.id)

        // Try canonical name first
        let [amount, amount_unit] = parseAmount(p.standard ?? '', ing.canonical_name)

        // If failed, try the original raw name
        if (amount == null && name !== ing.canonical_name) {
          [amount, amount_unit] = parseAmount(p.standard ?? '', name)
        }

        // If still failed, try all aliases for this ingredient
        if (amount == null) {
          const aliasList = ingredientAliases.get(ing.id) ?? []
          for (const alias of aliasList) {
            [amount, amount_unit] = parseAmount(p.standard ?? '', alias)
            if (amount != null) break
          }
        }
        piRows.push({
          product_id: p.id,
          ingredient_id: ing.id,
          amount,
          amount_unit,
          is_functional: ing.is_functional ?? false,
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

    writer({
      type: messageTypes.progress,
      batch,
      totalBatches,
      linked: totalLinked,
      total,
    })
  }

  writer({
    type: messageTypes.done,
    count: totalLinked,
    matchedProducts,
    total,
    message: `${matchedProducts.toLocaleString()}개 제품 / ${totalLinked.toLocaleString()}개 성분 연결 완료`,
  })

  return { totalLinked, matchedProducts, total }
}

/**
 * nutrient_rdi 테이블의 RDI/UL 데이터를 ingredients 테이블에 복사.
 * 성분명(canonical_name)이 일치하는 경우 daily_rdi, daily_ul, rdi_unit, category를 업데이트.
 * ingredients를 삭제/재수집해도 이 함수를 실행하면 RDI 데이터가 복원됨.
 */
export async function applyNutrientRdi(supabase: SupabaseClient): Promise<number> {
  const { data: rdiRows } = await supabase
    .from('nutrient_rdi')
    .select('name, category, daily_rdi, daily_ul, rdi_unit, description')
    .limit(500)

  if (!rdiRows || rdiRows.length === 0) return 0

  // 매칭할 성분명 목록으로 한번에 조회
  const rdiNames = rdiRows.map((r) => r.name)
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, canonical_name')
    .in('canonical_name', rdiNames)

  if (!ingredients || ingredients.length === 0) return 0

  // name → rdi 데이터 맵
  const rdiMap = new Map(rdiRows.map((r) => [r.name, r]))

  // 배치 업데이트 (같은 값끼리 묶기는 복잡하므로 Promise.all로 병렬 처리)
  const updates = ingredients
    .filter((ing) => rdiMap.has(ing.canonical_name))
    .map((ing) => {
      const rdi = rdiMap.get(ing.canonical_name)!
      return supabase
        .from('ingredients')
        .update({
          daily_rdi: rdi.daily_rdi,
          daily_ul: rdi.daily_ul,
          rdi_unit: rdi.rdi_unit,
          category: rdi.category,
          primary_effect: rdi.description,
        })
        .eq('id', ing.id)
    })

  await Promise.all(updates)
  return updates.length
}
