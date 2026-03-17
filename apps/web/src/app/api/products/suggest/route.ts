import { searchWithMeilisearch } from '@/lib/meilisearch/search'
import { createClient } from '@/lib/supabase/server'
import { escapeLike } from '@/lib/utils/escape-like'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q')?.trim()

  if (!q || q.length < 1) {
    return NextResponse.json([])
  }

  try {
    // Meilisearch 우선
    const result = await searchWithMeilisearch({
      query: q,
      limit: 6,
      offset: 0,
    })
    return NextResponse.json(
      result.data.map((p) => ({ id: p.id, name: p.name, company: p.company }))
    )
  } catch {
    // pg_trgm fallback
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, company')
      .eq('is_active', true)
      .ilike('name', `%${escapeLike(q)}%`)
      .limit(6)

    return NextResponse.json(
      (data || []).map((p) => ({ id: p.id, name: p.name, company: p.company }))
    )
  }
}
