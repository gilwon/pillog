import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !ingredient) {
      return NextResponse.json(
        {
          error: {
            code: 'INGREDIENT_NOT_FOUND',
            message: '요청한 성분을 찾을 수 없습니다.',
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Fetch aliases
    const { data: aliases } = await supabase
      .from('ingredient_aliases')
      .select('alias_name, alias_type')
      .eq('ingredient_id', id)

    return NextResponse.json({
      ...ingredient,
      aliases: aliases || [],
    })
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
