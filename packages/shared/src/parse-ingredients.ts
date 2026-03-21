/**
 * 제품 원재료(raw_materials) 파싱 유틸리티
 * API route와 pipeline 스크립트에서 공유
 */

/** products.raw_materials 문자열 → 성분명 배열 */
export function parseRawMaterials(raw: string): string[] {
  if (!raw) return []
  let text = raw

  // HTML 엔티티 디코딩: &#40; → (, &#41; → )
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))

  // 전각 → 반각 변환 (ａ-ｚ, Ａ-Ｚ, ０-９)
  text = text.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  )

  // 모든 괄호 종류 통일: {}, [], 〔〕, 【】 → ()
  text = text.replace(/[{[〔【]/g, '(').replace(/[}\]〕】]/g, ')')

  // 특수 기호 제거: ※, ①②③ 등
  text = text.replace(/[※①②③④⑤⑥⑦⑧⑨⑩]/g, '')

  // 퍼센트/수량 포함 괄호 제거: (중국산, 50%이상), (100,000CFU/g)
  text = text.replace(/\([^)]*[%/][^)]*\)/g, '')

  // 불필요 단어 제거
  text = text.replace(/\s*(이상|이하|함유)\s*/g, '')

  return text
    .split(',')
    .map((part) => {
      let s = part
      // 남은 괄호 내용 제거
      s = s.replace(/\([^)]*\)/g, '')
      // 불완전 괄호 잔해 제거: 열림 없이 닫힘, 닫힘 없이 열림
      s = s.replace(/\([^)]*$/g, '')
      s = s.replace(/^[^(]*\)/g, '')
      // 이름 뒤 퍼센트/수량 제거: "덱스트린 86.7%" → "덱스트린"
      s = s.replace(/\s+\d[\d.,]*\s*%?\s*$/, '')
      return s.replace(/\s+/g, ' ').trim()
    })
    .filter((name) => {
      if (name.length < 2) return false
      // 숫자/단위만으로 된 항목 제외
      if (/^[\d.,\s]+(%|개\s*\/\s*g|cfu\s*\/\s*g|iu\s*\/\s*g|mg|μg)?[)\s]*$/i.test(name)) return false
      // CFU/IU/개수 단위 포함 잔해
      if (/\d+\s*(cfu|iu|개)\s*\/\s*g/i.test(name)) return false
      // 규격 잔해 제외 (생균으로, 의 합 등)
      if (/의\s*(합|생균|사균)|적량$/.test(name)) return false
      // 퍼센트 포함
      if (/\d+(\.\d+)?\s*%/.test(name)) return false
      // 과학적 표기 잔해 (1x10, 10^9)
      if (/\d+[x*]\d+/i.test(name)) return false
      // 계100% 등 합계 잔해
      if (/계\s*\d/.test(name)) return false
      return true
    })
}

/** products.standard 문자열에서 성분 함량 추출 */
export function parseAmount(standard: string, canonicalName: string): [number | null, string | null] {
  if (!standard || !canonicalName) return [null, null]

  // µ (U+00B5) → μ (U+03BC) 통일
  const normalized = standard.replace(/µ/g, 'μ')

  const AMOUNT_RE =
    /(\d[\d,]*(?:\.\d+)?)\s*(mg|μg|ug|mcg|IU|g|CFU|억\s*CFU|만\s*CFU|천\s*CFU)(?:\s*[A-Z]*)?/gi
  const UNIT_MAP: Record<string, string> = {
    ug: 'μg', mcg: 'μg', cfu: 'CFU',
    '억 cfu': 'CFU', '억cfu': 'CFU',
    '만 cfu': 'CFU', '만cfu': 'CFU',
    '천 cfu': 'CFU', '천cfu': 'CFU',
  }

  // 성분명으로 직접 검색
  const lowerStd = normalized.toLowerCase()
  const lowerName = canonicalName.toLowerCase()
  let idx = lowerStd.indexOf(lowerName)

  // 직접 매칭 실패 시 띄어쓰기 제거 버전으로 재시도
  if (idx === -1) {
    const noSpaceStd = lowerStd.replace(/\s+/g, '')
    const noSpaceName = lowerName.replace(/\s+/g, '')
    const noSpaceIdx = noSpaceStd.indexOf(noSpaceName)
    if (noSpaceIdx !== -1) {
      // 원본 standard에서 대략적 위치 추정
      idx = Math.min(noSpaceIdx, normalized.length - 1)
    }
  }

  if (idx === -1) return [null, null]

  // 성분명 뒤 100자 범위에서 표시량 패턴 검색
  const searchWindow = normalized.slice(idx, idx + canonicalName.length + 100)

  // 1차: "표시량(숫자 단위/..." 패턴 (식약처 standard 표준 형식)
  const displayAmountRe = /표시량\s*\(\s*(\d[\d,]*(?:\.\d+)?)\s*(mg|μg|ug|mcg|IU|g)/i
  const displayMatch = displayAmountRe.exec(searchWindow)
  if (displayMatch) {
    const amount = parseFloat(displayMatch[1].replace(/,/g, ''))
    const unit = UNIT_MAP[displayMatch[2].toLowerCase()] ?? displayMatch[2]
    return [amount, unit]
  }

  // 2차: 일반 숫자+단위 패턴
  AMOUNT_RE.lastIndex = 0
  const m = AMOUNT_RE.exec(searchWindow)
  if (m) {
    const amount = parseFloat(m[1].replace(/,/g, ''))
    const unit = UNIT_MAP[m[2].toLowerCase()] ?? m[2]
    return [amount, unit]
  }
  return [null, null]
}

/** 부형제/첨가물 목록 — 기능성 원료가 아닌 제조용 보조 물질 */
export const EXCIPIENTS = [
  '정제수',
  '젤라틴',
  '이산화규소',
  '스테아르산마그네슘',
  '스테아르산',
  '히드록시프로필메틸셀룰로스',
  'HPMC',
  '결정셀룰로스',
  '자당지방산에스테르',
  '옥수수전분',
  '카르나우바왁스',
  '이산화티탄',
  '글리세린',
  '덱스트린',
  '말토덱스트린',
  '유당',
  '포도당',
  '스테아린산',
  '폴리비닐알코올',
  '탈크',
  '셀룰로스',
  '카복시메틸셀룰로스',
  '폴리소르베이트',
  '프로필렌글리콜',
  '마그네슘스테아레이트',
] as const

/** Check if a raw material name is an excipient (not a functional ingredient) */
export function isExcipient(name: string): boolean {
  const trimmed = name.trim()
  return EXCIPIENTS.some(
    (ex) => trimmed === ex || trimmed.includes(ex)
  )
}
