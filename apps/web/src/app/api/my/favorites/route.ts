import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    const productId = request.nextUrl.searchParams.get('product_id')
    if (productId) {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()
      return NextResponse.json({ favorited: !!data })
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select(
        `
        *,
        product:products(id, name, company, functionality_tags)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { product_id } = body

    if (!product_id || !isValidUUID(product_id)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효한 제품 ID가 필요합니다.',
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        product_id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            error: {
              code: 'FAVORITE_DUPLICATE',
              message: '이미 즐겨찾기에 추가된 제품입니다.',
              status: 409,
            },
          },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
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
