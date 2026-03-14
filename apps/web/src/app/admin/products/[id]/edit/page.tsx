'use client'

import { use } from 'react'
import { useAdminProduct } from '@/features/admin/hooks/useAdminProducts'
import { ProductForm } from '@/features/admin/components/ProductForm'
import { Loader2 } from 'lucide-react'

export default function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: product, isLoading } = useAdminProduct(id)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">제품을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductForm product={product} mode="edit" />
    </div>
  )
}
