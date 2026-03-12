import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/features/products/components/ProductDetail'
import { IngredientList } from '@/features/ingredients/components/IngredientList'
import { Disclaimer } from '@/components/common/Disclaimer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, company, primary_functionality')
    .eq('id', id)
    .single()

  if (!product) {
    return { title: '제품을 찾을 수 없습니다 - Pillog' }
  }

  return {
    title: `${product.name} - ${product.company} | Pillog`,
    description: product.primary_functionality || `${product.name} 성분 분석`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch product with ingredients
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  // Fetch product ingredients with ingredient details
  const { data: ingredients } = await supabase
    .from('product_ingredients')
    .select(
      `
      *,
      ingredient:ingredients(
        canonical_name,
        category,
        subcategory,
        description,
        primary_effect,
        daily_rdi,
        daily_ul,
        rdi_unit
      )
    `
    )
    .eq('product_id', id)
    .order('is_functional', { ascending: false })

  const productWithIngredients = {
    ...product,
    ingredients: (ingredients || []).map((pi: Record<string, unknown>) => {
      const ing = pi.ingredient as unknown as Record<string, unknown> | null
      return {
        ...pi,
        canonical_name: ing?.canonical_name ?? '',
        description: ing?.description ?? null,
        primary_effect: ing?.primary_effect ?? null,
        daily_rdi: ing?.daily_rdi ?? null,
        daily_ul: ing?.daily_ul ?? null,
        rdi_unit: ing?.rdi_unit ?? null,
        category: ing?.category ?? '기타',
      }
    }),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ProductDetail product={productWithIngredients} />

      {productWithIngredients.ingredients.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">성분 정보</h2>
          <IngredientList ingredients={productWithIngredients.ingredients} />
        </section>
      )}

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  )
}
