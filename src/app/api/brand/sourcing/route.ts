import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // ball-caps, bucket-hats, pouches, t-shirts, sweatshirts

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

    // 상품소싱 데이터 조회
    let query = supabase
      .from('product_sourcing')
      .select(`
        *,
        supplier:suppliers!product_sourcing_supplier_id_fkey(id, name, code, website_url),
        category:product_categories!product_sourcing_product_category_id_fkey(id, name, code)
      `)
      .eq('is_active', true)
      .order('recommendation_score', { ascending: false });

    // 카테고리 필터링
    if (categoryId) {
      query = query.eq('product_category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('상품소싱 데이터 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '데이터 로드 실패' },
        { status: 500 }
      );
    }

    // 카테고리가 지정된 경우 해당 카테고리 데이터만 반환
    // 카테고리가 지정되지 않은 경우 카테고리별로 그룹화하여 반환
    if (category) {
      // 특정 카테고리만 요청한 경우
      return NextResponse.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    } else {
      // 모든 카테고리 요청한 경우 그룹화
      const groupedByCategory: { [key: string]: any[] } = {};
      
      if (data) {
        for (const item of data) {
          const categoryCode = item.category?.code || 'unknown';
          if (!groupedByCategory[categoryCode]) {
            groupedByCategory[categoryCode] = [];
          }
          groupedByCategory[categoryCode].push(item);
        }
      }

      return NextResponse.json({
        success: true,
        data: groupedByCategory,
        count: data?.length || 0
      });
    }
  } catch (error) {
    console.error('상품소싱 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}

