import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');
    const orderId = searchParams.get('order_id');

    // order_number 또는 order_id 중 하나는 필수
    if (!orderNumber && !orderId) {
      return NextResponse.json(
        { success: false, error: 'order_number 또는 order_id 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    let orderIdToUse: string | null = null;

    // order_number가 제공된 경우 주문 ID 찾기
    if (orderNumber) {
      const { data: order, error: orderError } = await supabase
        .from('brand_orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { success: false, error: '주문을 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      orderIdToUse = order.id;
    } else {
      orderIdToUse = orderId!;
    }

    // 진행사항 조회
    const { data: progressHistory, error } = await supabase
      .from('order_progress_history')
      .select(`
        *,
        product:products(name, code)
      `)
      .eq('order_id', orderIdToUse)
      .order('progress_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('진행사항 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '데이터 로드 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: progressHistory || []
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}

// POST - 진행사항 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.order_id || !body.status || !body.progress_date) {
      return NextResponse.json(
        { success: false, error: '주문 ID, 상태, 진행일은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('order_progress_history')
      .insert({
        order_id: body.order_id,
        status: body.status,
        status_description: body.status_description || '',
        progress_date: body.progress_date,
        cost_at_stage: body.cost_at_stage || 0,
        cost_breakdown: body.cost_breakdown || {},
        notes: body.notes || null
      })
      .select(`
        *,
        product:products(name, code)
      `)
      .single();

    if (error) {
      console.error('진행사항 추가 실패:', error);
      return NextResponse.json(
        { success: false, error: '진행사항 추가에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('진행사항 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 진행사항 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '진행사항 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('order_progress_history')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        product:products(name, code)
      `)
      .single();

    if (error) {
      console.error('진행사항 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: '진행사항 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('진행사항 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}






