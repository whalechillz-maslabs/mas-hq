import { test, expect } from '@playwright/test';

test('관리자 출근 관리 디버깅 로그 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 디버깅 로그 확인 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 대시보드에서 팀 관리 기능의 출근 관리로 이동
  console.log('=== 1. 대시보드에서 팀 관리 기능의 출근 관리로 이동 ===');
  
  // 팀 관리 기능 섹션 찾기
  const teamManagementSection = page.locator('text=팀 관리 기능');
  const sectionExists = await teamManagementSection.count() > 0;
  console.log('팀 관리 기능 섹션 존재:', sectionExists);
  
  if (sectionExists) {
    // 팀 관리 기능 섹션 내의 출근 관리 카드 찾기 (두 번째 출근 관리 카드)
    const attendanceCards = page.locator('text=출근 관리');
    const cardCount = await attendanceCards.count();
    console.log('출근 관리 카드 수:', cardCount);
    
    if (cardCount >= 2) {
      // 두 번째 출근 관리 카드 (팀 관리 기능의 것) 선택
      const teamAttendanceCard = attendanceCards.nth(1);
      const cardText = await teamAttendanceCard.locator('..').textContent();
      console.log('팀 관리 기능 출근 관리 카드 내용:', cardText);
      
      // 팀 관리 기능의 출근 관리 카드 클릭
      console.log('팀 관리 기능 출근 관리 카드 클릭...');
      await teamAttendanceCard.locator('..').click();
      
      // 페이지 이동 대기
      await page.waitForURL('**/admin/attendance-management');
      console.log('✅ 관리자 출근 관리 페이지로 이동 성공');
    }
  }
  
  // 2. 페이지 로딩 및 디버깅 로그 수집
  console.log('=== 2. 페이지 로딩 및 디버깅 로그 수집 ===');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // 디버깅 로그가 출력될 시간 확보
  
  // 3. 콘솔 로그 수집
  console.log('=== 3. 콘솔 로그 수집 ===');
  
  // 콘솔 메시지 수집
  const consoleMessages = await page.evaluate(() => {
    return (window as any).console?.logs || [];
  });
  
  console.log('콘솔 메시지 수:', consoleMessages.length);
  
  // 4. 요약 카드 상태 확인
  console.log('=== 4. 요약 카드 상태 확인 ===');
  
  const completedCount = await page.locator('text=출근 완료').locator('..').locator('.text-2xl').textContent();
  const workingCount = await page.locator('text=근무 중').locator('..').locator('.text-2xl').textContent();
  const notAttendedCount = await page.locator('text=미출근').locator('..').locator('.text-2xl').textContent();
  
  console.log('출근 완료:', completedCount);
  console.log('근무 중:', workingCount);
  console.log('미출근:', notAttendedCount);
  
  // 5. 하상희 상태 특별 확인
  console.log('=== 5. 하상희 상태 특별 확인 ===');
  
  // 하상희 행 찾기
  const haSangHeeRow = page.locator('tbody tr').filter({ hasText: '하상희' });
  const haSangHeeExists = await haSangHeeRow.count() > 0;
  
  if (haSangHeeExists) {
    console.log('✅ 하상희 행을 찾았습니다.');
    
    // 하상희의 출근/퇴근 시간 확인
    const clockInTime = await haSangHeeRow.locator('td:nth-child(2) .text-sm').textContent();
    const clockOutTime = await haSangHeeRow.locator('td:nth-child(3) .text-sm').textContent();
    const status = await haSangHeeRow.locator('td:nth-child(6) span span:last-child').textContent();
    
    console.log(`하상희 출근 시간: ${clockInTime}`);
    console.log(`하상희 퇴근 시간: ${clockOutTime}`);
    console.log(`하상희 현재 상태: ${status}`);
    
    // 상태가 올바르게 표시되었는지 확인
    if (status === '완료') {
      console.log('✅ 하상희 상태가 올바르게 "완료"로 표시되었습니다!');
    } else {
      console.log(`❌ 하상희 상태가 잘못 표시되었습니다. 예상: "완료", 실제: "${status}"`);
    }
  } else {
    console.log('❌ 하상희 행을 찾을 수 없습니다.');
  }
  
  // 6. 최종 스크린샷 저장
  console.log('=== 6. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-debug.png', fullPage: true });
  console.log('✅ 디버깅 로그 확인 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 디버깅 로그 확인 완료 ===');
});
