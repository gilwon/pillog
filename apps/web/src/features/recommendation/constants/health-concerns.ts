import type { HealthConcern, HealthConcernKey } from '../types'

export const HEALTH_CONCERNS: HealthConcern[] = [
  {
    key: '면역력',
    label: '면역력',
    emoji: '🛡️',
    description: '면역 기능 강화',
    keywords: ['면역력 증진', '정상적인 면역기능', '면역기능에 필요', '면역력'],
  },
  {
    key: '피로회복',
    label: '피로·활력',
    emoji: '⚡',
    description: '피로 해소 및 에너지',
    keywords: ['피로회복', '에너지 생성', '체력', '활력'],
  },
  {
    key: '피부건강',
    label: '피부',
    emoji: '✨',
    description: '피부 건강 및 탄력',
    keywords: ['피부건강', '피부 보습', '콜라겐', '피부탄력', '피부 노화'],
  },
  {
    key: '눈건강',
    label: '눈·시력',
    emoji: '👁️',
    description: '눈 건강 유지',
    keywords: ['눈건강', '시력', '안구', '야맹증', '눈의 피로'],
  },
  {
    key: '뼈/관절',
    label: '뼈·관절',
    emoji: '🦴',
    description: '뼈 밀도와 관절 건강',
    keywords: ['뼈건강', '관절건강', '칼슘 흡수', '골밀도', '뼈 형성'],
  },
  {
    key: '혈행개선',
    label: '혈행',
    emoji: '❤️',
    description: '혈액순환 개선',
    keywords: ['혈행개선', '혈액순환', '혈압 감소', '혈소판'],
  },
  {
    key: '장건강',
    label: '장·소화',
    emoji: '🌿',
    description: '장내 환경 개선',
    keywords: ['장건강', '유익균', '장내 환경', '배변활동', '소화'],
  },
  {
    key: '항산화',
    label: '항산화',
    emoji: '🔬',
    description: '세포 산화 방지',
    keywords: ['항산화', '활성산소', '세포를 보호', '산화 스트레스'],
  },
  {
    key: '체중관리',
    label: '체중관리',
    emoji: '⚖️',
    description: '체지방 감소',
    keywords: ['체지방 감소', '체중조절', '지방분해', '다이어트'],
  },
  {
    key: '스트레스',
    label: '스트레스',
    emoji: '🧘',
    description: '스트레스·긴장 완화',
    keywords: ['스트레스 완화', '긴장 완화', '신경안정', '정서안정'],
  },
  {
    key: '수면',
    label: '수면',
    emoji: '😴',
    description: '수면의 질 개선',
    keywords: ['수면의 질', '숙면', '멜라토닌', '수면 유지'],
  },
  {
    key: '간건강',
    label: '간건강',
    emoji: '🫁',
    description: '간 기능 보호',
    keywords: ['간건강', '간 기능', '해독', '간 보호'],
  },
  {
    key: '남성건강',
    label: '남성건강',
    emoji: '💪',
    description: '남성 활력 지원',
    keywords: ['남성 건강', '전립선', '테스토스테론', '남성 활력'],
  },
  {
    key: '여성건강',
    label: '여성건강',
    emoji: '🌸',
    description: '여성 건강 지원',
    keywords: ['여성 건강', '갱년기', '생리', '여성 활력'],
  },
  {
    key: '어린이',
    label: '어린이',
    emoji: '🌟',
    description: '성장 및 두뇌 발달',
    keywords: ['성장', '두뇌발달', '집중력', '어린이'],
  },
]

export const HEALTH_CONCERN_MAP = Object.fromEntries(
  HEALTH_CONCERNS.map((c) => [c.key, c.keywords])
) as Record<HealthConcernKey, string[]>

export const MAX_CONCERNS = 3
