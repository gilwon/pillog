'use client'

import { Pill } from 'lucide-react'
import type { UserSupplementsResponse } from '@/types/api'

type SupplementItem = UserSupplementsResponse['data'][number]

interface ChatSupplementPanelProps {
  items: SupplementItem[]
}

export function ChatSupplementPanel({ items }: ChatSupplementPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Pill className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">내 영양제</h3>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="max-h-[520px] overflow-y-auto p-3">
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border/50 bg-muted/20 p-2.5"
            >
              <p className="text-sm font-medium leading-tight">{item.product.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.product.company}</p>
              {item.product.functionality_tags && item.product.functionality_tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.product.functionality_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
