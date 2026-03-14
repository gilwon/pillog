import { INTERACTION_RULES } from '@/features/dashboard/data/interaction-rules'
import type { InteractionWarning } from '@/types/database'

/**
 * Evaluate which interaction rules apply given a list of nutrient names
 * present in the user's supplement stack.
 *
 * Returns matching interactions sorted by severity (warning > caution > info).
 */
export function evaluateInteractions(
  nutrientNames: string[]
): InteractionWarning[] {
  const nameSet = new Set(nutrientNames)
  const matched: InteractionWarning[] = []

  for (const rule of INTERACTION_RULES) {
    const [a, b] = rule.nutrients
    if (nameSet.has(a) && nameSet.has(b)) {
      matched.push({
        nutrients: [a, b],
        type: rule.type,
        severity: rule.severity,
        message: rule.message,
        ...(rule.recommendation ? { recommendation: rule.recommendation } : {}),
      })
    }
  }

  // Sort: warning > caution > info
  const severityOrder = { warning: 0, caution: 1, info: 2 }
  matched.sort((x, y) => severityOrder[x.severity] - severityOrder[y.severity])

  return matched
}
