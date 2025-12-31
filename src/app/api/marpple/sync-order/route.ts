import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - 마플 주문 동기화 (수동 동기화 또는 API 연동)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: '주문번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 방법 1: 마플 API 연동 (API 키가 있는 경우)
    if (process.env.MARPLE_API_KEY) {
      try {
        const marppleResponse = await fetch(
          `https://api.marpple.com/kr/orders/${orderNumber}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.MARPLE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!marppleResponse.ok) {
          throw new Error('마플 API 호출 실패');
        }

        const marppleData = await marppleResponse.json();
        
        // 마플 데이터를 우리 스키마에 맞게 변환
        const orderData = transformMarppleData(marppleData);
        
        // 데이터베이스에 저장/업데이트
        const { data, error } = await supabase
          .from('brand_orders')
          .upsert(orderData, {
            onConflict: 'order_number',
            ignoreDuplicates: false
          })
          .select(`
            *,
            brand:brands(id, name, code, description),
            product:products(id, name, code)
          `)
          .single();

        if (error) {
          console.error('주문 저장 실패:', error);
          return NextResponse.json(
            { success: false, error: '주문 저장에 실패했습니다.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data,
          source: 'marpple_api'
        });

      } catch (apiError) {
        console.error('마플 API 연동 실패:', apiError);
        // API 실패 시 수동 입력으로 폴백
      }
    }

    // 방법 2: 수동 동기화 (주문번호만으로 기존 데이터 업데이트)
    // 주문번호로 기존 주문을 찾아서 마플 동기화 시간만 업데이트
    const { data: existingOrder, error: findError } = await supabase
      .from('brand_orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (findError || !existingOrder) {
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다. 먼저 주문을 생성해주세요.' },
        { status: 404 }
      );
    }

    // 마플 동기화 시간만 업데이트
    const { data, error } = await supabase
      .from('brand_orders')
      .update({
        marpple_synced_at: new Date().toISOString()
      })
      .eq('id', existingOrder.id)
      .select(`
        *,
        brand:brands(id, name, code, description),
        product:products(id, name, code)
      `)
      .single();

    if (error) {
      console.error('동기화 시간 업데이트 실패:', error);
      return NextResponse.json(
        { success: false, error: '동기화 시간 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'manual_sync',
      message: '동기화 시간이 업데이트되었습니다. 실제 주문 정보는 수동으로 입력해주세요.'
    });

  } catch (error) {
    console.error('마플 동기화 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 마플 API 데이터를 우리 스키마에 맞게 변환
function transformMarppleData(marppleData: any) {
  // 마플 API 응답 구조에 맞게 수정 필요
  return {
    order_number: marppleData.order_number || marppleData.orderNumber,
    brand_id: marppleData.brand_id || null, // 브랜드 매핑 필요
    product_id: marppleData.product_id || null, // 제품 매핑 필요
    order_date: marppleData.order_date || marppleData.orderDate,
    delivery_date: marppleData.delivery_date || marppleData.deliveryDate,
    delivery_completed_at: marppleData.delivery_completed_at || marppleData.deliveryCompletedAt,
    status: mapMarppleStatus(marppleData.status),
    quantity: marppleData.quantity || 0,
    product_price: marppleData.product_price || marppleData.productPrice || 0,
    embroidery_fee: marppleData.embroidery_fee || marppleData.embroideryFee || 0,
    total_amount: marppleData.total_amount || marppleData.totalAmount || 0,
    final_amount: marppleData.final_amount || marppleData.finalAmount || 0,
    order_details: marppleData.order_details || marppleData.orderDetails || {},
    tracking_number: marppleData.tracking_number || marppleData.trackingNumber || null,
    notes: marppleData.notes || null,
    marpple_synced_at: new Date().toISOString()
  };
}

// 마플 상태를 우리 시스템 상태로 매핑
function mapMarppleStatus(marppleStatus: string): string {
  const statusMap: { [key: string]: string } = {
    '결제완료': 'preparing',
    '제작중': 'in_progress',
    '배송중': 'in_progress',
    '배송완료': 'completed',
    '취소': 'cancelled',
    '환불': 'cancelled'
  };

  return statusMap[marppleStatus] || 'preparing';
}






