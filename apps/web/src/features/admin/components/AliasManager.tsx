'use client'

import { useState } from 'react'
import { useIngredientAliases, useAddAlias, useDeleteAlias } from '../hooks/useAdminIngredients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2 } from 'lucide-react'

interface AliasManagerProps {
  ingredientId: string
}

export function AliasManager({ ingredientId }: AliasManagerProps) {
  const { data, isLoading } = useIngredientAliases(ingredientId)
  const addMutation = useAddAlias()
  const deleteMutation = useDeleteAlias()

  const [newAlias, setNewAlias] = useState('')
  const [aliasType, setAliasType] = useState('common')

  const handleAdd = async () => {
    const name = newAlias.trim()
    if (!name) return

    try {
      await addMutation.mutateAsync({
        ingredientId,
        alias_name: name,
        alias_type: aliasType,
      })
      setNewAlias('')
    } catch {
      // error handled by mutation
    }
  }

  const aliasTypes = [
    { value: 'common', label: '일반명' },
    { value: 'scientific', label: '학명' },
    { value: 'brand', label: '브랜드명' },
    { value: 'abbreviation', label: '약어' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        별칭 로딩 중...
      </div>
    )
  }

  const aliases = data?.data || []

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">별칭 관리</p>

      {/* 기존 별칭 목록 */}
      {aliases.length === 0 ? (
        <p className="text-xs text-muted-foreground">등록된 별칭이 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {aliases.map((alias) => (
            <div
              key={alias.id}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1"
            >
              <span className="text-sm">{alias.alias_name}</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {aliasTypes.find((t) => t.value === alias.alias_type)?.label || alias.alias_type}
              </Badge>
              <button
                onClick={() => deleteMutation.mutate({ ingredientId, aliasId: alias.id })}
                className="text-muted-foreground hover:text-destructive"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 새 별칭 추가 */}
      <div className="flex gap-2">
        <Input
          value={newAlias}
          onChange={(e) => setNewAlias(e.target.value)}
          placeholder="별칭 입력"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <select
          value={aliasType}
          onChange={(e) => setAliasType(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
        >
          {aliasTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={addMutation.isPending || !newAlias.trim()}
          className="gap-1"
        >
          {addMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          추가
        </Button>
      </div>
    </div>
  )
}
