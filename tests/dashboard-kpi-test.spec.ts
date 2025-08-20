import { test, expect } from '@playwright/test';

test('대시보드 KPI 데이터 확인 테스트', async ({ page }) => {
  console.log('🔍 대시보드 KPI 데이터 확인 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인 방법 선택 (전화번호)
  await page.click('text=전화번호');
  console.log('✅ 전화번호 로그인 방법 선택');
  
  // 3. 전화번호 입력 (관리자 계정)
  await page.fill('input[type="tel"]', '010-6669-9000');
  console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
  
  // 4. 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  console.log('✅ 관리자 비밀번호 입력: 66699000');
  
  // 5. 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 버튼 클릭');
  
  // 6. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 페이지 로딩 완료');
  
  // 7. 페이지 로딩 대기
  await page.waitForTimeout(3000);
  
  // 8. KPI 데이터 확인
  const contentViews = await page.locator('text=콘텐츠 조회수').locator('..').locator('.text-2xl').textContent();
  const teamMembers = await page.locator('text=팀원 수').locator('..').locator('.text-2xl').textContent();
  
  console.log('📊 콘텐츠 조회수:', contentViews);
  console.log('👥 팀원 수:', teamMembers);
  
  // 9. KPI가 0이 아닌지 확인
  expect(contentViews).not.toBe('₩0');
  expect(teamMembers).not.toBe('0명');
  
  console.log('✅ KPI 데이터가 정상적으로 로드됨');
  
  // 10. 관리자 메뉴 확인
  await expect(page.locator('text=관리자 전용 기능')).toBeVisible();
  await expect(page.locator('text=부서 관리')).toBeVisible();
  
  console.log('✅ 관리자 메뉴 표시 확인');
  
  // 11. 스크린샷 캡처
  await page.screenshot({ path: 'dashboard-kpi-test.png', fullPage: true });
  console.log('✅ 대시보드 KPI 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 대시보드 KPI 데이터 확인 테스트 완료!');
});
