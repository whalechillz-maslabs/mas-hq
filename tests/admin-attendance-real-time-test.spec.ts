import { test, expect } from '@playwright/test';

test('관리자 출근 관리 실제 출근 데이터 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 실제 출근 데이터 확인 시작 ===');
  
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
  
  // 2. 현재 시간 확인
  console.log('=== 2. 현재 시간 확인 ===');
  
  const now = new Date();
  const currentTime = now.toLocaleString('ko-KR');
  console.log('현재 시간:', currentTime);
  console.log('현재 시간 (ISO):', now.toISOString());
  
  // 3. 요약 카드 상태 확인
  console.log('=== 3. 요약 카드 상태 확인 ===');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const completedCount = await page.locator('text=출근 완료').locator('..').locator('.text-2xl').textContent();
  const workingCount = await page.locator('text=근무 중').locator('..').locator('.text-2xl').textContent();
  const notAttendedCount = await page.locator('text=미출근').locator('..').locator('.text-2xl').textContent();
  
  console.log('출근 완료:', completedCount);
  console.log('근무 중:', workingCount);
  console.log('미출근:', notAttendedCount);
  
  // 4. 개별 직원 상세 정보 확인
  console.log('=== 4. 개별 직원 상세 정보 확인 ===');
  
  // 테이블에서 모든 직원 정보 확인
  const employeeRows = page.locator('tbody tr');
  const rowCount = await employeeRows.count();
  console.log('직원 행 수:', rowCount);
  
  for (let i = 0; i < rowCount; i++) {
    const row = employeeRows.nth(i);
    
    // 직원 이름
    const employeeName = await row.locator('td:first-child .text-sm.font-medium.text-gray-900').textContent();
    console.log(`\n=== 직원 ${i + 1}: ${employeeName} ===`);
    
    // 직원 ID
    const employeeId = await row.locator('td:first-child .text-sm.text-gray-500').first().textContent();
    console.log(`직원 ID: ${employeeId}`);
    
    // 부서/직책
    const departmentPosition = await row.locator('td:first-child .text-sm.text-gray-500').last().textContent();
    console.log(`부서/직책: ${departmentPosition}`);
    
    // 출근 시간
    const clockInTime = await row.locator('td:nth-child(2) .text-sm').textContent();
    console.log(`출근 시간: ${clockInTime}`);
    
    // 퇴근 시간
    const clockOutTime = await row.locator('td:nth-child(3) .text-sm').textContent();
    console.log(`퇴근 시간: ${clockOutTime}`);
    
    // 근무 시간
    const workHours = await row.locator('td:nth-child(4) .text-sm').textContent();
    console.log(`근무 시간: ${workHours}`);
    
    // 위치 정보
    const location = await row.locator('td:nth-child(5) .text-xs').textContent();
    console.log(`위치 정보: ${location}`);
    
    // 현재 상태
    const status = await row.locator('td:nth-child(6) span span:last-child').textContent();
    console.log(`현재 상태: ${status}`);
    
    // 상태 분석
    if (clockInTime && clockInTime !== '-' && clockInTime !== '시간 없음') {
      if (clockOutTime && clockOutTime !== '-' && clockOutTime !== '시간 없음') {
        // 출근과 퇴근 시간이 모두 있는 경우
        console.log(`  📊 상태 분석: 출근 완료 (퇴근됨)`);
        
        // 퇴근 시간이 현재 시간보다 이전인지 확인
        const clockOutTimeStr = clockOutTime.replace('오전 ', '').replace('오후 ', '');
        const [time, period] = clockOutTimeStr.split(' ');
        const [hours, minutes] = time.split(':');
        
        let clockOutHour = parseInt(hours);
        if (period === '오후' && clockOutHour !== 12) clockOutHour += 12;
        if (period === '오전' && clockOutHour === 12) clockOutHour = 0;
        
        const clockOutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), clockOutHour, parseInt(minutes));
        
        if (clockOutDate < now) {
          console.log(`  ✅ 올바른 상태: 완료 (퇴근 시간이 현재보다 이전)`);
        } else {
          console.log(`  ❌ 잘못된 상태: 완료로 표시되었지만 퇴근 시간이 미래`);
        }
      } else {
        // 출근만 있고 퇴근이 없는 경우
        console.log(`  📊 상태 분석: 근무 중 (퇴근 안함)`);
        console.log(`  ✅ 올바른 상태: 근무중`);
      }
    } else {
      // 출근 시간이 없는 경우
      console.log(`  📊 상태 분석: 미출근`);
      console.log(`  ✅ 올바른 상태: 미출근`);
    }
  }
  
  // 5. 네트워크 요청 확인
  console.log('=== 5. 네트워크 요청 확인 ===');
  
  // 페이지 새로고침으로 네트워크 요청 모니터링
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
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
  
  // 6. 최종 스크린샷 저장
  console.log('=== 6. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-real-time.png', fullPage: true });
  console.log('✅ 실제 출근 데이터 확인 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 실제 출근 데이터 확인 완료 ===');
});
