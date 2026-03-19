import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { escapeLike } from '@/lib/utils/escape-like'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q')?.trim() || ''
    const type = searchParams.get('type') || 'products' // products | ingredients

    if (q.length < 1) {
      return NextResponse.json([])
    }

    const escaped = escapeLike(q)

    if (type === 'ingredients') {
      const { data } = await supabase
        .from('ingredients')
        .select('id, canonical_name, category')
        .ilike('canonical_name', `%${escaped}%`)
        .order('canonical_name')
        .limit(8)

      return NextResponse.json(
        (data || []).map((i) => ({
          id: i.id,
          name: i.canonical_name,
          sub: i.category,
        }))
      )
    }

    // products (default)
    const { data } = await supabase
      .from('products')
      .select('id, name, company')
      .or(`name.ilike.%${escaped}%,company.ilike.%${escaped}%,report_no.ilike.%${escaped}%`)
      .eq('is_active', true)
      .order('name')
      .limit(8)

    return NextResponse.json(
      (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        sub: p.company,
      }))
    )
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json([], { status: 500 })
  }
}
