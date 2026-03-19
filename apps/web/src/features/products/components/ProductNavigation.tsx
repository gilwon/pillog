import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdjacentProduct {
  id: string
  name: string
}

interface ProductNavigationProps {
  prev: AdjacentProduct | null
  next: AdjacentProduct | null
}

export function ProductNavigation({ prev, next }: ProductNavigationProps) {
  if (!prev && !next) return null

  return (
    <nav className="mt-10 grid grid-cols-2 gap-3" aria-label="제품 탐색">
      {prev ? (
        <Link
          href={`/products/${prev.id}`}
          className="group flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">이전 제품</p>
            <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
              {prev.name}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/products/${next.id}`}
          className="group flex items-center justify-end gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">다음 제품</p>
            <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
              {next.name}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
