import { test, expect } from '@playwright/test';

test('로그인 후 출근 관리 페이지 확인', async ({ page }) => {
  // 로그인 페이지로 이동
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // 로그인 폼 확인
  const phoneInput = page.locator('input[type="tel"]');
  const passwordInput = page.locator('input[type="password"]');
  const loginButton = page.locator('button[type="submit"]');
  
  console.log('전화번호 입력 필드 개수:', await phoneInput.count());
  console.log('비밀번호 입력 필드 개수:', await passwordInput.count());
  console.log('로그인 버튼 개수:', await loginButton.count());
  
  // 로그인 정보 입력 (허상원 계정으로 추정)
  if (await phoneInput.count() > 0) {
    // 허상원의 전화번호로 로그인 시도 (예시)
    await phoneInput.fill('010-1234-5678');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    // 로그인 후 대기
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
  }
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('로그인 후 현재 URL:', currentUrl);
  
  // 로그인이 성공했는지 확인
  if (currentUrl.includes('/login')) {
    console.log('로그인이 실패했습니다. 다른 계정으로 시도해보겠습니다.');
    
    // 다른 계정으로 시도
    await phoneInput.fill('010-0000-0000');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    const newUrl = page.url();
    console.log('두 번째 로그인 시도 후 URL:', newUrl);
  }
  
  // 출근 관리 페이지로 이동
  await page.goto('https://www.maslabs.kr/attendance');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(10000);
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'attendance-after-login.png', fullPage: true });
  
  // 현재 URL 확인
  const attendanceUrl = page.url();
  console.log('출근 관리 페이지 URL:', attendanceUrl);
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('출근 관리 페이지 제목:', title);
  
  // 주요 텍스트 요소들 확인
  const elements = [
    '출근 관리', '허상원', 'HEO', '오늘 근무 시간', '7.5',
    '스케줄 시간', '실제 근무 시간', '시간 차이',
    '오늘의 근무 요약', '이번 달 출근 요약', '최근 7일 요약',
    '간단한 출근 관리', '근무 완료', '출근:', '퇴근:', '완료',
    '09:00 → 12:00', '13:00 → 17:30'
  ];
  
  for (const element of elements) {
    const count = await page.locator(`text=${element}`).count();
    console.log(`${element}: ${count}개`);
  }
  
  // 중복 표시 확인
  const duplicateTime = await page.locator('text=7.5시간 / 7.5시간 7.5시간').count();
  console.log('중복 표시 (7.5시간 / 7.5시간 7.5시간):', duplicateTime);
  
  // 새로운 표시 방식 확인
  const scheduleLabel = await page.locator('text=스케줄:').count();
  const actualLabel = await page.locator('text=실제:').count();
  console.log('스케줄: 라벨:', scheduleLabel);
  console.log('실제: 라벨:', actualLabel);
  
  // 불필요한 요소들이 제거되었는지 확인
  const removedElements = [
    '진행 중', '대기 중', '연속 근무', '예상:', '총 스케줄'
  ];
  
  for (const element of removedElements) {
    const count = await page.locator(`text=${element}`).count();
    console.log(`제거된 요소 ${element}: ${count}개`);
  }
  
  console.log('=== 로그인 후 출근 관리 페이지 확인 완료 ===');
});
