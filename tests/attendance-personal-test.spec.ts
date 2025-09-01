import { test, expect } from '@playwright/test';

test.describe('개인별 출근 관리 페이지 테스트', () => {
  test('김탁수 계정으로 개인 출근 관리 테스트', async ({ page }) => {
    console.log('🚀 김탁수 계정 개인 출근 관리 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 전화번호 입력 (실제 김탁수 계정)
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 개인 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    console.log('🔍 개인 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 3. 페이지 제목 확인
    const pageTitle = await page.locator('h1, [class*="title"]').first().textContent();
    console.log('📌 페이지 제목:', pageTitle);
    
    // 4. 로딩 상태 확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
    
    if (hasLoading) {
      console.log('⚠️ 페이지가 로딩 중입니다. 잠시 대기...');
      await page.waitForTimeout(5000);
    }
    
    // 5. 오늘의 스케줄 확인
    const todaySchedule = page.locator('text=오늘의 스케줄, text=Today Schedule, text=스케줄');
    const hasSchedule = await todaySchedule.count() > 0;
    console.log('📅 오늘의 스케줄 존재:', hasSchedule);
    
    // 6. 출근 체크 버튼 확인
    const checkInButton = page.locator('button:has-text("출근"), button:has-text("Check In"), button:has-text("체크인")');
    const checkOutButton = page.locator('button:has-text("퇴근"), button:has-text("Check Out"), button:has-text("체크아웃")');
    
    console.log('🔘 출근 체크 버튼 존재:', await checkInButton.count() > 0);
    console.log('🔘 퇴근 체크 버튼 존재:', await checkOutButton.count() > 0);
    
    // 7. 월간 출근 기록 확인
    const monthlyRecords = page.locator('text=월간 기록, text=Monthly Records, text=월간');
    const hasMonthly = await monthlyRecords.count() > 0;
    console.log('📊 월간 출근 기록 존재:', hasMonthly);
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-personal-kimtaksu.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 김탁수 계정 개인 출근 관리 테스트 완료!');
  });

  test('허상원 계정으로 개인 출근 관리 테스트', async ({ page }) => {
    console.log('🚀 허상원 계정 개인 출근 관리 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 전화번호 입력 (실제 허상원 계정)
    await page.fill('input[name="phone"]', '010-8948-4501');
    await page.fill('input[name="password"]', '89484501');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForURL('**/quick-task');
    console.log('✅ 허상원 계정 로그인 완료');
    
    // 2. 개인 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    console.log('🔍 개인 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 3. 페이지 제목 확인
    const pageTitle = await page.locator('h1, [class*="title"]').first().textContent();
    console.log('📌 페이지 제목:', pageTitle);
    
    // 4. 로딩 상태 확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
    
    if (hasLoading) {
      console.log('⚠️ 페이지가 로딩 중입니다. 잠시 대기...');
      await page.waitForTimeout(5000);
    }
    
    // 5. 오늘의 스케줄 확인
    const todaySchedule = page.locator('text=오늘의 스케줄, text=Today Schedule, text=스케줄');
    const hasSchedule = await todaySchedule.count() > 0;
    console.log('📅 오늘의 스케줄 존재:', hasSchedule);
    
    // 6. 출근 체크 버튼 확인
    const checkInButton = page.locator('button:has-text("출근"), button:has-text("Check In"), button:has-text("체크인")');
    const checkOutButton = page.locator('button:has-text("퇴근"), button:has-text("Check Out"), button:has-text("체크아웃")');
    
    console.log('🔘 출근 체크 버튼 존재:', await checkInButton.count() > 0);
    console.log('🔘 퇴근 체크 버튼 존재:', await checkOutButton.count() > 0);
    
    // 7. 월간 출근 기록 확인
    const monthlyRecords = page.locator('text=월간 기록, text=Monthly Records, text=월간');
    const hasMonthly = await monthlyRecords.count() > 0;
    console.log('📊 월간 출근 기록 존재:', hasMonthly);
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-personal-heosangwon.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 허상원 계정 개인 출근 관리 테스트 완료!');
  });
});
