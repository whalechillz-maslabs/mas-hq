import { test, expect } from '@playwright/test';

test.describe('로그인 문제 진단', () => {
  test('환경변수 확인', async ({ page }) => {
    // 환경변수가 제대로 로드되는지 확인
    await page.goto('/');
    
    // 브라우저 콘솔에서 환경변수 확인
    const envCheck = await page.evaluate(() => {
      return {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      };
    });
    
    console.log('환경변수 확인:', envCheck);
    
    // 페이지 콘솔 로그 확인
    page.on('console', msg => {
      console.log('브라우저 콘솔:', msg.text());
    });
  });

  test('로그인 과정 상세 진단', async ({ page }) => {
    await page.goto('/login');
    
    // 브라우저 콘솔 로그 캡처
    page.on('console', msg => {
      console.log('브라우저 콘솔:', msg.text());
    });
    
    // 네트워크 요청 모니터링
    page.on('request', request => {
      console.log('요청:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('응답:', response.status(), response.url());
    });
    
    // 로그인 정보 입력
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    
    console.log('로그인 정보 입력 완료');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    console.log('로그인 버튼 클릭 완료');
    
    // 5초 대기
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    console.log('페이지 내용 길이:', pageContent.length);
    
    // 에러 메시지 확인
    const errorElements = await page.locator('text=전화번호를 찾을 수 없습니다').count();
    console.log('에러 메시지 개수:', errorElements);
    
    if (errorElements > 0) {
      console.log('❌ 여전히 "전화번호를 찾을 수 없습니다" 에러 발생');
      console.log('원격 Supabase 연결에 문제가 있을 수 있습니다.');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'debug-login-issue.png' });
  });

  test('원격 Supabase 직접 연결 테스트', async ({ page }) => {
    try {
      // 원격 Supabase GraphQL 엔드포인트 직접 테스트
      const response = await page.request.post('https://cgscbtxtgualkfalouwh.supabase.co/graphql/v1', {
        data: { 
          query: `
            query {
              employees(where: {phone: {_eq: "010-6669-9000"}}) {
                id
                employee_id
                name
                phone
                status
              }
            }
          `
        },
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
        }
      });
      
      console.log('GraphQL 응답 상태:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('GraphQL 응답 데이터:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data.employees && data.data.employees.length > 0) {
          console.log('✅ 관리자 계정이 원격 Supabase에 존재함');
          console.log('관리자 정보:', data.data.employees[0]);
        } else {
          console.log('❌ 관리자 계정이 원격 Supabase에 없음');
        }
      } else {
        console.log('❌ GraphQL 요청 실패:', response.status());
      }
    } catch (error) {
      console.log('❌ GraphQL 테스트 실패:', error);
    }
  });
});
