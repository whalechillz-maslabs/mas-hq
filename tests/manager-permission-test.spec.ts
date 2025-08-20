import { test, expect } from '@playwright/test';

test.describe('이은정 매니저 계정 권한 테스트', () => {
  test('매니저 로그인 및 권한 확인', async ({ page }) => {
    console.log('🔍 이은정 매니저 계정 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 로그인 방법 선택 (전화번호)
    await page.click('text=전화번호');
    console.log('✅ 전화번호 로그인 방법 선택');
    
    // 3. 전화번호 입력 (매니저 계정)
    await page.fill('input[type="tel"]', '010-3243-3099');
    console.log('✅ 매니저 전화번호 입력: 010-3243-3099');
    
    // 4. 비밀번호 입력
    await page.fill('input[type="password"]', '32433099');
    console.log('✅ 매니저 비밀번호 입력: 32433099');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 대시보드 로딩 대기
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 매니저 계정 확인
    await expect(page.locator('text=이은정(STE)')).toBeVisible();
    console.log('✅ 매니저 계정 로그인 확인');
    
    // 8. 매니저 메뉴 확인 (관리자 전용 메뉴는 없어야 함)
    const adminOnlyMenu = page.locator('text=관리자 전용 기능');
    await expect(adminOnlyMenu).not.toBeVisible();
    console.log('✅ 관리자 전용 메뉴 비표시 확인');
    
    // 9. 매니저 + 관리자 메뉴 확인
    await expect(page.locator('text=관리자 + 매니저 기능')).toBeVisible();
    console.log('✅ 매니저 + 관리자 기능 메뉴 표시 확인');
    
    // 10. 팀 관리 기능 확인
    await expect(page.locator('text=팀 관리 기능')).toBeVisible();
    console.log('✅ 팀 관리 기능 메뉴 표시 확인');
    
    // 11. 스크린샷 캡처
    await page.screenshot({ 
      path: 'manager-dashboard-test.png', 
      fullPage: true 
    });
    console.log('✅ 매니저 대시보드 스크린샷 캡처 완료');
    
    console.log('🎉 매니저 계정 권한 테스트 완료!');
  });

  test('매니저 핀번호 로그인 테스트', async ({ page }) => {
    console.log('🔍 매니저 핀번호 로그인 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 로그인 방법 선택 (핀번호)
    await page.click('text=핀번호');
    console.log('✅ 핀번호 로그인 방법 선택');
    
    // 3. 사용자 식별자 입력 (전화번호)
    await page.fill('input[placeholder="전화번호 또는 사번을 입력하세요"]', '010-3243-3099');
    console.log('✅ 매니저 전화번호 입력: 010-3243-3099');
    
    // 4. 핀번호 입력
    await page.fill('input[placeholder="핀번호를 입력하세요"]', '1234');
    console.log('✅ 매니저 핀번호 입력: 1234');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 대시보드 로딩 대기
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 매니저 계정 확인
    await expect(page.locator('text=이은정(STE)')).toBeVisible();
    console.log('✅ 매니저 핀번호 로그인 성공');
    
    // 8. 스크린샷 캡처
    await page.screenshot({ 
      path: 'manager-pin-login-test.png', 
      fullPage: true 
    });
    console.log('✅ 매니저 핀번호 로그인 스크린샷 캡처 완료');
    
    console.log('🎉 매니저 핀번호 로그인 테스트 완료!');
  });

  test('매니저 직원 관리 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 매니저 직원 관리 페이지 접근 테스트 시작');
    
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-3243-3099');
    await page.fill('input[type="password"]', '32433099');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 매니저 로그인 완료');
    
    // 2. 직원 관리 페이지 접근
    await page.click('text=직원 관리');
    console.log('✅ 직원 관리 페이지 접근');
    
    // 3. 페이지 로딩 대기
    await page.waitForURL('**/admin/employee-management');
    console.log('✅ 직원 관리 페이지 로딩 완료');
    
    // 4. 페이지 내용 확인
    await expect(page.locator('text=직원 관리')).toBeVisible();
    console.log('✅ 직원 관리 페이지 내용 확인');
    
    // 5. 직원 목록 확인
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    await expect(page.locator('text=이은정(STE)')).toBeVisible();
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    console.log('✅ 직원 목록 표시 확인');
    
    // 6. 스크린샷 캡처
    await page.screenshot({ 
      path: 'manager-employee-management-test.png', 
      fullPage: true 
    });
    console.log('✅ 매니저 직원 관리 페이지 스크린샷 캡처 완료');
    
    console.log('🎉 매니저 직원 관리 페이지 접근 테스트 완료!');
  });

  test('매니저 vs 관리자 권한 비교 테스트', async ({ page }) => {
    console.log('🔍 매니저 vs 관리자 권한 비교 테스트 시작');
    
    // 1. 매니저로 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-3243-3099');
    await page.fill('input[type="password"]', '32433099');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 매니저 로그인 완료');
    
    // 2. 매니저 메뉴 확인
    await expect(page.locator('text=관리자 + 매니저 기능')).toBeVisible();
    await expect(page.locator('text=팀 관리 기능')).toBeVisible();
    console.log('✅ 매니저 메뉴 표시 확인');
    
    // 3. 관리자 전용 메뉴 확인 (없어야 함)
    const adminOnlyMenu = page.locator('text=관리자 전용 기능');
    await expect(adminOnlyMenu).not.toBeVisible();
    console.log('✅ 관리자 전용 메뉴 비표시 확인');
    
    // 4. 로그아웃
    await page.click('button[title="로그아웃"]');
    await page.waitForURL('**/login');
    console.log('✅ 매니저 로그아웃 완료');
    
    // 5. 관리자로 로그인
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 로그인 완료');
    
    // 6. 관리자 메뉴 확인
    await expect(page.locator('text=관리자 전용 기능')).toBeVisible();
    await expect(page.locator('text=관리자 + 매니저 기능')).toBeVisible();
    await expect(page.locator('text=팀 관리 기능')).toBeVisible();
    console.log('✅ 관리자 메뉴 표시 확인');
    
    // 7. 스크린샷 캡처
    await page.screenshot({ 
      path: 'manager-vs-admin-permission-test.png', 
      fullPage: true 
    });
    console.log('✅ 권한 비교 스크린샷 캡처 완료');
    
    console.log('🎉 매니저 vs 관리자 권한 비교 테스트 완료!');
  });
});
