import { test, expect } from '@playwright/test';

test('관리자 출근 관리 데이터 로딩 문제 진단', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 데이터 로딩 문제 진단 시작 ===');
  
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
  
  // 2. 페이지 로딩 및 네트워크 요청 모니터링
  console.log('=== 2. 페이지 로딩 및 네트워크 요청 모니터링 ===');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // 3. 콘솔 로그 확인
  console.log('=== 3. 콘솔 로그 확인 ===');
  
  // 콘솔 메시지 수집
  const consoleMessages = await page.evaluate(() => {
    return (window as any).console?.logs || [];
  });
  
  console.log('콘솔 메시지 수:', consoleMessages.length);
  
  // 4. 네트워크 요청 확인
  console.log('=== 4. 네트워크 요청 확인 ===');
  
  // Supabase 관련 요청 확인
  const networkRequests = await page.evaluate(() => {
    return (window as any).performance?.getEntriesByType?.('resource') || [];
  });
  
  const supabaseRequests = networkRequests.filter((req: any) => 
    req.name?.includes('supabase') || req.name?.includes('schedules')
  );
  
  console.log('Supabase 관련 요청 수:', supabaseRequests.length);
  
  if (supabaseRequests.length > 0) {
    supabaseRequests.forEach((req: any, index: number) => {
      console.log(`  ${index + 1}. ${req.name}`);
    });
  }
  
  // 5. 현재 날짜 확인
  console.log('=== 5. 현재 날짜 확인 ===');
  
  const selectedDate = await page.locator('input[type="date"]').inputValue();
  console.log('선택된 날짜:', selectedDate);
  
  const currentDate = new Date().toISOString().split('T')[0];
  console.log('현재 날짜:', currentDate);
  
  // 6. 요약 카드 상태 확인
  console.log('=== 6. 요약 카드 상태 확인 ===');
  
  const completedCount = await page.locator('text=출근 완료').locator('..').locator('.text-2xl').textContent();
  const workingCount = await page.locator('text=근무 중').locator('..').locator('.text-2xl').textContent();
  const notAttendedCount = await page.locator('text=미출근').locator('..').locator('.text-2xl').textContent();
  
  console.log('출근 완료:', completedCount);
  console.log('근무 중:', workingCount);
  console.log('미출근:', notAttendedCount);
  
  // 7. 테이블 데이터 확인
  console.log('=== 7. 테이블 데이터 확인 ===');
  
  const tableRows = page.locator('tbody tr');
  const rowCount = await tableRows.count();
  console.log('테이블 행 수:', rowCount);
  
  if (rowCount === 0) {
    console.log('❌ 테이블에 데이터가 없습니다.');
    
    // 테이블 헤더는 있는지 확인
    const tableHeaders = page.locator('thead th');
    const headerCount = await tableHeaders.count();
    console.log('테이블 헤더 수:', headerCount);
    
    // 각 헤더의 텍스트 확인
    for (let i = 0; i < headerCount; i++) {
      const headerText = await tableHeaders.nth(i).textContent();
      console.log(`  헤더 ${i + 1}: ${headerText}`);
    }
  }
  
  // 8. 날짜 변경 테스트
  console.log('=== 8. 날짜 변경 테스트 ===');
  
  // 어제 날짜로 변경
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  console.log('어제 날짜로 변경:', yesterdayStr);
  
  // 날짜 입력 필드에 어제 날짜 입력
  await page.locator('input[type="date"]').fill(yesterdayStr);
  
  // 필터 적용 버튼 클릭
  await page.locator('text=필터 적용').click();
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 어제 날짜로 변경 후 데이터 확인
  const updatedTableRows = page.locator('tbody tr');
  const updatedRowCount = await updatedTableRows.count();
  console.log('어제 날짜 변경 후 테이블 행 수:', updatedRowCount);
  
  // 9. 최종 스크린샷 저장
  console.log('=== 9. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-data-loading-diagnosis.png', fullPage: true });
  console.log('✅ 데이터 로딩 문제 진단 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 데이터 로딩 문제 진단 완료 ===');
});
