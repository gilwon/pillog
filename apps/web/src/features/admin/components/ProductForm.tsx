'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateProduct, useUpdateProduct } from '../hooks/useAdminProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, ArrowLeft, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Product } from '@/types/database'

interface ProductFormProps {
  product?: Partial<Product> & { id: string }
  mode: 'create' | 'edit'
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const [form, setForm] = useState({
    report_no: product?.report_no || '',
    name: product?.name || '',
    company: product?.company || '',
    primary_functionality: product?.primary_functionality || '',
    functionality_tags: product?.functionality_tags || [],
    how_to_take: product?.how_to_take || '',
    caution: product?.caution || '',
    shape: product?.shape || '',
    standard: product?.standard || '',
    shelf_life: product?.shelf_life || '',
    storage_method: product?.storage_method || '',
    raw_materials: product?.raw_materials || '',
    image_url: product?.image_url || '',
  })

  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.functionality_tags.includes(tag)) {
      setForm((prev) => ({
        ...prev,
        functionality_tags: [...prev.functionality_tags, tag],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      functionality_tags: prev.functionality_tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.report_no) {
      setError('제품명과 신고번호는 필수입니다.')
      return
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(form)
      } else if (product?.id) {
        await updateMutation.mutateAsync({ id: product.id, ...form })
      }
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              {mode === 'create' ? '제품 등록' : '제품 수정'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* 필수 필드 */}
            <div className="space-y-1.5">
              <Label htmlFor="report_no">신고번호 *</Label>
              <Input
                id="report_no"
                value={form.report_no}
                onChange={(e) => handleChange('report_no', e.target.value)}
                placeholder="예: 19910018003052"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">제품명 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="제품명"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">업체명</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="업체명"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shape">제형</Label>
              <Input
                id="shape"
                value={form.shape}
                onChange={(e) => handleChange('shape', e.target.value)}
                placeholder="예: 캡슐, 정제, 분말"
              />
            </div>
          </div>

          {/* 기능성 */}
          <div className="space-y-1.5">
            <Label htmlFor="primary_functionality">주된 기능성</Label>
            <Input
              id="primary_functionality"
              value={form.primary_functionality}
              onChange={(e) => handleChange('primary_functionality', e.target.value)}
              placeholder="주된 기능성 내용"
            />
          </div>

          {/* 기능성 태그 */}
          <div className="space-y-1.5">
            <Label>기능성 태그</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="태그 입력 후 추가"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" size="default" onClick={addTag}>
                추가
              </Button>
            </div>
            {form.functionality_tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.functionality_tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 복용/주의사항 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="how_to_take">섭취 방법</Label>
              <Input
                id="how_to_take"
                value={form.how_to_take}
                onChange={(e) => handleChange('how_to_take', e.target.value)}
                placeholder="1일 1회, 1회 1정 등"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="caution">섭취 시 주의사항</Label>
              <Input
                id="caution"
                value={form.caution}
                onChange={(e) => handleChange('caution', e.target.value)}
                placeholder="주의사항"
              />
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="standard">기준 및 규격</Label>
              <Input
                id="standard"
                value={form.standard}
                onChange={(e) => handleChange('standard', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shelf_life">유통기한</Label>
              <Input
                id="shelf_life"
                value={form.shelf_life}
                onChange={(e) => handleChange('shelf_life', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storage_method">보관 방법</Label>
              <Input
                id="storage_method"
                value={form.storage_method}
                onChange={(e) => handleChange('storage_method', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image_url">이미지 URL</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="raw_materials">원재료</Label>
            <Input
              id="raw_materials"
              value={form.raw_materials}
              onChange={(e) => handleChange('raw_materials', e.target.value)}
              placeholder="원재료 목록"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === 'create' ? '등록' : '저장'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
