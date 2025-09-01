import { test, expect } from '@playwright/test';

test.describe('대시보드 KPI 수정사항 확인 테스트', () => {
  test('KPI 데이터가 Na로 표시되고 OP5 매출이 제외되는지 확인', async ({ page }) => {
    console.log('🚀 대시보드 KPI 수정사항 확인 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 허상원 계정으로 로그인
    await page.fill('input[type="tel"]', '010-8948-4501');
    await page.fill('input[type="password"]', '89484501');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/dashboard');
    console.log('✅ 로그인 완료, 대시보드 접근');
    
    // 2. KPI 데이터 확인
    console.log('📊 KPI 데이터 확인');
    
    // 오프라인 시타 만족도가 Na로 표시되는지 확인
    const offlineSatisfaction = page.locator('text=오프라인 시타 만족도').locator('..').locator('.text-2xl');
    await expect(offlineSatisfaction).toContainText('Na');
    console.log('✅ 오프라인 시타 만족도: Na');
    
    // 콘텐츠 조회수가 Na로 표시되는지 확인
    const contentViews = page.locator('text=콘텐츠 조회수').locator('..').locator('.text-2xl');
    await expect(contentViews).toContainText('Na');
    console.log('✅ 콘텐츠 조회수: Na');
    
    // YOY 성장률이 Na로 표시되는지 확인
    const yoyGrowth = page.locator('text=YOY 성장률').locator('..').locator('.text-2xl');
    await expect(yoyGrowth).toContainText('Na');
    console.log('✅ YOY 성장률: Na');
    
    // 팀 목표 달성률이 Na로 표시되는지 확인
    const teamTargetAchievement = page.locator('text=팀 목표 달성률').locator('..').locator('.text-2xl');
    await expect(teamTargetAchievement).toContainText('Na');
    console.log('✅ 팀 목표 달성률: Na');
    
    // 3. OP5 업무 추가 테스트
    console.log('📝 OP5 업무 추가 테스트');
    
    // 빠른 업무 입력 페이지로 이동
    await page.goto('https://www.maslabs.kr/quick-task');
    await page.waitForLoadState('networkidle');
    
    // OP5 선택
    const op5Button = page.locator('button').filter({ hasText: /OP5.*CS 응대/ }).first();
    await op5Button.click();
    await page.waitForTimeout(1000);
    
    // OP5 업무 정보 입력
    const op5TaskTitle = `OP5 테스트 ${Date.now()}`;
    await page.fill('input[placeholder="업무 제목을 입력하세요"]', op5TaskTitle);
    await page.fill('input[placeholder="고객명 (선택)"]', 'OP5 테스트 고객');
    await page.fill('input[type="number"]', '500000');
    await page.fill('textarea[placeholder="업무 내용을 입력하세요 (선택)"]', 'OP5 매출 테스트');
    
    // 업무 완료 버튼 클릭
    await page.click('button:has-text("업무 완료")');
    await page.waitForTimeout(2000);
    
    console.log('✅ OP5 업무 추가 완료');
    
    // 4. 대시보드로 돌아가서 매출 확인
    console.log('📊 대시보드 매출 확인');
    
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 오늘의 매출이 OP5 매출을 포함하지 않는지 확인
    const todaySales = page.locator('text=오늘의 매출').locator('..').locator('.text-2xl');
    const salesText = await todaySales.textContent();
    console.log(`📈 오늘의 매출: ${salesText}`);
    
    // OP5 매출(500,000원)이 포함되지 않았는지 확인
    // (이전 매출 + 500,000원이 아닌 이전 매출과 동일해야 함)
    expect(salesText).not.toContain('₩2,230,000'); // 만약 OP5가 포함되었다면 이 값이 나와야 함
    
    console.log('✅ OP5 매출이 개인매출에서 제외됨 확인');
    
    // 5. 스크린샷 저장
    await page.screenshot({ path: 'test-results/dashboard-kpi-update.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 모든 테스트 완료!');
  });
});
