import { test, expect } from '@playwright/test';

test('9-10 시간대 시각적 개선 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 9-10 시간대 시각적 개선 확인 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 9-10 시간대 카드 찾기
  console.log('=== 1. 9-10 시간대 카드 찾기 ===');
  
  const nineTenCard = page.locator('div:has-text("9-10")').first();
  if (await nineTenCard.isVisible()) {
    console.log('✅ 9-10 시간대 카드를 찾았습니다');
    
    // 2. 9-10 시간대 시각적 특징 확인
    console.log('=== 2. 9-10 시간대 시각적 특징 확인 ===');
    
    // 시작 배지 확인
    const startBadge = nineTenCard.locator('span:has-text("시작")');
    if (await startBadge.isVisible()) {
      console.log('✅ "시작" 배지가 표시됩니다');
    } else {
      console.log('❌ "시작" 배지가 표시되지 않습니다');
    }
    
    // 파란색 강조 확인
    const blueHighlight = nineTenCard.locator('div.text-blue-600.bg-blue-50');
    if (await blueHighlight.isVisible()) {
      console.log('✅ 파란색 강조가 적용되었습니다');
    } else {
      console.log('❌ 파란색 강조가 적용되지 않았습니다');
    }
    
    // 3. 9-10 시간대 내용 확인
    console.log('=== 3. 9-10 시간대 내용 확인 ===');
    
    // 시간대 라벨
    const timeLabel = await nineTenCard.locator('div.font-bold.text-lg').textContent();
    console.log('시간대 라벨:', timeLabel?.trim());
    
    // 근무자 수
    const employeeCount = await nineTenCard.locator('div.text-2xl.font-bold').textContent();
    console.log('근무자 수:', employeeCount?.trim());
    
    // 설명
    const description = await nineTenCard.locator('div.text-xs').textContent();
    console.log('설명:', description?.trim());
    
    // 4. 다른 시간대와 비교
    console.log('=== 4. 다른 시간대와 비교 ===');
    
    const tenElevenCard = page.locator('div:has-text("10-11")').first();
    if (await tenElevenCard.isVisible()) {
      console.log('✅ 10-11 시간대 카드도 찾았습니다');
      
      // 10-11 시간대 내용
      const tenElevenLabel = await tenElevenCard.locator('div.font-bold.text-lg').textContent();
      const tenElevenCount = await tenElevenCard.locator('div.text-2xl.font-bold').textContent();
      const tenElevenDesc = await tenElevenCard.locator('div.text-xs').textContent();
      
      console.log('10-11 시간대:');
      console.log(`  - 라벨: ${tenElevenLabel?.trim()}`);
      console.log(`  - 근무자: ${tenElevenCount?.trim()}`);
      console.log(`  - 설명: ${tenElevenDesc?.trim()}`);
      
      // 시각적 차이 비교
      const nineTenClasses = await nineTenCard.getAttribute('class');
      const tenElevenClasses = await tenElevenCard.getAttribute('class');
      
      console.log('9-10 시간대 클래스:', nineTenClasses);
      console.log('10-11 시간대 클래스:', tenElevenClasses);
      
      if (nineTenClasses?.includes('text-blue-600') && !tenElevenClasses?.includes('text-blue-600')) {
        console.log('✅ 9-10 시간대가 특별히 강조되어 있습니다');
      } else {
        console.log('❌ 9-10 시간대 강조가 제대로 적용되지 않았습니다');
      }
    }
    
    // 5. 전체 시간대 현황 확인
    console.log('=== 5. 전체 시간대 현황 확인 ===');
    
    const hourlyCards = page.locator('div.grid.grid-cols-2.sm\\:grid-cols-3.lg\\:grid-cols-4 > div');
    const hourlyCardCount = await hourlyCards.count();
    console.log('전체 시간대 카드 수:', hourlyCardCount);
    
    if (hourlyCardCount > 0) {
      console.log('=== 모든 시간대 목록 ===');
      
      for (let i = 0; i < hourlyCardCount; i++) {
        const card = hourlyCards.nth(i);
        const label = await card.locator('div.font-bold.text-lg').textContent();
        const count = await card.locator('div.text-2xl.font-bold').textContent();
        
        console.log(`${i + 1}. ${label?.trim()}: ${count?.trim()}`);
      }
    }
    
  } else {
    console.log('❌ 9-10 시간대 카드를 찾을 수 없습니다');
  }
  
  // 6. 스크린샷 저장
  console.log('=== 6. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-9-10-visibility.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-9-10-visibility.png');
  
  console.log('=== 9-10 시간대 시각적 개선 확인 테스트 완료 ===');
});
