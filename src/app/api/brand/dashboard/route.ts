import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 전체 주문 통계
    const { data: allOrders, error: ordersError } = await supabase
      .from('brand_orders')
      .select(`
        *,
        brand:brands(name, code)
      `);

    if (ordersError) {
      console.error('주문 데이터 로드 실패:', ordersError);
      return NextResponse.json({ error: '데이터 로드 실패' }, { status: 500 });
    }

    // 통계 계산
    // 총 주문 건수: 제품 수량 합계 (원본 HTML과 동일하게)
    const totalOrders = allOrders?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
    const totalProductPrice = allOrders?.reduce((sum, order) => sum + (order.product_price || 0), 0) || 0;
    const totalEmbroideryFee = allOrders?.reduce((sum, order) => sum + (order.embroidery_fee || 0), 0) || 0;
    const totalFinalAmount = allOrders?.reduce((sum, order) => sum + (order.final_amount || 0), 0) || 0;

    // 완료된 주문
    const completedOrders = allOrders?.filter(order => order.status === 'completed') || [];
    
    // 진행 중인 주문
    const inProgressOrders = allOrders?.filter(order => 
      order.status === 'preparing' || order.status === 'in_progress'
    ) || [];

    // 브랜드별 통계
    const brandStats = new Map();
    allOrders?.forEach(order => {
      const brandCode = order.brand?.code || 'unknown';
      const brandName = order.brand?.name || '알 수 없음';
      
      if (!brandStats.has(brandCode)) {
        brandStats.set(brandCode, {
          name: brandName,
          code: brandCode,
          totalOrders: 0,
          totalAmount: 0,
          completedOrders: 0,
          inProgressOrders: 0
        });
      }

      const stats = brandStats.get(brandCode);
      stats.totalOrders += 1;
      stats.totalAmount += order.final_amount || 0;
      
      if (order.status === 'completed') {
        stats.completedOrders += 1;
      } else if (order.status === 'preparing' || order.status === 'in_progress') {
        stats.inProgressOrders += 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalProductPrice,
          totalEmbroideryFee,
          totalFinalAmount
        },
        orders: {
          completed: completedOrders.length,
          inProgress: inProgressOrders.length,
          total: totalOrders
        },
        brandStats: Array.from(brandStats.values()),
        recentOrders: allOrders
          ?.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
          .slice(0, 10) || []
      }
    });

  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error);
    return NextResponse.json(
      { error: '대시보드 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

