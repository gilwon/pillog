import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_COMPARE_ITEMS = 4

interface CompareItem {
  id: string
  name: string
  company: string
}

interface CompareStore {
  items: CompareItem[]
  addItem: (item: CompareItem) => void
  removeItem: (id: string) => void
  clearAll: () => void
  isMaxed: () => boolean
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const { items } = get()
        if (items.length >= MAX_COMPARE_ITEMS) return
        if (items.some((i) => i.id === item.id)) return
        set({ items: [...items, item] })
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      clearAll: () => {
        set({ items: [] })
      },
      isMaxed: () => get().items.length >= MAX_COMPARE_ITEMS,
    }),
    {
      name: 'pillog-compare',
    }
  )
)
