'use client'

import { ProductForm } from '@/features/admin/components/ProductForm'

export default function AdminProductNewPage() {
  return (
    <div className="space-y-6">
      <ProductForm mode="create" />
    </div>
  )
}
