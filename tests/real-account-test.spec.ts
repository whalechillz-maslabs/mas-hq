import { test, expect } from '@playwright/test';

test.describe('실제 계정으로 출근 관리 페이지 최종 검증', () => {
  test('김탁수(관리자) 계정으로 로그인 후 출근 관리 페이지 검증', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 김탁수 계정으로 로그인
    const phoneInput = page.locator('input[type="tel"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await phoneInput.fill('010-6669-9000');
    await passwordInput.fill('66699000');
    await loginButton.click();
    
    // 로그인 후 대기
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('김탁수 로그인 후 현재 URL:', currentUrl);
    
    // 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'attendance-kim-taksoo.png', fullPage: true });
    
    // 출근 관리 페이지 URL 확인
    const attendanceUrl = page.url();
    console.log('김탁수 출근 관리 페이지 URL:', attendanceUrl);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('김탁수 출근 관리 페이지 제목:', title);
    
    // 주요 UI 요소 검증
    await validateAttendancePage(page, '김탁수');
  });

  test('허상원 계정으로 로그인 후 출근 관리 페이지 검증', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 허상원 계정으로 로그인
    const phoneInput = page.locator('input[type="tel"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await phoneInput.fill('010-8948-4501');
    await passwordInput.fill('89484501');
    await loginButton.click();
    
    // 로그인 후 대기
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('허상원 로그인 후 현재 URL:', currentUrl);
    
    // 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'attendance-heo-sangwon.png', fullPage: true });
    
    // 출근 관리 페이지 URL 확인
    const attendanceUrl = page.url();
    console.log('허상원 출근 관리 페이지 URL:', attendanceUrl);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('허상원 출근 관리 페이지 제목:', title);
    
    // 주요 UI 요소 검증
    await validateAttendancePage(page, '허상원');
  });
});

async function validateAttendancePage(page: any, userName: string) {
  console.log(`=== ${userName} 출근 관리 페이지 검증 시작 ===`);
  
  // 1. 페이지 제목 확인
  const pageTitle = await page.locator('h1, .text-2xl, .text-3xl').first().textContent();
  console.log(`${userName} 페이지 제목:`, pageTitle);
  
  // 2. 사용자 정보 확인
  const userInfo = await page.locator(`text=${userName}`).count();
  console.log(`${userName} 사용자 정보 표시:`, userInfo > 0 ? '✅' : '❌');
  
  // 3. 오늘 근무 요약 섹션 확인
  const todaySummary = await page.locator('text=오늘 근무 요약').count();
  console.log(`${userName} 오늘 근무 요약 섹션:`, todaySummary > 0 ? '✅' : '❌');
  
  // 4. 3개 메트릭 확인 (스케줄 시간, 실제 근무 시간, 시간 차이)
  const metrics = await page.locator('.grid.grid-cols-2.md\\:grid-cols-3 > div').count();
  console.log(`${userName} 메트릭 개수:`, metrics);
  
  // 5. 각 메트릭의 라벨 확인
  const scheduledTimeLabel = await page.locator('text=스케줄 시간').count();
  const actualWorkTimeLabel = await page.locator('text=실제 근무 시간').count();
  const timeDifferenceLabel = await page.locator('text=시간 차이').count();
  
  console.log(`${userName} 스케줄 시간 라벨:`, scheduledTimeLabel > 0 ? '✅' : '❌');
  console.log(`${userName} 실제 근무 시간 라벨:`, actualWorkTimeLabel > 0 ? '✅' : '❌');
  console.log(`${userName} 시간 차이 라벨:`, timeDifferenceLabel > 0 ? '✅' : '❌');
  
  // 6. 오늘의 근무 요약 섹션 확인
  const workSummary = await page.locator('text=오늘의 근무 요약').count();
  console.log(`${userName} 오늘의 근무 요약:`, workSummary > 0 ? '✅' : '❌');
  
  // 7. 근무 블록 확인
  const workBlocks = await page.locator('.bg-white.rounded-2xl').count();
  console.log(`${userName} 근무 블록 개수:`, workBlocks);
  
  // 8. 이번 달 출근 요약 섹션 확인
  const monthlySummary = await page.locator('text=이번 달 출근 요약').count();
  console.log(`${userName} 이번 달 출근 요약:`, monthlySummary > 0 ? '✅' : '❌');
  
  // 9. 최근 7일 요약 섹션 확인
  const weeklySummary = await page.locator('text=최근 7일 요약').count();
  console.log(`${userName} 최근 7일 요약:`, weeklySummary > 0 ? '✅' : '❌');
  
  // 10. 간단한 출근 관리 섹션 확인
  const simpleAttendance = await page.locator('text=간단한 출근 관리').count();
  console.log(`${userName} 간단한 출근 관리:`, simpleAttendance > 0 ? '✅' : '❌');
  
  // 11. 중복 표시 문제 해결 확인 (가장 중요!)
  const duplicateTime = await page.locator('text=7.5시간 / 7.5시간 7.5시간').count();
  console.log(`${userName} 중복 표시 문제:`, duplicateTime === 0 ? '✅ 해결됨' : '❌ 여전히 존재');
  
  // 12. 새로운 표시 방식 확인
  const scheduleLabel = await page.locator('text=스케줄:').count();
  const actualLabel = await page.locator('text=실제:').count();
  console.log(`${userName} 스케줄: 라벨:`, scheduleLabel > 0 ? '✅' : '❌');
  console.log(`${userName} 실제: 라벨:`, actualLabel > 0 ? '✅' : '❌');
  
  // 13. 불필요한 요소들이 제거되었는지 확인
  const removedElements = [
    '진행 중', '대기 중', '연속 근무', '예상:', '총 스케줄'
  ];
  
  for (const element of removedElements) {
    const count = await page.locator(`text=${element}`).count();
    console.log(`${userName} 제거된 요소 "${element}":`, count === 0 ? '✅ 제거됨' : '❌ 여전히 존재');
  }
  
  // 14. 시간 차이 툴팁 확인
  const timeDifferenceMetric = page.locator('.text-purple-600').first();
  if (await timeDifferenceMetric.count() > 0) {
    await timeDifferenceMetric.hover();
    await page.waitForTimeout(1000);
    
    const tooltip = await page.locator('text=실제 근무 시간 - 스케줄 시간').count();
    console.log(`${userName} 시간 차이 툴팁:`, tooltip > 0 ? '✅' : '❌');
  }
  
  // 15. 모바일 반응형 확인
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(2000);
  
  const mobileScreenshot = await page.screenshot({ path: `attendance-${userName}-mobile.png` });
  console.log(`${userName} 모바일 뷰 스크린샷 저장 완료`);
  
  console.log(`=== ${userName} 출근 관리 페이지 검증 완료 ===`);
}
