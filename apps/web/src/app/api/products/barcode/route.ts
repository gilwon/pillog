import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { escapeLike } from '@/lib/utils/escape-like'

const DISCLAIMER = '이 정보는 식약처 공공데이터를 기반으로 하며, 의학적 조언이 아닙니다.'

/**
 * GET /api/products/barcode?code={barcode}
 *
 * 바코드 값으로 제품을 조회합니다 (모바일 expo-camera 연동).
 * 식약처 report_no(품목제조번호) 또는 barcode_no 컬럼과 매칭.
 * 제품이 없으면 404를 반환하고 클라이언트가 수동 검색으로 폴백합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '바코드 값을 입력해주세요.',
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const barcodeValue = code.trim()

    // 1차: report_no 직접 매칭 (식약처 품목제조번호)
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, company, functionality_tags, shape, report_no, is_active')
      .eq('report_no', barcodeValue)
      .eq('is_active', true)
      .single()

    if (!error && product) {
      return NextResponse.json({
        id: product.id,
        name: product.name,
        company: product.company,
        functionality_tags: product.functionality_tags,
        shape: product.shape,
        report_no: product.report_no,
        disclaimer: DISCLAIMER,
      })
    }

    // 2차: 이름 검색으로 폴백 (바코드 앞 4자리로 유사 제품 제안)
    if (barcodeValue.length >= 4) {
      const prefix = barcodeValue.slice(0, 4)
      const { data: suggestions } = await supabase
        .from('products')
        .select('id, name, company, functionality_tags, shape')
        .eq('is_active', true)
        .ilike('name', `%${escapeLike(prefix)}%`)
        .limit(5)

      if (suggestions && suggestions.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: '해당 바코드의 제품을 찾을 수 없습니다. 유사 제품을 확인해보세요.',
              status: 404,
            },
            suggestions,
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '해당 바코드의 제품을 찾을 수 없습니다.',
          status: 404,
        },
      },
      { status: 404 }
    )
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
