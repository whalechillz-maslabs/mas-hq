import { test, expect } from '@playwright/test';

test.describe('Supabase 데이터베이스 상태 확인', () => {
  test('Supabase 대시보드 접속 및 데이터 확인', async ({ page }) => {
    console.log('🔍 Supabase 대시보드 접속 시작');
    
    // Supabase 대시보드로 이동
    await page.goto('https://supabase.com/dashboard');
    
    console.log('✅ Supabase 대시보드 접속 완료');
    
    // 로그인 페이지 확인
    const currentUrl = page.url();
    console.log('📄 현재 URL:', currentUrl);
    
    // 페이지 스크린샷
    await page.screenshot({ 
      path: 'test-results/supabase-dashboard.png',
      fullPage: true 
    });
    
    console.log('📋 Supabase 대시보드 접속 완료 - 수동 로그인 필요');
    console.log('🔗 URL: https://supabase.com/dashboard');
    console.log('📧 이메일과 비밀번호로 로그인 후 프로젝트 선택');
    console.log('🗄️ Table Editor에서 employee_tasks 테이블 확인');
    
    // 30초 대기 (수동 확인용)
    await page.waitForTimeout(30000);
  });
});
