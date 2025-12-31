import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - 마플 주문 웹 스크래핑 (Playwright 사용)
// 주의: 이 기능은 마플 API가 없을 때 사용하는 대안입니다.
// 실제 사용 시 Playwright 설치 필요: npm install playwright
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

    // Playwright 동적 import (필요할 때만 로드)
    let browser: any;
    try {
      const { chromium } = await import('playwright');
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      // 마플 주문 상세 페이지 접속
      await page.goto(`https://www.marpple.com/kr/order/detail/${orderNumber}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // 로그인 필요 시 처리 (환경 변수에서 자격증명 가져오기)
      if (process.env.MARPLE_EMAIL && process.env.MARPLE_PASSWORD) {
        const loginButton = await page.$('text=로그인');
        if (loginButton) {
          await loginButton.click();
          await page.fill('input[name="email"]', process.env.MARPLE_EMAIL);
          await page.fill('input[name="password"]', process.env.MARPLE_PASSWORD);
          await page.click('button[type="submit"]');
          await page.waitForNavigation({ waitUntil: 'networkidle' });
        }
      }

      // 데이터 추출 (실제 마플 페이지 구조에 맞게 수정 필요)
      const orderData = {
        order_number: orderNumber,
        order_date: await extractText(page, '.order-date') || null,
        delivery_date: await extractText(page, '.delivery-date') || null,
        delivery_completed_at: await extractText(page, '.delivery-completed-date') || null,
        status: await extractText(page, '.order-status') || 'preparing',
        tracking_number: await extractText(page, '.tracking-number') || null,
        product_price: await extractPrice(page, '.product-price') || 0,
        embroidery_fee: await extractPrice(page, '.embroidery-fee') || 0,
        total_amount: await extractPrice(page, '.total-amount') || 0,
        final_amount: await extractPrice(page, '.final-amount') || 0,
        quantity: await extractNumber(page, '.quantity') || 0,
        order_details: await extractOrderDetails(page) || {}
      };

      await browser.close();

      // 데이터베이스에 저장/업데이트
      const { data, error } = await supabase
        .from('brand_orders')
        .upsert({
          ...orderData,
          status: mapMarppleStatus(orderData.status),
          marpple_synced_at: new Date().toISOString()
        }, {
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
        source: 'web_scraping'
      });

    } catch (scrapingError: any) {
      if (browser) {
        await browser.close();
      }
      
      // Playwright가 설치되지 않은 경우
      if (scrapingError.message?.includes('Cannot find module')) {
        return NextResponse.json(
          { 
            success: false, 
            error: '웹 스크래핑 기능을 사용하려면 Playwright가 필요합니다. npm install playwright 실행 후 playwright install chromium을 실행해주세요.' 
          },
          { status: 503 }
        );
      }

      throw scrapingError;
    }

  } catch (error: any) {
    console.error('마플 스크래핑 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 헬퍼 함수들
async function extractText(page: any, selector: string): Promise<string | null> {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    return await element.textContent();
  } catch {
    return null;
  }
}

async function extractPrice(page: any, selector: string): Promise<number> {
  try {
    const text = await extractText(page, selector);
    if (!text) return 0;
    // "₩123,456" 또는 "123,456원" 형식에서 숫자만 추출
    const numbers = text.replace(/[^\d]/g, '');
    return parseInt(numbers) || 0;
  } catch {
    return 0;
  }
}

async function extractNumber(page: any, selector: string): Promise<number> {
  try {
    const text = await extractText(page, selector);
    if (!text) return 0;
    const numbers = text.replace(/[^\d]/g, '');
    return parseInt(numbers) || 0;
  } catch {
    return 0;
  }
}

async function extractOrderDetails(page: any): Promise<any> {
  try {
    // 주문 상세 정보 추출 (실제 페이지 구조에 맞게 수정 필요)
    return {
      product_name: await extractText(page, '.product-name') || '',
      colors: await extractColors(page),
      // ... 기타 필드
    };
  } catch {
    return {};
  }
}

async function extractColors(page: any): Promise<any> {
  try {
    // 색상 정보 추출 (실제 페이지 구조에 맞게 수정 필요)
    return {};
  } catch {
    return {};
  }
}

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






