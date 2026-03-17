import { Loader2 } from 'lucide-react'

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="mb-6 h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}
