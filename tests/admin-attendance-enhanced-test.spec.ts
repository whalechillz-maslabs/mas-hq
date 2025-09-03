import { test, expect } from '@playwright/test';

test('관리자 출근 관리 개선된 기능 테스트 (스케줄 + 휴식 정보)', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 개선된 기능 테스트 시작 ===');
  
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
  
  // 2. 새로운 테이블 구조 확인
  console.log('=== 2. 새로운 테이블 구조 확인 ===');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 테이블 헤더 확인
  const tableHeaders = page.locator('thead th');
  const headerCount = await tableHeaders.count();
  console.log('테이블 헤더 수:', headerCount);
  
  // 각 헤더의 텍스트 확인
  for (let i = 0; i < headerCount; i++) {
    const headerText = await tableHeaders.nth(i).textContent();
    console.log(`  헤더 ${i + 1}: ${headerText}`);
  }
  
  // 3. 새로운 컬럼들이 올바르게 표시되는지 확인
  console.log('=== 3. 새로운 컬럼들이 올바르게 표시되는지 확인 ===');
  
  // 스케줄 컬럼 확인
  const scheduleColumn = page.locator('thead th').filter({ hasText: '스케줄' });
  const scheduleExists = await scheduleColumn.count() > 0;
  console.log('스케줄 컬럼 존재:', scheduleExists);
  
  // 실제 출근 컬럼 확인
  const actualClockInColumn = page.locator('thead th').filter({ hasText: '실제 출근' });
  const actualClockInExists = await actualClockInColumn.count() > 0;
  console.log('실제 출근 컬럼 존재:', actualClockInExists);
  
  // 점심 휴식 컬럼 확인
  const breakColumn = page.locator('thead th').filter({ hasText: '점심 휴식' });
  const breakExists = await breakColumn.count() > 0;
  console.log('점심 휴식 컬럼 존재:', breakExists);
  
  // 실제 퇴근 컬럼 확인
  const actualClockOutColumn = page.locator('thead th').filter({ hasText: '실제 퇴근' });
  const actualClockOutExists = await actualClockOutColumn.count() > 0;
  console.log('실제 퇴근 컬럼 존재:', actualClockOutExists);
  
  // 4. 첫 번째 직원의 데이터 확인
  console.log('=== 4. 첫 번째 직원의 데이터 확인 ===');
  
  if (scheduleExists && actualClockInExists && breakExists && actualClockOutExists) {
    // 첫 번째 직원 행의 데이터 확인
    const firstRow = page.locator('tbody tr').first();
    
    // 직원 이름
    const employeeName = await firstRow.locator('td:first-child .text-sm.font-medium.text-gray-900').textContent();
    console.log(`첫 번째 직원: ${employeeName}`);
    
    // 스케줄 정보
    const scheduleInfo = await firstRow.locator('td:nth-child(2) .text-xs.text-gray-500').textContent();
    console.log(`스케줄 정보: ${scheduleInfo}`);
    
    // 실제 출근 정보
    const actualClockInInfo = await firstRow.locator('td:nth-child(3) .text-xs.text-gray-500').textContent();
    console.log(`실제 출근 정보: ${actualClockInInfo}`);
    
    // 점심 휴식 정보
    const breakInfo = await firstRow.locator('td:nth-child(4) .text-xs.text-gray-500').textContent();
    console.log(`점심 휴식 정보: ${breakInfo}`);
    
    // 실제 퇴근 정보
    const actualClockOutInfo = await firstRow.locator('td:nth-child(5) .text-xs.text-gray-500').textContent();
    console.log(`실제 퇴근 정보: ${actualClockOutInfo}`);
    
    // 근무 시간
    const workHours = await firstRow.locator('td:nth-child(6) .text-sm').textContent();
    console.log(`근무 시간: ${workHours}`);
    
    // 상태
    const status = await firstRow.locator('td:nth-child(8) span span:last-child').textContent();
    console.log(`상태: ${status}`);
  }
  
  // 5. 요약 카드 상태 확인
  console.log('=== 5. 요약 카드 상태 확인 ===');
  
  const completedCount = await page.locator('text=출근 완료').locator('..').locator('.text-2xl').textContent();
  const workingCount = await page.locator('text=근무 중').locator('..').locator('.text-2xl').textContent();
  const notAttendedCount = await page.locator('text=미출근').locator('..').locator('.text-2xl').textContent();
  
  console.log('출근 완료:', completedCount);
  console.log('근무 중:', workingCount);
  console.log('미출근:', notAttendedCount);
  
  // 6. 최종 스크린샷 저장
  console.log('=== 6. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-enhanced.png', fullPage: true });
  console.log('✅ 개선된 기능 테스트 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 개선된 기능 테스트 완료 ===');
});
