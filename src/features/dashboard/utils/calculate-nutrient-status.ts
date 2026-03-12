import type { NutrientStatus } from '@/types/database'

/**
 * Calculate nutrient status based on RDI and UL percentages.
 *
 * - safe: RDI 0~150% AND UL < 70% (or UL not set)
 * - caution: RDI 150~300% OR UL 70~100%
 * - warning: UL > 100%
 */
export function calculateNutrientStatus(
  rdiPercentage: number | null,
  ulPercentage: number | null
): NutrientStatus {
  // UL exceeded = warning
  if (ulPercentage != null && ulPercentage > 100) {
    return 'warning'
  }

  // UL approaching (70-100%) = caution
  if (ulPercentage != null && ulPercentage >= 70) {
    return 'caution'
  }

  // High RDI (150-300%) without UL concern = caution
  if (rdiPercentage != null && rdiPercentage > 150) {
    return 'caution'
  }

  return 'safe'
}
