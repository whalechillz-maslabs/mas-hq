import { test, expect } from '@playwright/test';

test.describe('관리자 접근 권한 디버깅', () => {
  
  test('관리자 로그인 후 직원별 스케줄 관리 페이지 접근 테스트', async ({ page }) => {
    console.log('=== 관리자 접근 권한 디버깅 테스트 시작 ===');
    
    // 1. 관리자 로그인
    await page.goto('http://localhost:3001/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    
    console.log('관리자 로그인 성공');
    
    // 2. 직원별 스케줄 관리 페이지로 직접 이동
    await page.goto('http://localhost:3001/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    // 3. 페이지 내용 확인
    const pageContent = await page.content();
    console.log('페이지 제목:', await page.title());
    
    // 4. 콘솔 로그 확인
    const consoleMessages = await page.evaluate(() => {
      return window.console.logs || [];
    });
    console.log('콘솔 메시지:', consoleMessages);
    
    // 5. 페이지가 정상적으로 로드되었는지 확인
    try {
      await expect(page.locator('h1:has-text("직원별 스케줄 관리")')).toBeVisible({ timeout: 5000 });
      console.log('✅ 직원별 스케줄 관리 페이지 접근 성공');
    } catch (error) {
      console.log('❌ 직원별 스케줄 관리 페이지 접근 실패');
      console.log('현재 URL:', page.url());
      console.log('페이지 내용 일부:', pageContent.substring(0, 500));
    }
  });

  test('관리자 권한 정보 확인', async ({ page }) => {
    console.log('=== 관리자 권한 정보 확인 테스트 ===');
    
    // 1. 관리자 로그인
    await page.goto('http://localhost:3001/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // 2. 브라우저 콘솔에서 사용자 정보 확인
    const userInfo = await page.evaluate(() => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
        return JSON.parse(employeeData);
      }
      return null;
    });
    
    console.log('로컬스토리지 사용자 정보:', userInfo);
    
    if (userInfo) {
      console.log('사용자 역할 정보:');
      console.log('- role_id:', userInfo.role_id);
      console.log('- role.name:', userInfo.role?.name);
      console.log('- role:', userInfo.role);
    }
  });
});



