'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SuggestItem {
  id: string
  name: string
  sub: string
}

interface AdminSearchInputProps {
  placeholder: string
  type: 'products' | 'ingredients'
  onSearch: (query: string) => void
}

export function AdminSearchInput({ placeholder, type, onSearch }: AdminSearchInputProps) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/suggest?q=${encodeURIComponent(q)}&type=${type}`)
      if (res.ok) {
        const data: SuggestItem[] = await res.json()
        setSuggestions(data)
        setIsOpen(data.length > 0)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [type])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, fetchSuggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: SuggestItem) => {
    setValue(item.name)
    setIsOpen(false)
    setActiveIndex(-1)
    onSearch(item.name)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      handleSelect(suggestions[activeIndex])
    } else {
      onSearch(value)
    }
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <form onSubmit={handleSubmit}>
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => { setValue(e.target.value); setActiveIndex(-1) }}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          {suggestions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted',
                i === activeIndex && 'bg-muted'
              )}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="truncate font-medium">{item.name}</span>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{item.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
