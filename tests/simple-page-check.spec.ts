import { test, expect } from '@playwright/test';

test('출근 관리 페이지 간단한 구조 확인', async ({ page }) => {
  // 출근 관리 페이지로 이동
  await page.goto('https://www.maslabs.kr/attendance');
  
  // 페이지 로딩 대기 (더 오래)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(10000); // 10초 대기
  
  // DOM이 완전히 로드될 때까지 대기
  await page.waitForFunction(() => {
    const body = document.querySelector('body');
    return document.readyState === 'complete' && 
           body && body.textContent && body.textContent.length > 1000;
  }, { timeout: 30000 });
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'attendance-page-screenshot.png', fullPage: true });
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // 모든 텍스트 내용 확인
  const allText = await page.locator('body').textContent();
  console.log('페이지 전체 텍스트:', allText?.substring(0, 1000));
  
  // 주요 섹션들 확인
  const sections = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
  console.log('페이지 섹션들:', sections);
  
  // 현재 시간 표시 확인
  const currentTime = await page.locator('text=현재 시간').count();
  console.log('현재 시간 표시 개수:', currentTime);
  
  // 출근 관리 텍스트 확인
  const attendanceText = await page.locator('text=출근 관리').count();
  console.log('출근 관리 텍스트 개수:', attendanceText);
  
  // 허상원 텍스트 확인
  const heoSangwon = await page.locator('text=허상원').count();
  console.log('허상원 텍스트 개수:', heoSangwon);
  
  // HEO 텍스트 확인
  const heo = await page.locator('text=HEO').count();
  console.log('HEO 텍스트 개수:', heo);
  
  // 오늘 근무 시간 텍스트 확인
  const todayWorkTime = await page.locator('text=오늘 근무 시간').count();
  console.log('오늘 근무 시간 텍스트 개수:', todayWorkTime);
  
  // 7.5 텍스트 확인
  const sevenFive = await page.locator('text=7.5').count();
  console.log('7.5 텍스트 개수:', sevenFive);
  
  // 스케줄 시간 텍스트 확인
  const scheduledTime = await page.locator('text=스케줄 시간').count();
  console.log('스케줄 시간 텍스트 개수:', scheduledTime);
  
  // 실제 근무 시간 텍스트 확인
  const actualWorkTime = await page.locator('text=실제 근무 시간').count();
  console.log('실제 근무 시간 텍스트 개수:', actualWorkTime);
  
  // 시간 차이 텍스트 확인
  const timeDifference = await page.locator('text=시간 차이').count();
  console.log('시간 차이 텍스트 개수:', timeDifference);
  
  // 오늘의 근무 요약 텍스트 확인
  const todayWorkSummary = await page.locator('text=오늘의 근무 요약').count();
  console.log('오늘의 근무 요약 텍스트 개수:', todayWorkSummary);
  
  // 이번 달 출근 요약 텍스트 확인
  const monthlySummary = await page.locator('text=이번 달 출근 요약').count();
  console.log('이번 달 출근 요약 텍스트 개수:', monthlySummary);
  
  // 최근 7일 요약 텍스트 확인
  const weeklySummary = await page.locator('text=최근 7일 요약').count();
  console.log('최근 7일 요약 텍스트 개수:', weeklySummary);
  
  // 간단한 출근 관리 텍스트 확인
  const simpleAttendance = await page.locator('text=간단한 출근 관리').count();
  console.log('간단한 출근 관리 텍스트 개수:', simpleAttendance);
  
  // 근무 완료 텍스트 확인
  const workCompleted = await page.locator('text=근무 완료').count();
  console.log('근무 완료 텍스트 개수:', workCompleted);
  
  // 출근 텍스트 확인
  const clockIn = await page.locator('text=출근:').count();
  console.log('출근 텍스트 개수:', clockIn);
  
  // 퇴근 텍스트 확인
  const clockOut = await page.locator('text=퇴근:').count();
  console.log('퇴근 텍스트 개수:', clockOut);
  
  // 완료 텍스트 확인
  const completed = await page.locator('text=완료').count();
  console.log('완료 텍스트 개수:', completed);
  
  // 진행 중 텍스트 확인
  const inProgress = await page.locator('text=진행 중').count();
  console.log('진행 중 텍스트 개수:', inProgress);
  
  // 대기 중 텍스트 확인
  const pending = await page.locator('text=대기 중').count();
  console.log('대기 중 텍스트 개수:', pending);
  
  // 연속 근무 텍스트 확인
  const continuousWork = await page.locator('text=연속 근무').count();
  console.log('연속 근무 텍스트 개수:', continuousWork);
  
  // 예상 텍스트 확인
  const expected = await page.locator('text=예상:').count();
  console.log('예상 텍스트 개수:', expected);
  
  // 총 스케줄 텍스트 확인
  const totalSchedule = await page.locator('text=총 스케줄').count();
  console.log('총 스케줄 텍스트 개수:', totalSchedule);
  
  // 완료된 시간 텍스트 확인
  const completedTime = await page.locator('text=완료된 시간').count();
  console.log('완료된 시간 텍스트 개수:', completedTime);
  
  // 총 근무시간 텍스트 확인
  const totalWorkTime = await page.locator('text=총 근무시간').count();
  console.log('총 근무시간 텍스트 개수:', totalWorkTime);
  
  // 7.5시간 / 7.5시간 7.5시간 텍스트 확인
  const duplicateTime = await page.locator('text=7.5시간 / 7.5시간 7.5시간').count();
  console.log('7.5시간 / 7.5시간 7.5시간 텍스트 개수:', duplicateTime);
  
  // 스케줄: 텍스트 확인
  const scheduleLabel = await page.locator('text=스케줄:').count();
  console.log('스케줄: 텍스트 개수:', scheduleLabel);
  
  // 실제: 텍스트 확인
  const actualLabel = await page.locator('text=실제:').count();
  console.log('실제: 텍스트 개수:', actualLabel);
  
  // 실제 근무 텍스트 확인
  const actualWork = await page.locator('text=실제 근무').count();
  console.log('실제 근무 텍스트 개수:', actualWork);
  
  // 09:00 → 12:00 텍스트 확인
  const timeRange1 = await page.locator('text=09:00 → 12:00').count();
  console.log('09:00 → 12:00 텍스트 개수:', timeRange1);
  
  // 13:00 → 17:30 텍스트 확인
  const timeRange2 = await page.locator('text=13:00 → 17:30').count();
  console.log('13:00 → 17:30 텍스트 개수:', timeRange2);
  
  console.log('=== 페이지 구조 분석 완료 ===');
});
