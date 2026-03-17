'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SUGGEST_DEBOUNCE_MS = 200

interface Suggestion {
  id: string
  name: string
  company: string
}

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestTimer = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(
    (value: string) => {
      setShowSuggestions(false)
      if (onSearch) {
        onSearch(value)
      } else if (value.trim()) {
        router.push(`/products?q=${encodeURIComponent(value.trim())}`)
      }
    },
    [onSearch, router]
  )

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) {
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
        setActiveIndex(-1)
      }
    } catch {
      // silently fail
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    suggestTimer.current = setTimeout(() => fetchSuggestions(value), SUGGEST_DEBOUNCE_MS)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const selected = suggestions[activeIndex]
      router.push(`/products/${selected.id}`)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className={cn('relative z-20', className)}>
      <form onSubmit={handleSubmit}>
        <Search
          className={cn(
            'absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none z-10',
            size === 'large' ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
          placeholder="영양제 이름 또는 성분을 검색하세요."
          autoComplete="off"
          className={cn(
            'w-full rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            size === 'large'
              ? 'h-14 pl-11 pr-4 text-lg shadow-sm shadow-primary/5'
              : 'h-10 pl-10 pr-4 text-sm'
          )}
        />
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
          {suggestions.map((item, i) => (
            <Link
              key={item.id}
              href={`/products/${item.id}`}
              onClick={() => setShowSuggestions(false)}
              className={cn(
                'flex items-start gap-3 px-4 py-2.5 transition-colors',
                i === activeIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.company}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
