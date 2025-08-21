import { test, expect } from '@playwright/test';

test('상세 KPI 대시보드 확인 테스트', async ({ page }) => {
  console.log('🔍 상세 KPI 대시보드 확인 테스트 시작');
  
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
  
  // 8. 오늘의 미션 확인
  await expect(page.locator('text=오늘의 미션')).toBeVisible();
  await expect(page.locator('text=긍정적 사고')).toBeVisible();
  await expect(page.locator('text=창의적 열정')).toBeVisible();
  await expect(page.locator('text=헌신')).toBeVisible();
  console.log('✅ 오늘의 미션 섹션 확인');
  
  // 9. KPI 하이라이트 확인
  await expect(page.locator('text=KPI 하이라이트')).toBeVisible();
  await expect(page.locator('text=오늘의 매출')).toBeVisible();
  await expect(page.locator('text=월 누적 매출')).toBeVisible();
  await expect(page.locator('text=신규 상담')).toBeVisible();
  await expect(page.locator('text=목표 달성률')).toBeVisible();
  console.log('✅ KPI 하이라이트 섹션 확인');
  
  // 10. 개인 KPI 확인
  await expect(page.locator('text=개인 KPI')).toBeVisible();
  await expect(page.locator('text=전화 판매 건수')).toBeVisible();
  await expect(page.locator('text=오프라인 시타 만족도')).toBeVisible();
  await expect(page.locator('text=온라인 판매 성사')).toBeVisible();
  console.log('✅ 개인 KPI 섹션 확인');
  
  // 11. 팀 KPI 확인
  await expect(page.locator('text=팀 KPI')).toBeVisible();
  await expect(page.locator('text=OP팀 전체 매출')).toBeVisible();
  await expect(page.locator('text=YOY 성장률')).toBeVisible();
  await expect(page.locator('text=팀 목표 달성률')).toBeVisible();
  console.log('✅ 팀 KPI 섹션 확인');
  
  // 12. KPI 데이터 값 확인
  const todaySales = await page.locator('text=오늘의 매출').locator('..').locator('.text-2xl').textContent();
  const monthlySales = await page.locator('text=월 누적 매출').locator('..').locator('.text-2xl').textContent();
  const phoneSales = await page.locator('text=전화 판매 건수').locator('..').locator('.text-2xl').textContent();
  const teamSales = await page.locator('text=OP팀 전체 매출').locator('..').locator('.text-2xl').textContent();
  
  console.log('📊 오늘의 매출:', todaySales);
  console.log('📊 월 누적 매출:', monthlySales);
  console.log('📊 전화 판매 건수:', phoneSales);
  console.log('📊 OP팀 전체 매출:', teamSales);
  
  // 13. 데이터가 0이 아닌지 확인
  expect(todaySales).not.toBe('₩0');
  expect(monthlySales).not.toBe('₩0');
  expect(phoneSales).not.toBe('0건');
  expect(teamSales).not.toBe('₩0');
  
  console.log('✅ KPI 데이터가 정상적으로 표시됨');
  
  // 14. 스크린샷 캡처
  await page.screenshot({ path: 'detailed-kpi-test.png', fullPage: true });
  console.log('✅ 상세 KPI 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 상세 KPI 대시보드 확인 테스트 완료!');
});
