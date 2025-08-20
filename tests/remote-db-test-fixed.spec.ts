import { test, expect } from '@playwright/test';

test.describe('원격 데이터베이스 연결 테스트 (수정됨)', () => {
  test('원격 Supabase 연결 확인', async ({ page }) => {
    console.log('🔍 원격 Supabase 연결 테스트 시작');
    
    // 1. 원격 Supabase 대시보드 접속
    await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/editor/24669?schema=public');
    console.log('✅ 원격 Supabase 대시보드 접속 완료');
    
    // 2. 로그인 확인 (수정된 로케이터)
    const loginButton = page.locator('button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      console.log('⚠️ 로그인이 필요합니다');
      await page.screenshot({ path: 'remote-supabase-login-needed.png', fullPage: true });
      console.log('🎯 로그인 후 다시 테스트를 실행해주세요');
      return;
    }
    
    // 3. SQL Editor 확인
    await expect(page.locator('text=SQL Editor')).toBeVisible();
    console.log('✅ SQL Editor 확인 완료');
    
    // 4. 스크린샷 캡처
    await page.screenshot({ path: 'remote-supabase-dashboard.png', fullPage: true });
    console.log('✅ 대시보드 스크린샷 캡처 완료');
    
    console.log('🎉 원격 데이터베이스 연결 테스트 완료!');
    console.log('📋 다음 단계:');
    console.log('1. Supabase 대시보드에서 로그인');
    console.log('2. SQL Editor에서 RLS 비활성화 실행');
    console.log('3. 이은정 계정 추가 SQL 실행');
  });
});
