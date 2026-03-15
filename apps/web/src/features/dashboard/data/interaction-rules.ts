import type { InteractionType } from '@/types/database'

export interface InteractionRule {
  nutrients: [string, string]
  type: InteractionType
  severity: 'info' | 'caution' | 'warning'
  message: string
  recommendation?: string
}

/**
 * Known nutrient-nutrient interaction rules.
 *
 * Sources: Korean Nutrition Society (한국영양학회), NIH Office of Dietary Supplements.
 * This is a curated subset of well-documented interactions.
 */
export const INTERACTION_RULES: InteractionRule[] = [
  // --- Competition (흡수 경쟁) ---
  {
    nutrients: ['칼슘', '마그네슘'],
    type: 'competition',
    severity: 'caution',
    message:
      '칼슘과 마그네슘은 장에서 같은 수송체를 통해 흡수되어 경쟁합니다. 동시에 고용량을 섭취하면 흡수율이 떨어질 수 있습니다.',
    recommendation: '2시간 이상 간격을 두고 섭취하거나, 칼슘:마그네슘 비율을 2:1로 맞추는 것을 권장합니다.',
  },
  {
    nutrients: ['칼슘', '철분'],
    type: 'competition',
    severity: 'caution',
    message:
      '칼슘은 철분의 흡수를 최대 50%까지 저해할 수 있습니다. 특히 비헴철(식물성 철분)에 영향이 큽니다.',
    recommendation: '칼슘과 철분 보충제는 최소 2시간 간격을 두고 섭취하세요.',
  },
  {
    nutrients: ['칼슘', '아연'],
    type: 'competition',
    severity: 'caution',
    message:
      '고용량 칼슘(600mg 이상)은 아연의 흡수를 방해할 수 있습니다.',
    recommendation: '칼슘과 아연 보충제는 시간 간격을 두고 따로 섭취하세요.',
  },
  {
    nutrients: ['철분', '아연'],
    type: 'competition',
    severity: 'caution',
    message:
      '철분과 아연은 동일한 흡수 경로(DMT-1)를 공유하여 고용량 동시 섭취 시 서로의 흡수를 저해합니다.',
    recommendation: '두 성분은 다른 시간대에 나누어 섭취하는 것이 좋습니다.',
  },
  {
    nutrients: ['비타민 A', '비타민 D'],
    type: 'competition',
    severity: 'caution',
    message:
      '비타민 A와 비타민 D는 같은 핵 수용체(RXR)를 공유합니다. 비타민 A 과잉 섭취는 비타민 D의 작용을 방해할 수 있습니다.',
    recommendation: '비타민 A를 상한 섭취량 이내로 유지하세요.',
  },

  // --- Interference (작용 간섭) ---
  {
    nutrients: ['비타민 E', '비타민 K'],
    type: 'interference',
    severity: 'caution',
    message:
      '고용량 비타민 E는 비타민 K의 혈액 응고 기능을 억제할 수 있습니다. 항응고제를 복용 중이라면 특히 주의가 필요합니다.',
    recommendation: '비타민 E는 권장량 이내로 섭취하고, 항응고제 복용 시 의사와 상담하세요.',
  },

  // --- Synergy (시너지) ---
  {
    nutrients: ['철분', '비타민 C'],
    type: 'synergy',
    severity: 'info',
    message:
      '비타민 C는 비헴철의 흡수를 최대 6배까지 촉진합니다. 함께 섭취하면 효과적입니다.',
  },
  {
    nutrients: ['칼슘', '비타민 D'],
    type: 'synergy',
    severity: 'info',
    message:
      '비타민 D는 장에서 칼슘 흡수를 촉진하는 핵심 역할을 합니다. 함께 섭취하면 칼슘 이용률이 높아집니다.',
  },
  {
    nutrients: ['비타민 D', '마그네슘'],
    type: 'synergy',
    severity: 'info',
    message:
      '마그네슘은 비타민 D를 활성형으로 전환하는 데 필수적입니다. 마그네슘이 부족하면 비타민 D 효과가 감소합니다.',
  },
  {
    nutrients: ['아연', '비타민 B6'],
    type: 'synergy',
    severity: 'info',
    message:
      '비타민 B6는 아연의 장 흡수를 촉진합니다. 함께 섭취하면 아연 이용률이 향상됩니다.',
  },
  {
    nutrients: ['오메가-3', '비타민 E'],
    type: 'synergy',
    severity: 'info',
    message:
      '비타민 E는 항산화제로서 오메가-3 지방산의 산화를 방지합니다. 함께 섭취하면 오메가-3의 안정성이 높아집니다.',
  },
]
