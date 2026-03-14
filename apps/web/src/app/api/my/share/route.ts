import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { SupplementShareData, CompareShareData } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', status: 401 } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, data: clientData } = body as {
      type: 'supplements' | 'compare'
      data?: CompareShareData
    }

    if (!type || !['supplements', 'compare'].includes(type)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'type은 supplements 또는 compare여야 합니다.', status: 400 } },
        { status: 400 }
      )
    }

    let snapshotData: SupplementShareData | CompareShareData

    if (type === 'supplements') {
      // Fetch user's supplement data for snapshot
      const { data: supplements, error } = await supabase
        .from('user_supplements')
        .select(
          `
          daily_dose,
          product:products(
            name,
            company,
            product_ingredients(
              ingredient:ingredients(canonical_name)
            )
          )
        `
        )
        .eq('user_id', user.id)

      if (error) throw error

      if (!supplements || supplements.length === 0) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '공유할 영양제가 없습니다.', status: 400 } },
          { status: 400 }
        )
      }

      const supplementList = supplements.map((supp) => {
        const product = supp.product as unknown as Record<string, unknown> | null
        const productIngredients = product
          ? (product.product_ingredients as Array<Record<string, unknown>>) || []
          : []

        return {
          product_name: (product?.name as string) || '',
          company: (product?.company as string) || '',
          daily_dose: supp.daily_dose,
          ingredients: productIngredients
            .map((pi) => {
              const ing = pi.ingredient as unknown as Record<string, unknown> | null
              return (ing?.canonical_name as string) || ''
            })
            .filter(Boolean),
        }
      })

      snapshotData = {
        supplements: supplementList,
        shared_at: new Date().toISOString().split('T')[0],
      } satisfies SupplementShareData
    } else {
      // Compare type: client sends the data — validate structure and size
      if (!clientData || !Array.isArray(clientData.products) || !Array.isArray(clientData.comparison_table)) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '비교 데이터가 필요합니다.', status: 400 } },
          { status: 400 }
        )
      }
      if (clientData.products.length > 4 || clientData.comparison_table.length > 200) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '비교 데이터가 허용 범위를 초과합니다.', status: 400 } },
          { status: 400 }
        )
      }
      snapshotData = clientData
    }

    // Insert snapshot
    const { data: snapshot, error: insertError } = await supabase
      .from('share_snapshots')
      .insert({
        user_id: user.id,
        type,
        data: snapshotData,
      })
      .select('id, expires_at')
      .single()

    if (insertError) throw insertError

    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://pillog.app'
    const shareUrl = `${baseUrl}/share/${snapshot.id}`

    return NextResponse.json(
      {
        token: snapshot.id,
        url: shareUrl,
        expires_at: snapshot.expires_at,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
