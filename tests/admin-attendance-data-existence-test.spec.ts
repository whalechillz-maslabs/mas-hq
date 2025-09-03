import { test, expect } from '@playwright/test';

test('관리자 출근 관리 데이터 존재 여부 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 데이터 존재 여부 확인 시작 ===');
  
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
  
  // 2. 다양한 날짜로 데이터 확인
  console.log('=== 2. 다양한 날짜로 데이터 확인 ===');
  
  const testDates = [
    '2025-09-02', // 어제
    '2025-09-01', // 2일 전
    '2025-08-31', // 3일 전
    '2025-08-30', // 4일 전
    '2025-08-29', // 5일 전
    '2025-08-28', // 6일 전
    '2025-08-27', // 7일 전
  ];
  
  for (const testDate of testDates) {
    console.log(`\n=== ${testDate} 날짜 테스트 ===`);
    
    // 날짜 입력 필드에 테스트 날짜 입력
    await page.locator('input[type="date"]').fill(testDate);
    
    // 필터 적용 버튼 클릭
    await page.locator('text=필터 적용').click();
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 테이블 데이터 확인
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    console.log(`  ${testDate} 테이블 행 수: ${rowCount}`);
    
    if (rowCount > 0) {
      console.log(`  ✅ ${testDate}에 데이터가 있습니다!`);
      
      // 첫 번째 행의 데이터 확인
      const firstRow = tableRows.first();
      
      try {
        // 직원 이름
        const employeeName = await firstRow.locator('td:first-child .text-sm.font-medium.text-gray-900').textContent();
        console.log(`    직원 이름: ${employeeName}`);
        
        // 스케줄 정보
        const scheduleInfo = await firstRow.locator('td:nth-child(2) .text-xs.text-gray-500').textContent();
        console.log(`    스케줄 정보: ${scheduleInfo}`);
        
        // 실제 출근 정보
        const actualClockInInfo = await firstRow.locator('td:nth-child(3) .text-xs.text-gray-500').textContent();
        console.log(`    실제 출근 정보: ${actualClockInInfo}`);
        
        // 점심 휴식 정보
        const breakInfo = await firstRow.locator('td:nth-child(4) .text-xs.text-gray-500').textContent();
        console.log(`    점심 휴식 정보: ${breakInfo}`);
        
        // 실제 퇴근 정보
        const actualClockOutInfo = await firstRow.locator('td:nth-child(5) .text-xs.text-gray-500').textContent();
        console.log(`    실제 퇴근 정보: ${actualClockOutInfo}`);
        
        // 근무 시간
        const workHours = await firstRow.locator('td:nth-child(6) .text-sm').textContent();
        console.log(`    근무 시간: ${workHours}`);
        
        // 상태
        const status = await firstRow.locator('td:nth-child(8) span span:last-child').textContent();
        console.log(`    상태: ${status}`);
        
        // 요약 카드 상태 확인
        const completedCount = await page.locator('text=출근 완료').locator('..').locator('.text-2xl').textContent();
        const workingCount = await page.locator('text=근무 중').locator('..').locator('.text-2xl').textContent();
        const notAttendedCount = await page.locator('text=미출근').locator('..').locator('.text-2xl').textContent();
        
        console.log(`    출근 완료: ${completedCount}, 근무 중: ${workingCount}, 미출근: ${notAttendedCount}`);
        
        // 데이터가 발견되었으므로 루프 종료
        break;
        
      } catch (error) {
        console.log(`    데이터 읽기 오류: ${error}`);
      }
    } else {
      console.log(`  ❌ ${testDate}에 데이터가 없습니다.`);
    }
  }
  
  // 3. 오늘 날짜로 다시 설정
  console.log('\n=== 3. 오늘 날짜로 다시 설정 ===');
  
  const today = new Date().toISOString().split('T')[0];
  console.log('오늘 날짜로 설정:', today);
  
  await page.locator('input[type="date"]').fill(today);
  await page.locator('text=필터 적용').click();
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const finalTableRows = page.locator('tbody tr');
  const finalRowCount = await finalTableRows.count();
  console.log(`최종 테이블 행 수: ${finalRowCount}`);
  
  // 4. 최종 스크린샷 저장
  console.log('=== 4. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-data-existence.png', fullPage: true });
  console.log('✅ 데이터 존재 여부 확인 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 데이터 존재 여부 확인 완료 ===');
});
