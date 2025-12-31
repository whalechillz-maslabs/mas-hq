import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 추가 결제 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const productId = searchParams.get('product_id');
    const paymentType = searchParams.get('payment_type');

    let query = supabase
      .from('order_additional_payments')
      .select(`
        *,
        order:brand_orders(order_number, status),
        product:products(name, code)
      `)
      .order('payment_date', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (paymentType) {
      query = query.eq('payment_type', paymentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('추가 결제 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '데이터 로드 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}

// POST - 추가 결제 등록 (자수비 별도 결제 등)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.order_id || !body.payment_type || !body.payment_amount) {
      return NextResponse.json(
        { success: false, error: '주문 ID, 결제 유형, 결제 금액은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('order_additional_payments')
      .insert({
        order_id: body.order_id,
        product_id: body.product_id || null,
        payment_type: body.payment_type, // 'embroidery', 'custom', 'shipping', 'other'
        payment_amount: body.payment_amount,
        payment_date: body.payment_date ? new Date(body.payment_date).toISOString() : new Date().toISOString(),
        marpple_order_number: body.marpple_order_number || null,
        description: body.description || null
      })
      .select(`
        *,
        order:brand_orders(order_number, status),
        product:products(name, code)
      `)
      .single();

    if (error) {
      console.error('추가 결제 등록 실패:', error);
      return NextResponse.json(
        { success: false, error: '추가 결제 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('추가 결제 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 추가 결제 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '결제 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('order_additional_payments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        order:brand_orders(order_number, status),
        product:products(name, code)
      `)
      .single();

    if (error) {
      console.error('추가 결제 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: '추가 결제 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('추가 결제 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE - 추가 결제 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '결제 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('order_additional_payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('추가 결제 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: '추가 결제 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '추가 결제가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('추가 결제 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}






