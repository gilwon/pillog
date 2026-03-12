import { cn } from '@/lib/utils/cn'

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
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 font-medium text-primary',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      {tag}
    </span>
  )
}
