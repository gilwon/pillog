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
  reorderItems: (fromIndex: number, toIndex: number) => void
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
      reorderItems: (fromIndex, toIndex) => {
        const { items } = get()
        const next = [...items]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        set({ items: next })
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
