/**
 * Parse raw material string from C003 API RAWMTRL_NM field.
 *
 * Example input:
 *   "홍삼농축액(농축물),시클로덱스트린시럽,비타민C(L-아스코르빈산),정제수"
 *
 * Returns array of parsed ingredient objects.
 */

export interface ParsedIngredient {
  name: string
  additionalInfo: string | null
}

export function parseRawMaterials(rawMaterials: string): ParsedIngredient[] {
  if (!rawMaterials || rawMaterials.trim() === '') {
    return []
  }

  // Split by comma, but respect parentheses
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (const char of rawMaterials) {
    if (char === '(') depth++
    if (char === ')') depth--

    if (char === ',' && depth === 0) {
      const trimmed = current.trim()
      if (trimmed) parts.push(trimmed)
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())

  return parts.map((part) => {
    // Extract parenthetical info
    const match = part.match(/^([^(]+)\((.+)\)$/)
    if (match) {
      return {
        name: match[1].trim(),
        additionalInfo: match[2].trim(),
      }
    }
    return {
      name: part.trim(),
      additionalInfo: null,
    }
  })
}
