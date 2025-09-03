import { test, expect } from '@playwright/test';

test('개선된 관리자 출근 관리 페이지 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인 (관리자)
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/dashboard');
  
  console.log('=== 개선된 관리자 출근 관리 페이지 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 대시보드에서 팀 관리 기능 확인
  console.log('=== 1. 대시보드에서 팀 관리 기능 확인 ===');
  
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
  
  // 2. 관리자 출근 관리 페이지 확인
  console.log('=== 2. 관리자 출근 관리 페이지 확인 ===');
  
  // 페이지 제목 확인
  const pageTitle = await page.locator('h1').textContent();
  console.log('페이지 제목:', pageTitle);
  
  // 페이지 설명 확인
  const pageDescription = await page.locator('p.text-gray-600').textContent();
  console.log('페이지 설명:', pageDescription);
  
  // 3. 시간 표시 기능 테스트
  console.log('=== 3. 시간 표시 기능 테스트 ===');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 시간 관련 요소들 확인
  const timeElements = page.locator('text=시간 없음, text=시간 오류');
  const hasTimeErrorElements = await timeElements.count() > 0;
  console.log('시간 에러 요소 존재:', hasTimeErrorElements);
  
  if (hasTimeErrorElements) {
    console.log('✅ 개선됨: "--" 대신 명확한 에러 메시지 표시');
  }
  
  // 4. 필터 및 검색 기능 확인
  console.log('=== 4. 필터 및 검색 기능 확인 ===');
  
  // 날짜 필터 확인
  const dateFilter = page.locator('input[type="date"]');
  const dateFilterExists = await dateFilter.count() > 0;
  console.log('날짜 필터 존재:', dateFilterExists);
  
  // 부서 필터 확인
  const departmentFilter = page.locator('select');
  const departmentFilterExists = await departmentFilter.count() > 0;
  console.log('부서 필터 존재:', departmentFilterExists);
  
  // 검색 기능 확인
  const searchInput = page.locator('input[placeholder*="검색"]');
  const searchExists = await searchInput.count() > 0;
  console.log('검색 기능 존재:', searchExists);
  
  // 5. 엑셀 다운로드 기능 확인
  console.log('=== 5. 엑셀 다운로드 기능 확인 ===');
  
  const excelDownloadButton = page.locator('button:has-text("엑셀 다운로드")');
  const downloadButtonExists = await excelDownloadButton.count() > 0;
  console.log('엑셀 다운로드 버튼 존재:', downloadButtonExists);
  
  // 6. 최종 스크린샷 저장
  console.log('=== 6. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/admin-attendance-improved.png', fullPage: true });
  console.log('✅ 개선된 관리자 출근 관리 페이지 스크린샷 저장');
  
  console.log('=== 개선된 관리자 출근 관리 페이지 테스트 완료 ===');
});
