import { test, expect } from '@playwright/test';

test.describe('박진(JIN) 직원 로그인 및 닉네임 설정 테스트 (수정됨)', () => {
  test('박진 직원 로그인 후 닉네임 설정', async ({ page }) => {
    console.log('🔍 박진 직원 로그인 및 닉네임 설정 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 로그인 방법 선택 (전화번호)
    await page.click('text=전화번호');
    console.log('✅ 전화번호 로그인 방법 선택');
    
    // 3. 전화번호 입력
    await page.fill('input[type="tel"]', '010-9132-4337');
    console.log('✅ 전화번호 입력: 010-9132-4337');
    
    // 4. 비밀번호 입력
    await page.fill('input[type="password"]', '91324337');
    console.log('✅ 비밀번호 입력: 91324337');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 대시보드로 이동 확인
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 박진 계정 로그인 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    console.log('✅ 박진 계정 로그인 확인');
    
    // 8. 프로필 페이지로 이동
    await page.click('text=개인정보 관리');
    await page.waitForURL('**/profile');
    console.log('✅ 프로필 페이지 이동');
    
    // 9. 닉네임 수정 버튼 클릭
    await page.click('button:has-text("수정")');
    console.log('✅ 닉네임 수정 버튼 클릭');
    
    // 10. 닉네임 입력
    await page.fill('input[placeholder="닉네임을 입력하세요"]', 'JIN_TEST');
    console.log('✅ 닉네임 입력: JIN_TEST');
    
    // 11. 저장 버튼 클릭
    await page.click('button:has-text("저장")');
    console.log('✅ 저장 버튼 클릭');
    
    // 12. 저장 완료 확인
    await expect(page.locator('text=JIN_TEST')).toBeVisible();
    console.log('✅ 닉네임 저장 완료 확인');
    
    // 13. 스크린샷 캡처
    await page.screenshot({ path: 'park-jin-nickname-update-test.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 로그인 및 닉네임 설정 테스트 완료!');
  });

  test('박진 직원 핀번호 로그인 테스트', async ({ page }) => {
    console.log('�� 박진 직원 핀번호 로그인 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 핀번호 로그인 방법 선택
    await page.click('text=핀번호');
    console.log('✅ 핀번호 로그인 방법 선택');
    
    // 3. 사용자 식별 입력 (전화번호)
    await page.fill('input[placeholder="전화번호 또는 사번을 입력하세요"]', '010-9132-4337');
    console.log('✅ 전화번호 입력: 010-9132-4337');
    
    // 4. 핀번호 입력
    await page.fill('input[placeholder="핀번호를 입력하세요"]', '1234');
    console.log('✅ 핀번호 입력: 1234');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 대시보드로 이동 확인
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 박진 계정 로그인 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    console.log('✅ 박진 계정 로그인 확인');
    
    // 8. 스크린샷 캡처
    await page.screenshot({ path: 'park-jin-pin-login-test.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 핀번호 로그인 테스트 완료!');
  });

  test('박진 직원 권한 확인 테스트', async ({ page }) => {
    console.log('🔍 박진 직원 권한 확인 테스트 시작');
    
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ 박진 계정 로그인 완료');
    
    // 2. 일반 직원 메뉴 확인
    await expect(page.locator('text=근무 스케줄')).toBeVisible();
    await expect(page.locator('text=급여 조회')).toBeVisible();
    await expect(page.locator('text=업무 기록')).toBeVisible();
    await expect(page.locator('text=조직도')).toBeVisible();
    await expect(page.locator('text=개인정보 관리')).toBeVisible();
    console.log('✅ 일반 직원 메뉴 확인 완료');
    
    // 3. 관리자 메뉴 비표시 확인
    const adminMenu = page.locator('text=관리자 전용 기능');
    await expect(adminMenu).not.toBeVisible();
    console.log('✅ 관리자 메뉴 비표시 확인 완료');
    
    // 4. 스크린샷 캡처
    await page.screenshot({ path: 'park-jin-permission-test.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 권한 확인 테스트 완료!');
  });
});
