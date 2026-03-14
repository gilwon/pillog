import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon: LucideIcon
  href?: string
}

export function StatsCard({ title, value, description, icon: Icon, href }: StatsCardProps) {
  const content = (
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  )

  if (href) {
    return (
      <Link href={href}>
        <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
          {content}
        </Card>
      </Link>
    )
  }

  return (
    <Card>
      {content}
    </Card>
  )
}
