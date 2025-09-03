import { test, expect } from '@playwright/test';

test('관리자 출근 관리 최종 진단 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 최종 진단 테스트 시작 ===');
  
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
  await page.waitForTimeout(8000); // 진단 로직이 실행될 시간 확보
  
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
  
  // 5. 테이블 데이터 확인
  console.log('=== 5. 테이블 데이터 확인 ===');
  
  const tableRows = page.locator('tbody tr');
  const rowCount = await tableRows.count();
  console.log('테이블 행 수:', rowCount);
  
  if (rowCount > 0) {
    console.log('✅ 테이블에 데이터가 표시되었습니다!');
    
    // 첫 번째 행의 데이터 확인
    const firstRow = tableRows.first();
    
    try {
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
      
    } catch (error) {
      console.log(`데이터 읽기 오류: ${error}`);
    }
  } else {
    console.log('❌ 테이블에 여전히 데이터가 없습니다.');
    
    // 테이블 헤더 확인
    const tableHeaders = page.locator('thead th');
    const headerCount = await tableHeaders.count();
    console.log('테이블 헤더 수:', headerCount);
    
    // 각 헤더의 텍스트 확인
    for (let i = 0; i < headerCount; i++) {
      const headerText = await tableHeaders.nth(i).textContent();
      console.log(`  헤더 ${i + 1}: ${headerText}`);
    }
    
    // 6. 데이터베이스 진단 결과 확인
    console.log('=== 6. 데이터베이스 진단 결과 확인 ===');
    
    // 페이지에 진단 로그가 표시되었는지 확인
    const diagnosticText = await page.locator('body').textContent();
    
    if (diagnosticText?.includes('데이터베이스 상태 진단 시작')) {
      console.log('✅ 데이터베이스 진단 로직이 실행되었습니다.');
      
      // 진단 결과에서 중요한 정보 추출
      if (diagnosticText?.includes('최근 10개 스케줄:')) {
        console.log('✅ 최근 스케줄 조회가 실행되었습니다.');
      }
      
      if (diagnosticText?.includes('9월 1-5일 스케줄:')) {
        console.log('✅ 날짜 범위 조회가 실행되었습니다.');
      }
    } else {
      console.log('❌ 데이터베이스 진단 로직이 실행되지 않았습니다.');
    }
  }
  
  // 7. 최종 스크린샷 저장
  console.log('=== 7. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-final-diagnosis.png', fullPage: true });
  console.log('✅ 최종 진단 테스트 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 최종 진단 테스트 완료 ===');
});
