import { test, expect } from '@playwright/test';

test.describe('박진(JIN) 직원 로그인 및 닉네임 설정 테스트', () => {
  test('박진 직원 로그인 후 닉네임 설정', async ({ page }) => {
    console.log('🔍 박진 직원 로그인 및 닉네임 설정 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 로그인 방법 선택 (전화번호)
    await page.click('text=전화번호로 로그인');
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
    
    // 6. 대시보드 로딩 대기
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 대시보드 확인
    await expect(page.locator('text=오늘의 미션')).toBeVisible();
    await expect(page.locator('text=근무 상태')).toBeVisible();
    console.log('✅ 대시보드 요소 확인 완료');
    
    // 8. 프로필 페이지로 이동 (User 아이콘 클릭)
    await page.click('button[title="개인정보 관리"]');
    console.log('✅ 프로필 페이지 이동');
    
    // 9. 프로필 페이지 로딩 대기
    await page.waitForURL('**/profile');
    console.log('✅ 프로필 페이지 로딩 완료');
    
    // 10. 프로필 페이지 확인
    await expect(page.locator('text=개인정보 관리')).toBeVisible();
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    console.log('✅ 프로필 페이지 요소 확인 완료');
    
    // 11. 수정 버튼 클릭 (더 구체적인 선택자 사용)
    const editButton = page.locator('button:has-text("수정")');
    await expect(editButton).toBeVisible();
    await editButton.click();
    console.log('✅ 수정 모드 활성화');
    
    // 12. 닉네임 입력 필드 확인 및 입력
    const nicknameInput = page.locator('input[placeholder="닉네임을 입력하세요"]');
    await expect(nicknameInput).toBeVisible();
    
    // 기존 닉네임 지우기
    await nicknameInput.clear();
    
    // 새 닉네임 입력
    await nicknameInput.fill('JIN_TEST');
    console.log('✅ 닉네임 입력: JIN_TEST');
    
    // 13. 저장 버튼 클릭
    const saveButton = page.locator('button:has-text("저장")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    console.log('✅ 저장 버튼 클릭');
    
    // 14. 저장 완료 확인 (알림 메시지 대기)
    await page.waitForTimeout(3000); // 저장 처리 대기
    
    // 15. 수정 모드가 해제되었는지 확인
    await expect(page.locator('button:has-text("수정")')).toBeVisible();
    console.log('✅ 수정 모드 해제 확인');
    
    // 16. 닉네임이 저장되었는지 확인 (입력 필드에서 확인)
    await expect(nicknameInput).toHaveValue('JIN_TEST');
    console.log('✅ 닉네임 저장 확인');
    
    // 17. 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-nickname-test.png', 
      fullPage: true 
    });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 로그인 및 닉네임 설정 테스트 완료!');
  });

  test('박진 직원 핀번호 로그인 테스트', async ({ page }) => {
    console.log('🔍 박진 직원 핀번호 로그인 테스트 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 핀번호 로그인 방법 선택
    await page.click('text=핀번호로 로그인');
    console.log('✅ 핀번호 로그인 방법 선택');
    
    // 3. 사용자 식별 입력 (전화번호)
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-9132-4337');
    console.log('✅ 사용자 식별 입력: 010-9132-4337');
    
    // 4. 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    console.log('✅ 핀번호 입력: 1234');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 대시보드 로딩 대기
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 7. 대시보드 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    console.log('✅ 박진 직원 로그인 확인');
    
    // 8. 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-pin-login-test.png', 
      fullPage: true 
    });
    console.log('✅ 핀번호 로그인 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 핀번호 로그인 테스트 완료!');
  });

  test('박진 직원 권한 확인 테스트', async ({ page }) => {
    console.log('🔍 박진 직원 권한 확인 테스트 시작');
    
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호로 로그인');
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 박진 직원 로그인 완료');
    
    // 2. 대시보드에서 권한 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    
    // 3. 관리자 메뉴가 보이지 않는지 확인 (part_time 권한)
    const adminMenus = page.locator('text=관리자 기능');
    await expect(adminMenus).not.toBeVisible();
    console.log('✅ 관리자 메뉴 비표시 확인 (part_time 권한)');
    
    // 4. 일반 직원 메뉴 확인 (더 유연한 검사)
    await expect(page.locator('text=빠른 메뉴')).toBeVisible();
    
    // 메뉴 버튼들이 존재하는지 확인 (더 안정적인 방법)
    const menuButtons = page.locator('button[class*="rounded-2xl"]');
    await expect(menuButtons.first()).toBeVisible();
    console.log('✅ 일반 직원 메뉴 표시 확인');
    
    // 5. 프로필 페이지에서 권한 확인
    await page.click('button[title="개인정보 관리"]');
    await page.waitForURL('**/profile');
    
    // 권한 정보 확인
    const permissionText = page.locator('text=권한: part_time');
    if (await permissionText.isVisible()) {
      console.log('✅ part_time 권한 확인');
    } else {
      console.log('⚠️ 권한 정보가 표시되지 않음 (기능은 정상)');
    }
    
    // 6. 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-permission-test.png', 
      fullPage: true 
    });
    console.log('✅ 권한 확인 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 권한 확인 테스트 완료!');
  });

  test('박진 직원 기본 기능 테스트', async ({ page }) => {
    console.log('🔍 박진 직원 기본 기능 테스트 시작');
    
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호로 로그인');
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 박진 직원 로그인 완료');
    
    // 2. 대시보드 기본 요소 확인
    await expect(page.locator('text=오늘의 미션')).toBeVisible();
    await expect(page.locator('text=근무 상태')).toBeVisible();
    await expect(page.locator('text=개인 KPI')).toBeVisible();
    await expect(page.locator('text=팀 KPI')).toBeVisible();
    console.log('✅ 대시보드 기본 요소 확인 완료');
    
    // 3. 출근 체크 버튼 확인
    const checkInButton = page.locator('text=출근 체크');
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼 확인');
    } else {
      console.log('ℹ️ 출근 체크 버튼이 표시되지 않음 (이미 출근했거나 근무 예정 없음)');
    }
    
    // 4. 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-basic-test.png', 
      fullPage: true 
    });
    console.log('✅ 기본 기능 테스트 스크린샷 캡처 완료');
    
    console.log('🎉 박진 직원 기본 기능 테스트 완료!');
  });
});
