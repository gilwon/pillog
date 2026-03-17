import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/features/products/components/ProductDetail'
import { IngredientList } from '@/features/ingredients/components/IngredientList'
import { IngredientExplain } from '@/features/ingredients/components/IngredientExplain'
import { ProductNavigation } from '@/features/products/components/ProductNavigation'
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

  // Fetch product + ingredients in parallel (critical path only)
  const [{ data: product, error }, { data: ingredients }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase
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
      .order('is_functional', { ascending: false }),
  ])

  if (error || !product) {
    notFound()
  }

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProductDetail product={productWithIngredients} />

      {(productWithIngredients.ingredients.length > 0 || product.raw_materials) && (
        <section className="animate-fade-in-up stagger-2 mt-10">
          <h2 className="mb-4 text-xl font-bold">성분 정보</h2>
          <IngredientList
            ingredients={productWithIngredients.ingredients}
            rawMaterials={product.raw_materials}
          />
          <IngredientExplain productId={id} />
        </section>
      )}

      {/* prev/next는 Suspense로 분리 — 메인 콘텐츠 렌더링을 블로킹하지 않음 */}
      <Suspense>
        <ProductNavigationLoader productName={product.name} />
      </Suspense>
    </div>
  )
}

/** 이전/다음 제품을 별도로 로드하는 async 서버 컴포넌트 */
async function ProductNavigationLoader({ productName }: { productName: string }) {
  const supabase = await createClient()

  const [{ data: prevProducts }, { data: nextProducts }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name')
      .lt('name', productName)
      .order('name', { ascending: false })
      .limit(1),
    supabase
      .from('products')
      .select('id, name')
      .gt('name', productName)
      .order('name', { ascending: true })
      .limit(1),
  ])

  return (
    <ProductNavigation
      prev={prevProducts?.[0] ?? null}
      next={nextProducts?.[0] ?? null}
    />
  )
}
