import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('브랜드 데이터 로드 실패:', error);
      return NextResponse.json({ error: '데이터 로드 실패' }, { status: 500 });
    }

    // 브랜드별 주문 통계 추가
    const brandsWithStats = await Promise.all(
      (brands || []).map(async (brand) => {
        const { data: orders } = await supabase
          .from('brand_orders')
          .select('id, final_amount, status')
          .eq('brand_id', brand.id);

        const totalOrders = orders?.length || 0;
        const totalAmount = orders?.reduce((sum, order) => sum + (order.final_amount || 0), 0) || 0;
        const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;

        return {
          ...brand,
          stats: {
            totalOrders,
            totalAmount,
            completedOrders
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: brandsWithStats
    });

  } catch (error) {
    console.error('브랜드 데이터 로드 실패:', error);
    return NextResponse.json(
      { error: '브랜드 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

