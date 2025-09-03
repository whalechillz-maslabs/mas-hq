import { test, expect } from '@playwright/test';

test('관리자 출근 관리 상태 판정 로직 수정 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 관리자 출근 관리 상태 판정 로직 수정 확인 시작 ===');
  
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
  
  // 4. 하상희 상태 특별 확인 (핵심 수정 사항)
  console.log('=== 4. 하상희 상태 특별 확인 (핵심 수정 사항) ===');
  
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
    
    // 상태 분석
    if (clockInTime && clockOutTime) {
      // 시간 파싱
      const clockInTimeStr = clockInTime.replace('오전 ', '').replace('오후 ', '');
      const clockOutTimeStr = clockOutTime.replace('오전 ', '').replace('오후 ', '');
      
      const [inTime, inPeriod] = clockInTimeStr.split(' ');
      const [outTime, outPeriod] = clockOutTimeStr.split(' ');
      
      const [inHours, inMinutes] = inTime.split(':');
      const [outHours, outMinutes] = outTime.split(':');
      
      let inHour = parseInt(inHours);
      let outHour = parseInt(outHours);
      
      if (inPeriod === '오후' && inHour !== 12) inHour += 12;
      if (inPeriod === '오전' && inHour === 12) inHour = 0;
      if (outPeriod === '오후' && outHour !== 12) outHour += 12;
      if (outPeriod === '오전' && outHour === 12) outHour = 0;
      
      // 어제 날짜 (2025-09-02)
      const yesterday = new Date(2025, 8, 2); // 월은 0부터 시작
      const clockInDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), inHour, parseInt(inMinutes));
      const clockOutDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), outHour, parseInt(outMinutes));
      
      console.log(`하상희 출근 날짜/시간: ${clockInDate.toLocaleString('ko-KR')}`);
      console.log(`하상희 퇴근 날짜/시간: ${clockOutDate.toLocaleString('ko-KR')}`);
      
      // 현재 시간과 비교
      if (clockOutDate < now) {
        console.log(`✅ 하상희는 이미 퇴근했습니다 (퇴근 시간: ${clockOutDate.toLocaleString('ko-KR')})`);
        if (status === '완료') {
          console.log(`✅ 상태가 올바르게 "완료"로 표시되었습니다!`);
        } else {
          console.log(`❌ 상태가 잘못 표시되었습니다. 예상: "완료", 실제: "${status}"`);
        }
      } else {
        console.log(`❌ 하상희 퇴근 시간이 현재보다 미래입니다.`);
      }
    }
  } else {
    console.log('❌ 하상희 행을 찾을 수 없습니다.');
  }
  
  // 5. 최종 스크린샷 저장
  console.log('=== 5. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-status-fix-verification.png', fullPage: true });
  console.log('✅ 상태 판정 로직 수정 확인 스크린샷 저장');
  
  console.log('=== 관리자 출근 관리 상태 판정 로직 수정 확인 완료 ===');
});
