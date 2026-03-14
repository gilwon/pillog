import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HealthConcernKey } from '../types'
import { MAX_CONCERNS } from '../constants/health-concerns'

interface RecommendationStore {
  selectedConcerns: HealthConcernKey[]
  toggleConcern: (key: HealthConcernKey) => void
  setSelectedConcerns: (concerns: HealthConcernKey[]) => void
  clearConcerns: () => void
}

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      selectedConcerns: [],
      toggleConcern: (key) => {
        const { selectedConcerns } = get()
        if (selectedConcerns.includes(key)) {
          set({ selectedConcerns: selectedConcerns.filter((k) => k !== key) })
        } else if (selectedConcerns.length < MAX_CONCERNS) {
          set({ selectedConcerns: [...selectedConcerns, key] })
        }
      },
      setSelectedConcerns: (concerns) => {
        set({ selectedConcerns: concerns.slice(0, MAX_CONCERNS) })
      },
      clearConcerns: () => set({ selectedConcerns: [] }),
    }),
    {
      name: 'pillog-recommendation',
    }
  )
)
