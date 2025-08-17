import { test, expect } from '@playwright/test';

test.describe('원격 Supabase 연결 상태 확인', () => {
  test('REST API 연결 테스트', async ({ page }) => {
    try {
      // REST API로 employees 테이블 접근 테스트
      const response = await page.request.get('https://cgscbtxtgualkfalouwh.supabase.co/rest/v1/employees?select=*&limit=1', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
        }
      });
      
      console.log('REST API 응답 상태:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ REST API 연결 성공');
        console.log('employees 테이블 데이터:', data);
        
        // 관리자 계정 찾기
        const adminUser = data.find((user: any) => user.phone === '010-6669-9000');
        if (adminUser) {
          console.log('✅ 관리자 계정 발견:', adminUser);
        } else {
          console.log('❌ 관리자 계정을 찾을 수 없음');
        }
      } else {
        console.log('❌ REST API 연결 실패:', response.status());
        const errorText = await response.text();
        console.log('에러 내용:', errorText);
      }
    } catch (error) {
      console.log('❌ REST API 테스트 실패:', error);
    }
  });

  test('로그인 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // 브라우저 콘솔 로그 캡처
    page.on('console', msg => {
      console.log('브라우저 콘솔:', msg.text());
    });
    
    // 로그인 정보 입력
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 로그인 결과 확인
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('로그인 후 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 관리자 로그인 성공!');
      
      // 대시보드 요소들 확인
      await expect(page.locator('text=직원 대시보드')).toBeVisible();
      await expect(page.locator('text=시스템 관리자')).toBeVisible();
      
      console.log('✅ 대시보드 접근 성공');
    } else {
      const errorText = await page.locator('text=전화번호를 찾을 수 없습니다').count();
      if (errorText > 0) {
        console.log('❌ 여전히 로그인 실패: 전화번호를 찾을 수 없습니다');
      } else {
        console.log('❌ 로그인 실패: 다른 오류');
      }
    }
  });
});
