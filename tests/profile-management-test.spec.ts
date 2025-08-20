import { test, expect } from '@playwright/test';

test('개인정보 관리 상세 테스트', async ({ page }) => {
  console.log('🔍 개인정보 관리 상세 테스트 시작');
  
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 로그인 성공');
  
  // 2. 대시보드에서 개인정보 관리 페이지 접근
  await page.waitForLoadState('networkidle');
  await page.click('button[title="개인정보 관리"]');
  await page.waitForURL('**/profile');
  
  console.log('✅ 개인정보 관리 페이지 접근 성공');
  
  // 3. 기본 정보 확인
  console.log('🔍 기본 정보 확인');
  
  // 프로필 카드 정보 확인
  await expect(page.locator('text=시스템 관리자')).toBeVisible();
  await expect(page.locator('text=MASLABS-001')).toBeVisible();
  await expect(page.locator('text=경영지원팀 • 총관리자')).toBeVisible();
  await expect(page.locator('text=taksoo.kim@gmail.com')).toBeVisible();
  await expect(page.locator('text=입사일: 2009-10-21')).toBeVisible();
  await expect(page.locator('text=권한: admin')).toBeVisible();
  
  console.log('✅ 프로필 카드 정보 확인 완료');
  
  // 4. 기본 정보 탭 테스트
  console.log('🔍 기본 정보 탭 테스트');
  
  // 수정 버튼 클릭
  await page.click('text=수정');
  
  // 닉네임 수정
  const nicknameInput = page.locator('input[placeholder="닉네임을 입력하세요"]');
  await nicknameInput.clear();
  await nicknameInput.fill('김탁수');
  
  // 이메일 수정
  const emailInput = page.locator('input[placeholder="이메일을 입력하세요"]');
  await emailInput.clear();
  await emailInput.fill('taksoo.kim@gmail.com');
  
  // 핀번호 수정 (숫자만 입력 가능)
  const pinInput = page.locator('input[placeholder="0000"]');
  await pinInput.clear();
  await pinInput.fill('5678');
  
  // 저장 버튼 클릭
  await page.click('text=저장');
  
  // 저장 완료 확인
  await expect(page.locator('text=수정')).toBeVisible();
  
  console.log('✅ 기본 정보 수정 완료');
  
  // 5. 보안 설정 탭 테스트
  console.log('🔍 보안 설정 탭 테스트');
  
  // 보안 설정 탭 클릭
  await page.click('text=보안 설정');
  
  // 비밀번호 변경 필드 확인
  await expect(page.locator('text=현재 비밀번호')).toBeVisible();
  await expect(page.locator('text=새 비밀번호')).toBeVisible();
  await expect(page.locator('text=새 비밀번호 확인')).toBeVisible();
  
  // 보안 팁 확인
  await expect(page.locator('text=보안 팁')).toBeVisible();
  await expect(page.locator('text=비밀번호는 8자 이상으로 설정하세요')).toBeVisible();
  await expect(page.locator('text=영문, 숫자, 특수문자를 포함하세요')).toBeVisible();
  await expect(page.locator('text=핀번호는 다른 곳에서 사용하지 마세요')).toBeVisible();
  
  console.log('✅ 보안 설정 탭 확인 완료');
  
  // 6. 비밀번호 변경 테스트
  console.log('🔍 비밀번호 변경 테스트');
  
  // 수정 모드 활성화
  await page.click('text=수정');
  
  // 현재 비밀번호 입력
  await page.fill('input[placeholder="현재 비밀번호를 입력하세요"]', 'admin123');
  
  // 새 비밀번호 입력
  await page.fill('input[placeholder="새 비밀번호를 입력하세요"]', 'newpassword123');
  
  // 새 비밀번호 확인 입력
  await page.fill('input[placeholder="새 비밀번호를 다시 입력하세요"]', 'newpassword123');
  
  // 저장 버튼 클릭
  await page.click('text=저장');
  
  // 저장 완료 확인
  await expect(page.locator('text=수정')).toBeVisible();
  
  console.log('✅ 비밀번호 변경 테스트 완료');
  
  // 7. 뒤로가기 기능 테스트
  console.log('🔍 뒤로가기 기능 테스트');
  
  // 뒤로가기 버튼 클릭
  await page.click('text=뒤로가기');
  await page.waitForURL('**/dashboard');
  
  // 대시보드로 돌아왔는지 확인
  await expect(page.locator('text=오늘의 미션')).toBeVisible();
  
  console.log('✅ 뒤로가기 기능 확인 완료');
  
  // 8. 스크린샷 캡처
  await page.screenshot({ 
    path: 'profile-management-detailed-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 개인정보 관리 상세 테스트 완료!');
});

test('개인정보 관리 기능 검증 테스트', async ({ page }) => {
  console.log('🔍 개인정보 관리 기능 검증 테스트 시작');
  
  // 1. 핀번호로 로그인
  await page.goto('http://localhost:3000/login');
  await page.click('text=핀번호');
  await page.fill('input[placeholder="0000"]', '5678'); // 변경된 핀번호
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 핀번호 로그인 성공');
  
  // 2. 개인정보 관리 페이지 접근
  await page.waitForLoadState('networkidle');
  await page.click('button[title="개인정보 관리"]');
  await page.waitForURL('**/profile');
  
  // 3. 수정된 정보 확인
  console.log('🔍 수정된 정보 확인');
  
  // 기본 정보 탭에서 수정된 정보 확인
  await expect(page.locator('input[placeholder="닉네임을 입력하세요"]')).toHaveValue('김탁수');
  await expect(page.locator('input[placeholder="이메일을 입력하세요"]')).toHaveValue('taksoo.kim@gmail.com');
  await expect(page.locator('input[placeholder="0000"]')).toHaveValue('5678');
  
  console.log('✅ 수정된 정보 확인 완료');
  
  // 4. 스크린샷 캡처
  await page.screenshot({ 
    path: 'profile-verification-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 개인정보 관리 기능 검증 테스트 완료!');
});
