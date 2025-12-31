import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // ball-caps, bucket-hats, pouches, t-shirts, sweatshirts
    const code = searchParams.get('code'); // basic-cap, daily-over-bucket-hat, etc.

    // 제품 데이터 조회
    let query = supabase
      .from('products')
      .select(`
        *,
        brand:brands!products_brand_id_fkey(id, name, code),
        category:product_categories!products_category_id_fkey(id, name, code)
      `)
      .eq('is_active', true);

    // 카테고리 필터링을 위한 카테고리 ID 조회
    let categoryId = null;
    if (category) {
      const { data: categoryData } = await supabase
        .from('product_categories')
        .select('id')
        .eq('code', category)
        .single();
      
      if (categoryData) {
        categoryId = categoryData.id;
      }
    }

    // 필터링
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (code) {
      query = query.eq('code', code);
    }

    const { data, error } = await query;

    if (error) {
      console.error('제품 데이터 조회 오류:', error);
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
    console.error('제품 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}

