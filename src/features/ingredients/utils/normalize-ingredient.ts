/**
 * Ingredient name normalization utility.
 *
 * Maps common aliases/scientific names to canonical names.
 * This is a static mapping for MVP; in production, the
 * ingredient_aliases DB table handles this.
 */

const NORMALIZATION_MAP: Record<string, string> = {
  // Vitamin C
  'L-아스코르빈산': '비타민C',
  '아스코르브산': '비타민C',
  '아스코르빈산': '비타민C',
  'ascorbic acid': '비타민C',

  // Vitamin D
  '콜레칼시페롤': '비타민D',
  '비타민D3': '비타민D',
  '칼시페롤': '비타민D',
  'cholecalciferol': '비타민D',

  // Vitamin E
  'd-알파토코페롤': '비타민E',
  '알파토코페롤': '비타민E',
  '토코페롤': '비타민E',

  // Vitamin B1
  '티아민': '비타민B1',
  '염산티아민': '비타민B1',

  // Vitamin B2
  '리보플라빈': '비타민B2',

  // Vitamin B6
  '피리독신': '비타민B6',
  '염산피리독신': '비타민B6',

  // Vitamin B12
  '시아노코발라민': '비타민B12',
  '코발라민': '비타민B12',
  '메틸코발라민': '비타민B12',

  // Folic acid
  '엽산': '폴산',
  'pteroylglutamic acid': '폴산',

  // Calcium
  '탄산칼슘': '칼슘',
  '구연산칼슘': '칼슘',
  '산호칼슘': '칼슘',

  // Iron
  '철분': '철',
  '푸마르산제일철': '철',
  '글루콘산철': '철',

  // Zinc
  '산화아연': '아연',
  '글루콘산아연': '아연',

  // Magnesium
  '산화마그네슘': '마그네슘',
  '구연산마그네슘': '마그네슘',

  // Omega-3
  'EPA': '오메가3',
  'DHA': '오메가3',
  '이코사펜타엔산': '오메가3',
  '도코사헥사엔산': '오메가3',

  // Probiotics
  '락토바실러스': '프로바이오틱스',
  '비피도박테리움': '프로바이오틱스',
  '유산균': '프로바이오틱스',

  // Lutein
  '루테인': '루테인',
  '마리골드꽃추출물': '루테인',
}

/**
 * Normalize an ingredient name to its canonical form.
 * Returns the original name if no normalization mapping is found.
 */
export function normalizeIngredientName(name: string): string {
  const trimmed = name.trim()

  // Direct match
  if (NORMALIZATION_MAP[trimmed]) {
    return NORMALIZATION_MAP[trimmed]
  }

  // Case-insensitive match
  const lowerName = trimmed.toLowerCase()
  for (const [alias, canonical] of Object.entries(NORMALIZATION_MAP)) {
    if (alias.toLowerCase() === lowerName) {
      return canonical
    }
  }

  return trimmed
}

/**
 * Check if an ingredient name appears to be a functional ingredient
 * (as opposed to an excipient/additive).
 */
export function isFunctionalIngredient(name: string): boolean {
  const EXCIPIENTS = [
    '정제수',
    '젤라틴',
    '이산화규소',
    '스테아르산마그네슘',
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
  ]

  const normalized = name.trim()
  return !EXCIPIENTS.some(
    (ex) => normalized === ex || normalized.includes(ex)
  )
}
