import { test, expect } from '@playwright/test';

test('개인정보 관리 및 핀번호 로그인 테스트', async ({ page }) => {
  // 1. 핀번호 로그인 테스트
  console.log('🔍 핀번호 로그인 테스트 시작');
  await page.goto('http://localhost:3000/login');
  
  // 핀번호 로그인 탭 선택
  await page.click('text=핀번호');
  
  // 핀번호 입력 (1234)
  await page.fill('input[placeholder="0000"]', '1234');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 핀번호 로그인 성공');
  
  // 2. 개인정보 관리 페이지 접근
  console.log('🔍 개인정보 관리 페이지 테스트 시작');
  
  // 대시보드 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 대시보드에서 프로필 버튼 클릭 (더 안정적인 선택자 사용)
  await page.waitForSelector('button[title="개인정보 관리"]', { timeout: 10000 });
  await page.click('button[title="개인정보 관리"]');
  await page.waitForURL('**/profile');
  
  // 개인정보 관리 페이지 확인
  await expect(page.locator('text=개인정보 관리')).toBeVisible();
  await expect(page.locator('text=시스템 관리자')).toBeVisible();
  await expect(page.locator('text=기본 정보')).toBeVisible();
  await expect(page.locator('text=보안 설정')).toBeVisible();
  
  console.log('✅ 개인정보 관리 페이지 접근 성공');
  
  // 3. 기본 정보 탭 테스트
  console.log('🔍 기본 정보 탭 테스트');
  
  // 수정 버튼 클릭
  await page.click('text=수정');
  
  // 닉네임 수정
  await page.fill('input[placeholder="닉네임을 입력하세요"]', '테스트 닉네임');
  
  // 이메일 수정
  await page.fill('input[placeholder="이메일을 입력하세요"]', 'test@maslabs.kr');
  
  // 핀번호 수정 (숫자만 입력 가능)
  await page.fill('input[placeholder="0000"]', '5678');
  
  // 저장 버튼 클릭
  await page.click('text=저장');
  
  // 저장 완료 확인
  await expect(page.locator('text=수정')).toBeVisible();
  
  console.log('✅ 기본 정보 수정 성공');
  
  // 4. 보안 설정 탭 테스트
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
  
  console.log('✅ 보안 설정 탭 확인 성공');
  
  // 5. 뒤로가기 기능 테스트
  console.log('🔍 뒤로가기 기능 테스트');
  
  // 뒤로가기 버튼 클릭
  await page.click('text=뒤로가기');
  await page.waitForURL('**/dashboard');
  
  // 대시보드로 돌아왔는지 확인
  await expect(page.locator('text=오늘의 미션')).toBeVisible();
  
  console.log('✅ 뒤로가기 기능 성공');
  
  // 6. 스크린샷 캡처
  await page.screenshot({ 
    path: 'profile-management-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 개인정보 관리 및 핀번호 로그인 테스트 완료!');
});

test('관리자 페이지 뒤로가기 기능 테스트', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // 대시보드 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 2. OP 팀장 설정 페이지 테스트
  console.log('🔍 OP 팀장 설정 페이지 뒤로가기 테스트');
  await page.waitForSelector('text=OP 팀장 설정', { timeout: 10000 });
  await page.click('text=OP 팀장 설정');
  await page.waitForURL('**/admin/team-management');
  
  // 뒤로가기 버튼 확인
  await expect(page.locator('text=뒤로가기')).toBeVisible();
  
  // 뒤로가기 버튼 클릭
  await page.click('text=뒤로가기');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ OP 팀장 설정 페이지 뒤로가기 성공');
  
  // 3. 직원 관리 페이지 테스트
  console.log('🔍 직원 관리 페이지 뒤로가기 테스트');
  await page.click('text=직원 관리');
  await page.waitForURL('**/admin/employee-management');
  
  // 뒤로가기 버튼 확인
  await expect(page.locator('text=뒤로가기')).toBeVisible();
  
  // 뒤로가기 버튼 클릭
  await page.click('text=뒤로가기');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 직원 관리 페이지 뒤로가기 성공');
  
  // 4. 시스템 설정 페이지 테스트
  console.log('🔍 시스템 설정 페이지 뒤로가기 테스트');
  await page.click('text=시스템 설정');
  await page.waitForURL('**/admin/system-settings');
  
  // 뒤로가기 버튼 확인
  await expect(page.locator('text=뒤로가기')).toBeVisible();
  
  // 뒤로가기 버튼 클릭
  await page.click('text=뒤로가기');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 시스템 설정 페이지 뒤로가기 성공');
  
  // 5. 스크린샷 캡처
  await page.screenshot({ 
    path: 'admin-back-navigation-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 관리자 페이지 뒤로가기 기능 테스트 완료!');
});
