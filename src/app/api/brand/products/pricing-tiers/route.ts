import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 수량별 가격 티어 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const isCurrent = searchParams.get('is_current');

    let query = supabase
      .from('product_pricing_tiers')
      .select(`
        *,
        product:products(name, code)
      `)
      .order('quantity', { ascending: true });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (isCurrent !== null) {
      query = query.eq('is_current', isCurrent === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('가격 티어 조회 오류:', error);
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

// POST - 가격 티어 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.product_id || !body.quantity || !body.product_price_per_unit || !body.cost_per_unit) {
      return NextResponse.json(
        { success: false, error: '제품 ID, 수량, 상품가/개, 원가/개는 필수입니다.' },
        { status: 400 }
      );
    }

    // 같은 제품의 다른 수량의 is_current를 false로 변경 (현재 수량이 하나만 되도록)
    if (body.is_current) {
      await supabase
        .from('product_pricing_tiers')
        .update({ is_current: false })
        .eq('product_id', body.product_id)
        .eq('is_current', true);
    }

    const { data, error } = await supabase
      .from('product_pricing_tiers')
      .insert({
        product_id: body.product_id,
        quantity: body.quantity,
        product_price_per_unit: body.product_price_per_unit,
        embroidery_price_per_unit: body.embroidery_price_per_unit || 0,
        cost_per_unit: body.cost_per_unit,
        margin_rate: body.margin_rate || 0,
        is_current: body.is_current || false
      })
      .select(`
        *,
        product:products(name, code)
      `)
      .single();

    if (error) {
      console.error('가격 티어 추가 실패:', error);
      // 중복 수량 에러 처리
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 수량입니다.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: '가격 티어 추가에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('가격 티어 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 가격 티어 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '가격 티어 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // is_current를 true로 변경하는 경우, 같은 제품의 다른 티어는 false로 변경
    if (updates.is_current === true) {
      const { data: tier } = await supabase
        .from('product_pricing_tiers')
        .select('product_id')
        .eq('id', id)
        .single();

      if (tier) {
        await supabase
          .from('product_pricing_tiers')
          .update({ is_current: false })
          .eq('product_id', tier.product_id)
          .eq('is_current', true)
          .neq('id', id);
      }
    }

    const { data, error } = await supabase
      .from('product_pricing_tiers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        product:products(name, code)
      `)
      .single();

    if (error) {
      console.error('가격 티어 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: '가격 티어 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('가격 티어 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE - 가격 티어 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '가격 티어 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_pricing_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('가격 티어 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: '가격 티어 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '가격 티어가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('가격 티어 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}






