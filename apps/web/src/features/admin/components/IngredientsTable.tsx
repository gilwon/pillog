'use client'

import { useState } from 'react'
import { useAdminIngredients } from '../hooks/useAdminIngredients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronLeft, ChevronRight, Pencil, Loader2 } from 'lucide-react'
import { IngredientForm } from './IngredientForm'
import { AliasManager } from './AliasManager'
import { AdminSearchInput } from './AdminSearchInput'
import type { Ingredient } from '@/types/database'

export function IngredientsTable() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useAdminIngredients({ q: query, category, page, limit: 20 })

  const categories = ['비타민', '미네랄', '아미노산', '프로바이오틱스', '오메가', '허브', '기타']

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>성분 목록</CardTitle>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { setShowCreate(true); setEditingIngredient(null) }}
            >
              <Plus className="h-4 w-4" />
              성분 등록
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AdminSearchInput
              placeholder="성분명 검색..."
              type="ingredients"
              onSearch={(q) => { setQuery(q); setPage(1) }}
            />
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={category === '' ? 'default' : 'outline'}
                size="xs"
                onClick={() => { setCategory(''); setPage(1) }}
              >
                전체
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => { setCategory(cat); setPage(1) }}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query ? '검색 결과가 없습니다.' : '등록된 성분이 없습니다.'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">성분명</th>
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground hidden sm:table-cell">카테고리</th>
                      <th className="pb-3 pr-4 text-center font-medium text-muted-foreground hidden md:table-cell">RDI</th>
                      <th className="pb-3 pr-4 text-center font-medium text-muted-foreground hidden md:table-cell">UL</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((ingredient) => (
                      <tr key={ingredient.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => setExpandedId(expandedId === ingredient.id ? null : ingredient.id)}
                            className="text-left"
                          >
                            <div className="font-medium hover:text-primary">
                              {ingredient.canonical_name}
                            </div>
                            {ingredient.primary_effect && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {ingredient.primary_effect}
                              </div>
                            )}
                          </button>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          <Badge variant="outline">{ingredient.category}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-center text-muted-foreground hidden md:table-cell">
                          {ingredient.daily_rdi != null
                            ? `${ingredient.daily_rdi.toLocaleString()}${ingredient.rdi_unit || ''}`
                            : '-'}
                        </td>
                        <td className="py-3 pr-4 text-center text-muted-foreground hidden md:table-cell">
                          {ingredient.daily_ul != null
                            ? `${ingredient.daily_ul.toLocaleString()}${ingredient.rdi_unit || ''}`
                            : '-'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="수정"
                              onClick={() => { setEditingIngredient(ingredient); setShowCreate(true) }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expanded alias section */}
              {expandedId && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
                  <AliasManager ingredientId={expandedId} />
                </div>
              )}

              {/* Pagination */}
              {data.pagination.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {data.pagination.total.toLocaleString()}개 중 {((page - 1) * 20 + 1).toLocaleString()}-{Math.min(page * 20, data.pagination.total).toLocaleString()}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-2 text-sm text-muted-foreground">
                      {page} / {data.pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.total_pages, p + 1))}
                      disabled={page >= data.pagination.total_pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showCreate && (
        <IngredientForm
          ingredient={editingIngredient}
          onClose={() => { setShowCreate(false); setEditingIngredient(null) }}
        />
      )}
    </>
  )
}
