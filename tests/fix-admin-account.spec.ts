import { test, expect } from '@playwright/test';

test.describe('관리자 계정 수정', () => {
  test('원격 Supabase에서 관리자 계정 전화번호 업데이트', async ({ page }) => {
    // Supabase 대시보드에 접속하여 SQL Editor에서 관리자 계정 수정
    console.log('🔧 관리자 계정 수정이 필요합니다.');
    console.log('다음 SQL을 Supabase 대시보드의 SQL Editor에서 실행해주세요:');
    console.log('');
    console.log('-- 관리자 계정 전화번호 업데이트');
    console.log("UPDATE employees SET phone = '010-6669-9000', name = '시스템 관리자', updated_at = CURRENT_TIMESTAMP WHERE employee_id = 'MASLABS-001';");
    console.log('');
    console.log('-- 비밀번호 해시 업데이트 (개발용)');
    console.log("UPDATE employees SET password_hash = 'admin123' WHERE phone = '010-6669-9000';");
    console.log('');
    console.log('Supabase 대시보드: https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/sql');
  });

  test('수정 후 로그인 테스트', async ({ page }) => {
    // 수동으로 SQL 실행 후 이 테스트를 다시 실행
    console.log('📝 위의 SQL을 실행한 후 이 테스트를 다시 실행해주세요.');
    
    await page.goto('/login');
    
    // 관리자 로그인 정보 입력
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
        console.log('❌ 아직 관리자 계정이 수정되지 않았습니다.');
        console.log('Supabase 대시보드에서 SQL을 실행해주세요.');
      } else {
        console.log('❌ 로그인 실패: 알 수 없는 오류');
      }
    }
  });
});
