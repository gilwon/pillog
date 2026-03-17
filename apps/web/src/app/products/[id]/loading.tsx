import { Loader2 } from 'lucide-react'

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back button skeleton */}
      <div className="mb-4 h-8 w-24 animate-pulse rounded-md bg-muted" />

      {/* Company */}
      <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted" />
      {/* Product name */}
      <div className="mb-2 h-8 w-3/4 animate-pulse rounded bg-muted" />
      {/* Report no */}
      <div className="mb-6 h-3 w-48 animate-pulse rounded bg-muted" />

      {/* Tags */}
      <div className="mb-6 flex gap-2">
        <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex gap-2">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Details box */}
      <div className="rounded-xl border border-border p-5">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients section */}
      <div className="mt-10">
        <div className="mb-4 h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
