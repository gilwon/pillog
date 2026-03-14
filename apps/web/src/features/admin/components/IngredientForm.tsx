'use client'

import { useState } from 'react'
import { useCreateIngredient, useUpdateIngredient } from '../hooks/useAdminIngredients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Ingredient } from '@/types/database'

interface IngredientFormProps {
  ingredient?: Ingredient | null
  onClose: () => void
}

export function IngredientForm({ ingredient, onClose }: IngredientFormProps) {
  const createMutation = useCreateIngredient()
  const updateMutation = useUpdateIngredient()
  const isEdit = !!ingredient

  const [form, setForm] = useState({
    canonical_name: ingredient?.canonical_name || '',
    category: ingredient?.category || '기타',
    subcategory: ingredient?.subcategory || '',
    description: ingredient?.description || '',
    primary_effect: ingredient?.primary_effect || '',
    daily_rdi: ingredient?.daily_rdi?.toString() || '',
    daily_ul: ingredient?.daily_ul?.toString() || '',
    rdi_unit: ingredient?.rdi_unit || 'mg',
    source_info: ingredient?.source_info || '',
  })

  const [error, setError] = useState('')
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.canonical_name) {
      setError('성분명은 필수입니다.')
      return
    }

    const payload = {
      canonical_name: form.canonical_name,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description || null,
      primary_effect: form.primary_effect || null,
      daily_rdi: form.daily_rdi ? Number(form.daily_rdi) : null,
      daily_ul: form.daily_ul ? Number(form.daily_ul) : null,
      rdi_unit: form.rdi_unit || null,
      source_info: form.source_info || null,
    }

    try {
      if (isEdit && ingredient) {
        await updateMutation.mutateAsync({ id: ingredient.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const categories = ['비타민', '미네랄', '아미노산', '프로바이오틱스', '오메가', '허브', '기타']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isEdit ? '성분 수정' : '성분 등록'}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="canonical_name">성분명 (정규화명) *</Label>
            <Input
              id="canonical_name"
              value={form.canonical_name}
              onChange={(e) => handleChange('canonical_name', e.target.value)}
              placeholder="예: 비타민 C"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">카테고리</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subcategory">하위 카테고리</Label>
              <Input
                id="subcategory"
                value={form.subcategory}
                onChange={(e) => handleChange('subcategory', e.target.value)}
                placeholder="선택"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primary_effect">주요 효과</Label>
            <Input
              id="primary_effect"
              value={form.primary_effect}
              onChange={(e) => handleChange('primary_effect', e.target.value)}
              placeholder="면역 기능, 항산화 등"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="daily_rdi">RDI (권장량)</Label>
              <Input
                id="daily_rdi"
                type="number"
                step="any"
                value={form.daily_rdi}
                onChange={(e) => handleChange('daily_rdi', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_ul">UL (상한량)</Label>
              <Input
                id="daily_ul"
                type="number"
                step="any"
                value={form.daily_ul}
                onChange={(e) => handleChange('daily_ul', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdi_unit">단위</Label>
              <Input
                id="rdi_unit"
                value={form.rdi_unit}
                onChange={(e) => handleChange('rdi_unit', e.target.value)}
                placeholder="mg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="성분에 대한 간략한 설명"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? '저장' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
