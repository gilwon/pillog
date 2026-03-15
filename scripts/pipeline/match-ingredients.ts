/**
 * 성분 자동 추출 + 제품-성분 연결 스크립트
 * C003 제품 동기화 후 자동 실행됨 (GitHub Actions)
 *
 * 실행: npx tsx scripts/pipeline/match-ingredients.ts
 *
 * 환경변수:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 500
const INSERT_BATCH = 100
const LINK_BATCH = 500

function parseRawMaterials(raw: string): string[] {
  if (!raw) return []
  let text = raw

  // HTML 엔티티 디코딩: &#40; → (, &#41; → )
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))

  // 전각 → 반각 변환
  text = text.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  )

  // 모든 괄호 종류 통일: {}, [] → ()
  text = text.replace(/[{[]/g, '(').replace(/[}\]]/g, ')')

  // 퍼센트/수량 포함 괄호 제거
  text = text.replace(/\([^)]*[%/][^)]*\)/g, '')

  // 불필요 단어 제거
  text = text.replace(/\s*(이상|이하|함유)\s*/g, '')

  return text
    .split(',')
    .map((part) => {
      let s = part
      s = s.replace(/\([^)]*\)/g, '')
      s = s.replace(/\([^)]*$/g, '')
      s = s.replace(/^[^(]*\)/g, '')
      s = s.replace(/\s+\d[\d.,]*\s*%?\s*$/, '')
      return s.replace(/\s+/g, ' ').trim()
    })
    .filter((name) => {
      if (name.length < 2) return false
      if (/^[\d.,\s]+(%|개\/g|cfu\/g|iu\/g|mg|μg)?[)\s]*$/i.test(name)) return false
      if (/의\s*(합|생균|사균)|적량$/.test(name)) return false
      return true
    })
}

function parseAmount(standard: string, canonicalName: string): [number | null, string | null] {
  if (!standard || !canonicalName) return [null, null]
  const AMOUNT_RE =
    /(\d[\d,]*(?:\.\d+)?)\s*(mg|μg|ug|mcg|IU|g|CFU|억\s*CFU|만\s*CFU|천\s*CFU)/gi
  const UNIT_MAP: Record<string, string> = {
    ug: 'μg', mcg: 'μg', cfu: 'CFU',
    '억 cfu': 'CFU', '억cfu': 'CFU',
    '만 cfu': 'CFU', '만cfu': 'CFU',
    '천 cfu': 'CFU', '천cfu': 'CFU',
  }
  const idx = standard.toLowerCase().indexOf(canonicalName.toLowerCase())
  if (idx === -1) return [null, null]
  const window = standard.slice(idx, idx + canonicalName.length + 50)
  AMOUNT_RE.lastIndex = 0
  const m = AMOUNT_RE.exec(window)
  if (m) {
    const amount = parseFloat(m[1].replace(/,/g, ''))
    const unit = UNIT_MAP[m[2].toLowerCase()] ?? m[2]
    return [amount, unit]
  }
  return [null, null]
}

async function main() {
  console.log('🔬 성분 자동 추출 + 제품 연결 시작...')

  // 1. 기존 성분명 + 별칭 로드
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
  console.log(`  기존 성분: ${knownNames.size}개`)

  // 2. 전체 제품 스캔 → 미매칭 후보 수집
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('raw_materials', 'is', null)
  const total = totalCount ?? 0
  const totalBatches = Math.ceil(total / BATCH_SIZE) || 1
  console.log(`  대상 제품: ${total}개 (${totalBatches} 배치)`)

  const candidates = new Map<string, number>()
  const candidateProducts = new Map<string, Set<string>>()
  const productStandards = new Map<string, string>()

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
          candidates.set(lower, (candidates.get(lower) ?? 0) + 1)
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

    if (batch % 10 === 0 || batch === totalBatches) {
      console.log(`  스캔 진행: ${batch}/${totalBatches} 배치, 후보 ${candidates.size}개`)
    }
  }

  if (candidates.size === 0) {
    console.log('✅ 신규 성분 없음 — 완료')
    return
  }

  // 3. 신규 성분 삽입
  const newIngredients = Array.from(candidates.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({
      canonical_name: name,
      category: '미분류',
      source_info: '제품 원재료 자동 추출',
    }))

  let inserted = 0
  for (let i = 0; i < newIngredients.length; i += INSERT_BATCH) {
    const chunk = newIngredients.slice(i, i + INSERT_BATCH)
    const { data } = await supabase
      .from('ingredients')
      .upsert(chunk, { onConflict: 'canonical_name', ignoreDuplicates: true })
      .select('id')
    inserted += data?.length ?? 0
  }
  console.log(`  신규 성분 추가: ${inserted}개 (후보 ${candidates.size}개)`)

  // 4. 삽입된 성분 ID 조회
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

  // 5. product_ingredients 연결
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

  let totalLinked = 0
  for (let i = 0; i < piRows.length; i += LINK_BATCH) {
    const chunk = piRows.slice(i, i + LINK_BATCH)
    const { data: upserted } = await supabase
      .from('product_ingredients')
      .upsert(chunk, { onConflict: 'product_id,ingredient_id' })
      .select('id')
    totalLinked += upserted?.length ?? 0
  }

  console.log(`  제품-성분 연결: ${totalLinked}개`)
  console.log(`✅ 완료: ${inserted}개 성분 추가, ${totalLinked}개 연결`)
}

main().catch((err) => {
  console.error('❌ 성분 매칭 실패:', err)
  process.exit(1)
})
