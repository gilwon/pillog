import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FunctionalityTagProps {
  tag: string
  size?: 'sm' | 'md'
  className?: string
}

export function FunctionalityTag({
  tag,
  size = 'sm',
  className,
}: FunctionalityTagProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'h-auto max-w-full whitespace-normal break-words rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border-0 leading-snug',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      {tag}
    </Badge>
  )
}
