import { test, expect } from '@playwright/test';

test('관리자 출근 관리 상태 판정 로직 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 상태 판정 로직 테스트 시작 ===');
  
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
  
  // 2. 상태 판정 로직 테스트
  console.log('=== 2. 상태 판정 로직 테스트 ===');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 요약 카드 확인
  const completedCount = await page.locator('text=출근 완료').locator('..').locator('.text-2xl').textContent();
  const workingCount = await page.locator('text=근무 중').locator('..').locator('.text-2xl').textContent();
  const notAttendedCount = await page.locator('text=미출근').locator('..').locator('.text-2xl').textContent();
  
  console.log('출근 완료:', completedCount);
  console.log('근무 중:', workingCount);
  console.log('미출근:', notAttendedCount);
  
  // 3. 개별 직원 상태 확인
  console.log('=== 3. 개별 직원 상태 확인 ===');
  
  // 테이블에서 직원들의 상태 확인
  const statusElements = page.locator('td:last-child span span:last-child');
  const statusCount = await statusElements.count();
  console.log('상태 요소 수:', statusCount);
  
  for (let i = 0; i < statusCount; i++) {
    const statusElement = statusElements.nth(i);
    const statusText = await statusElement.textContent();
    console.log(`직원 ${i + 1} 상태: ${statusText}`);
    
    // 출근/퇴근 시간도 확인
    const row = statusElement.locator('..').locator('..').locator('..');
    const clockInTime = await row.locator('td:nth-child(2) .text-sm').textContent();
    const clockOutTime = await row.locator('td:nth-child(3) .text-sm').textContent();
    
    console.log(`  - 출근 시간: ${clockInTime}`);
    console.log(`  - 퇴근 시간: ${clockOutTime}`);
    
    // 상태가 올바르게 표시되는지 확인
    if (clockInTime && clockOutTime && clockInTime !== '-' && clockOutTime !== '-') {
      if (statusText === '완료' || statusText === '근무중') {
        console.log(`  ✅ 올바른 상태: ${statusText}`);
      } else {
        console.log(`  ❌ 잘못된 상태: ${statusText} (출근/퇴근 시간이 있음)`);
      }
    } else {
      if (statusText === '미출근') {
        console.log(`  ✅ 올바른 상태: ${statusText}`);
      } else {
        console.log(`  ❌ 잘못된 상태: ${statusText} (출근/퇴근 시간이 없음)`);
      }
    }
  }
  
  // 4. 최종 스크린샷 저장
  console.log('=== 4. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-status-fixed.png', fullPage: true });
  console.log('✅ 상태 판정 로직 수정 후 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 상태 판정 로직 테스트 완료 ===');
});
