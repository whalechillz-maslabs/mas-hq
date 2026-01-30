import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // completed, in_progress, preparing, all
    const brandId = searchParams.get('brand_id');

    let query = supabase
      .from('brand_orders')
      .select(`
        *,
        brand:brands(id, name, code, description),
        product:products(id, name, code)
      `)
      .order('order_date', { ascending: false });

    // 상태 필터
    if (status && status !== 'all') {
      if (status === 'in_progress') {
        query = query.in('status', ['preparing', 'in_progress']);
      } else {
        query = query.eq('status', status);
      }
    }

    // 브랜드 필터
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('주문 데이터 로드 실패:', error);
      return NextResponse.json({ error: '데이터 로드 실패' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: orders || []
    });

  } catch (error) {
    console.error('주문 데이터 로드 실패:', error);
    return NextResponse.json(
      { error: '주문 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST - 주문 생성 (마플 동기화 또는 수동 입력)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.order_number || !body.brand_id || !body.order_date) {
      return NextResponse.json(
        { success: false, error: '주문번호, 브랜드 ID, 주문일은 필수입니다.' },
        { status: 400 }
      );
    }

    // 빈 문자열을 null로 변환하는 헬퍼 함수
    const cleanValue = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return value;
    };

    // 날짜 형식 정리
    const cleanDate = (dateStr: string | null | undefined) => {
      if (!dateStr || dateStr === '') return null;
      // YYYY-MM-DD 형식이면 그대로 사용
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      // ISO 형식이면 날짜 부분만 추출
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };

    const { data, error } = await supabase
      .from('brand_orders')
      .insert({
        order_number: body.order_number,
        brand_id: body.brand_id,
        product_id: cleanValue(body.product_id),
        order_date: cleanDate(body.order_date),
        delivery_date: cleanDate(body.delivery_date),
        delivery_completed_at: body.delivery_completed_at ? new Date(body.delivery_completed_at).toISOString() : null,
        status: body.status || 'preparing',
        quantity: parseInt(String(body.quantity)) || 1,
        product_price: parseInt(String(body.product_price)) || 0,
        embroidery_fee: parseInt(String(body.embroidery_fee)) || 0,
        total_amount: parseInt(String(body.total_amount)) || (parseInt(String(body.product_price)) || 0) + (parseInt(String(body.embroidery_fee)) || 0),
        final_amount: parseInt(String(body.final_amount)) || parseInt(String(body.total_amount)) || (parseInt(String(body.product_price)) || 0) + (parseInt(String(body.embroidery_fee)) || 0),
        order_details: body.order_details || {},
        tracking_number: cleanValue(body.tracking_number),
        notes: cleanValue(body.notes),
        marpple_synced_at: body.marpple_synced_at ? new Date(body.marpple_synced_at).toISOString() : null
      })
      .select(`
        *,
        brand:brands(id, name, code, description),
        product:products(id, name, code)
      `)
      .single();

    if (error) {
      console.error('주문 생성 실패:', error);
      // 중복 주문번호 에러 처리
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 주문번호입니다.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `주문 생성에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('주문 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: `서버 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}

// PUT - 주문 수정 (상태 변경, 배송일 업데이트 등)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '주문 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 빈 문자열을 null로 변환하는 헬퍼 함수
    const cleanValue = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return value;
    };

    // 날짜 형식 정리
    const cleanDate = (dateStr: string | null | undefined) => {
      if (!dateStr || dateStr === '') return null;
      // YYYY-MM-DD 형식이면 그대로 사용
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      // ISO 형식이면 날짜 부분만 추출
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };

    // updated_at 자동 업데이트
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // 빈 문자열을 null로 변환
    if ('product_id' in updateData) {
      updateData.product_id = cleanValue(updateData.product_id);
    }
    if ('delivery_date' in updateData) {
      updateData.delivery_date = cleanDate(updateData.delivery_date);
    }
    if ('tracking_number' in updateData) {
      updateData.tracking_number = cleanValue(updateData.tracking_number);
    }
    if ('notes' in updateData) {
      updateData.notes = cleanValue(updateData.notes);
    }
    if ('order_date' in updateData) {
      updateData.order_date = cleanDate(updateData.order_date);
    }

    // 숫자 필드 정리
    if ('quantity' in updateData) {
      updateData.quantity = parseInt(String(updateData.quantity)) || 1;
    }
    if ('product_price' in updateData) {
      updateData.product_price = parseInt(String(updateData.product_price)) || 0;
    }
    if ('embroidery_fee' in updateData) {
      updateData.embroidery_fee = parseInt(String(updateData.embroidery_fee)) || 0;
    }
    if ('total_amount' in updateData) {
      updateData.total_amount = parseInt(String(updateData.total_amount)) || 0;
    }
    if ('final_amount' in updateData) {
      updateData.final_amount = parseInt(String(updateData.final_amount)) || 0;
    }

    const { data, error } = await supabase
      .from('brand_orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        brand:brands(id, name, code, description),
        product:products(id, name, code)
      `)
      .single();

    if (error) {
      console.error('주문 수정 실패:', error);
      console.error('업데이트 데이터:', updateData);
      return NextResponse.json(
        { success: false, error: `주문 수정에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('주문 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: `서버 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}

// DELETE - 주문 삭제 (soft delete - 상태를 cancelled로 변경)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '주문 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // Soft delete: 상태를 cancelled로 변경
    const { data, error } = await supabase
      .from('brand_orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('주문 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: '주문 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '주문이 취소되었습니다.'
    });

  } catch (error) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}