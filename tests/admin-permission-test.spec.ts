import { test, expect } from '@playwright/test';

test.describe('MASLABS-001 관리자 계정 어드민 기능 테스트', () => {
  test('관리자 로그인 및 어드민 메뉴 확인', async ({ page }) => {
    console.log('🔍 MASLABS-001 관리자 계정 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 로그인 방법 선택 (전화번호)
    await page.click('text=전화번호');
    console.log('✅ 전화번호 로그인 방법 선택');
    
    // 3. 전화번호 입력 (관리자 계정)
    await page.fill('input[type="tel"]', '010-6669-9000');
    console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
    
    // 4. 비밀번호 입력
    await page.fill('input[type="password"]', '66699000');
    console.log('✅ 관리자 비밀번호 입력: 66699000');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 대시보드 로딩 대기
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 관리자 계정 확인
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    console.log('✅ 관리자 계정 로그인 확인');
    
    // 8. 어드민 메뉴 확인
    await expect(page.locator('text=관리자 기능')).toBeVisible();
    console.log('✅ 어드민 메뉴 표시 확인');
    
    // 9. 어드민 기능들 확인
    await expect(page.locator('text=인사정책 관리')).toBeVisible();
    await expect(page.locator('text=OP 팀장 설정')).toBeVisible();
    await expect(page.locator('text=직원 관리')).toBeVisible();
    await expect(page.locator('text=시스템 설정')).toBeVisible();
    await expect(page.locator('text=팀원 평가')).toBeVisible();
    await expect(page.locator('text=출근 관리')).toBeVisible();
    console.log('✅ 모든 어드민 기능 표시 확인');
    
    // 10. 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-dashboard-test.png', 
      fullPage: true 
    });
    console.log('✅ 관리자 대시보드 스크린샷 캡처 완료');
    
    console.log('🎉 관리자 계정 어드민 기능 테스트 완료!');
  });

  test('관리자 프로필 페이지 확인', async ({ page }) => {
    console.log('🔍 관리자 프로필 페이지 테스트 시작');
    
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 로그인 완료');
    
    // 2. 프로필 페이지로 이동
    await page.click('button[title="개인정보 관리"]');
    console.log('✅ 프로필 페이지 이동');
    
    // 3. 프로필 페이지 로딩 대기
    await page.waitForURL('**/profile');
    console.log('✅ 프로필 페이지 로딩 완료');
    
    // 4. 관리자 정보 확인
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    await expect(page.locator('text=MASLABS-001')).toBeVisible();
    await expect(page.locator('text=HQ')).toBeVisible();
    await expect(page.locator('text=대표이사')).toBeVisible();
    console.log('✅ 관리자 프로필 정보 확인');
    
    // 5. 권한 정보 확인
    const permissionText = page.locator('text=권한: admin');
    if (await permissionText.isVisible()) {
      console.log('✅ admin 권한 확인');
    } else {
      console.log('⚠️ 권한 정보가 표시되지 않음');
    }
    
    // 6. 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-profile-test.png', 
      fullPage: true 
    });
    console.log('✅ 관리자 프로필 스크린샷 캡처 완료');
    
    console.log('🎉 관리자 프로필 페이지 테스트 완료!');
  });

  test('관리자 어드민 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 관리자 어드민 페이지 접근 테스트 시작');
    
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 로그인 완료');
    
    // 2. 인사정책 관리 페이지 접근
    await page.click('text=인사정책 관리');
    console.log('✅ 인사정책 관리 페이지 접근');
    
    // 3. 페이지 로딩 대기
    await page.waitForURL('**/admin/hr-policy');
    console.log('✅ 인사정책 관리 페이지 로딩 완료');
    
    // 4. 페이지 내용 확인
    await expect(page.locator('text=인사정책 관리')).toBeVisible();
    console.log('✅ 인사정책 관리 페이지 내용 확인');
    
    // 5. 대시보드로 돌아가기
    await page.goto('http://localhost:3000/dashboard');
    console.log('✅ 대시보드로 돌아가기');
    
    // 6. 직원 관리 페이지 접근
    await page.click('text=직원 관리');
    console.log('✅ 직원 관리 페이지 접근');
    
    // 7. 페이지 로딩 대기
    await page.waitForURL('**/admin/employee-management');
    console.log('✅ 직원 관리 페이지 로딩 완료');
    
    // 8. 페이지 내용 확인
    await expect(page.locator('text=직원 관리')).toBeVisible();
    console.log('✅ 직원 관리 페이지 내용 확인');
    
    // 9. 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-pages-test.png', 
      fullPage: true 
    });
    console.log('✅ 어드민 페이지 접근 스크린샷 캡처 완료');
    
    console.log('🎉 관리자 어드민 페이지 접근 테스트 완료!');
  });

  test('관리자 vs 일반 직원 권한 비교 테스트', async ({ page }) => {
    console.log('🔍 관리자 vs 일반 직원 권한 비교 테스트 시작');
    
    // 1. 관리자로 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 로그인 완료');
    
    // 2. 관리자 메뉴 확인
    await expect(page.locator('text=관리자 기능')).toBeVisible();
    console.log('✅ 관리자 메뉴 표시 확인');
    
    // 3. 로그아웃
    await page.click('button[title="로그아웃"]');
    await page.waitForURL('**/login');
    console.log('✅ 관리자 로그아웃 완료');
    
    // 4. 일반 직원(박진)으로 로그인
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 일반 직원 로그인 완료');
    
    // 5. 일반 직원 메뉴 확인 (관리자 메뉴가 없어야 함)
    const adminMenu = page.locator('text=관리자 기능');
    await expect(adminMenu).not.toBeVisible();
    console.log('✅ 일반 직원에게 관리자 메뉴 비표시 확인');
    
    // 6. 일반 직원 메뉴 확인
    await expect(page.locator('text=빠른 메뉴')).toBeVisible();
    console.log('✅ 일반 직원 메뉴 표시 확인');
    
    // 7. 스크린샷 캡처
    await page.screenshot({ 
      path: 'permission-comparison-test.png', 
      fullPage: true 
    });
    console.log('✅ 권한 비교 스크린샷 캡처 완료');
    
    console.log('🎉 관리자 vs 일반 직원 권한 비교 테스트 완료!');
  });
});
