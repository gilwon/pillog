'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

const SEARCH_DEBOUNCE_MS = 300

interface SearchBarProps {
  defaultValue?: string
  size?: 'default' | 'large'
  className?: string
  onSearch?: (query: string) => void
}

export function SearchBar({
  defaultValue = '',
  size = 'default',
  className,
  onSearch,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const handleSearch = useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value)
      } else if (value.trim()) {
        router.push(`/products?q=${encodeURIComponent(value.trim())}`)
      }
    },
    [onSearch, router]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (onSearch) {
      if (debounceTimer) clearTimeout(debounceTimer)
      const timer = setTimeout(() => handleSearch(value), SEARCH_DEBOUNCE_MS)
      setDebounceTimer(timer)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
          size === 'large' ? 'h-5 w-5' : 'h-4 w-4'
        )}
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="영양제 이름 또는 성분을 검색하세요."
        className={cn(
          'w-full rounded-lg border border-input bg-background pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
          size === 'large' ? 'h-14 text-lg' : 'h-10 text-sm'
        )}
      />
    </form>
  )
}
