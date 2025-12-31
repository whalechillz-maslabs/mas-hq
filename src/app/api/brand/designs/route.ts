import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const brandId = searchParams.get('brand_id');

    // 디자인 데이터 조회
    let query = supabase
      .from('product_designs')
      .select(`
        *,
        product:products!product_designs_product_id_fkey(id, name, code),
        brand:brands!product_designs_brand_id_fkey(id, name, code)
      `)
      .order('created_at', { ascending: false });

    // 필터링
    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('디자인 데이터 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '데이터 로드 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('디자인 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}

