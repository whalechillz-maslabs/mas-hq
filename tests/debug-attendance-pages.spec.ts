import { test, expect } from '@playwright/test';

test('출근 관리 페이지 구조 디버깅', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  // 1. 개인별 출근 관리 페이지 확인
  console.log('=== 개인별 출근 관리 페이지 확인 ===');
  await page.goto('https://maslabs.kr/attendance');
  await page.waitForLoadState('networkidle');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/attendance-personal-debug.png' });
  
  // 페이지 제목 확인
  const pageTitle = await page.title();
  console.log('개인별 출근 관리 페이지 제목:', pageTitle);
  
  // 모든 h1, h2 태그 찾기
  const headings = page.locator('h1, h2');
  const headingCount = await headings.count();
  console.log('개인별 출근 관리 페이지 헤딩 수:', headingCount);
  
  for (let i = 0; i < headingCount; i++) {
    const heading = headings.nth(i);
    const headingText = await heading.textContent();
    const headingTag = await heading.evaluate(el => el.tagName);
    console.log(`헤딩 ${i + 1}: <${headingTag}> "${headingText}"`);
  }
  
  // 2. 팀 관리 기능 직원 출근 관리 페이지 확인
  console.log('\n=== 팀 관리 기능 직원 출근 관리 페이지 확인 ===');
  await page.goto('https://maslabs.kr/admin/attendance-management');
  await page.waitForLoadState('networkidle');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/attendance-admin-debug.png' });
  
  // 페이지 제목 확인
  const adminPageTitle = await page.title();
  console.log('팀 관리 기능 직원 출근 관리 페이지 제목:', adminPageTitle);
  
  // 모든 h1, h2 태그 찾기
  const adminHeadings = page.locator('h1, h2');
  const adminHeadingCount = await adminHeadings.count();
  console.log('팀 관리 기능 직원 출근 관리 페이지 헤딩 수:', adminHeadingCount);
  
  for (let i = 0; i < adminHeadingCount; i++) {
    const heading = adminHeadings.nth(i);
    const headingText = await heading.textContent();
    const headingTag = await heading.evaluate(el => el.tagName);
    console.log(`헤딩 ${i + 1}: <${headingTag}> "${headingText}"`);
  }
  
  // 페이지 내용 전체 확인
  const pageContent = await page.locator('body').textContent();
  console.log('\n페이지 내용 일부:', pageContent?.substring(0, 500));
  
  // 출근 관련 텍스트 찾기
  const attendanceTexts = page.locator('text=/출근|근무|스케줄|관리/');
  const attendanceCount = await attendanceTexts.count();
  console.log('출근 관련 텍스트 수:', attendanceCount);
  
  for (let i = 0; i < Math.min(attendanceCount, 10); i++) {
    const text = await attendanceTexts.nth(i).textContent();
    console.log(`출근 관련 텍스트 ${i + 1}: ${text}`);
  }
  
  console.log('출근 관리 페이지 디버깅 완료');
});
