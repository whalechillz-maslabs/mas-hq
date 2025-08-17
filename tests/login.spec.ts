import { test, expect } from '@playwright/test';

test.describe('MASLABS 로그인 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login');
  });

  test('관리자 로그인 테스트', async ({ page }) => {
    // 전화번호 입력
    await page.fill('input[type="tel"]', '010-6669-9000');
    
    // 비밀번호 입력 (admin123)
    await page.fill('input[type="password"]', 'admin123');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 잠시 대기 (리다이렉트 시간 고려)
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    console.log('페이지 제목:', await page.title());
    
    // 에러 메시지 확인
    const errorElements = await page.locator('text=전화번호를 찾을 수 없습니다').count();
    if (errorElements > 0) {
      console.log('❌ 전화번호를 찾을 수 없습니다 에러 발생');
      
      // 데이터베이스에서 관리자 정보 확인
      console.log('데이터베이스에서 관리자 정보를 확인해주세요:');
      console.log('docker exec -it supabase_db_www.maslabs.kr psql -U postgres -d postgres -c "SELECT employee_id, name, phone FROM employees WHERE phone = \'010-6669-9000\';"');
    }
    
    // 대시보드로 리다이렉트되었는지 확인
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 대시보드로 성공적으로 리다이렉트됨');
      
      // 관리자 정보 확인
      const adminName = await page.locator('text=시스템 관리자').count();
      if (adminName > 0) {
        console.log('✅ 관리자 정보 표시됨');
      }
    } else {
      console.log('❌ 대시보드로 리다이렉트되지 않음');
    }
  });

  test('관리자 로그인 후 대시보드 확인', async ({ page }) => {
    // 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForTimeout(3000);
    
    // 대시보드 요소들 확인
    await expect(page.locator('text=직원 대시보드')).toBeVisible();
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    
    // 대시보드 메뉴 확인
    await expect(page.locator('text=오늘의 미션')).toBeVisible();
    await expect(page.locator('text=근무 상태')).toBeVisible();
    await expect(page.locator('text=오늘의 매출')).toBeVisible();
    
    console.log('✅ 관리자 대시보드 모든 요소 확인됨');
  });

  test('잘못된 전화번호 로그인 테스트', async ({ page }) => {
    // 잘못된 전화번호 입력
    await page.fill('input[type="tel"]', '010-9999-9999');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=전화번호를 찾을 수 없습니다')).toBeVisible();
  });

  test('로그인 페이지 UI 확인', async ({ page }) => {
    // MASLABS 로고 확인 (정확한 선택자 사용)
    await expect(page.locator('h1:has-text("MASLABS")')).toBeVisible();
    
    // 직원 로그인 제목 확인
    await expect(page.locator('text=직원 로그인')).toBeVisible();
    
    // 전화번호 입력 필드 확인
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    
    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 로그인 버튼 확인
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
