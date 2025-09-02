import { test, expect } from '@playwright/test';

test('시간대별 카드 구조 간단 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 시간대별 카드 구조 확인 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 시간대별 근무자 현황 섹션 확인
  const hourlyStatusSection = page.locator('h4:has-text("시간대별 근무자 현황")');
  if (await hourlyStatusSection.isVisible()) {
    console.log('✅ 시간대별 근무자 현황 섹션이 표시됩니다');
    
    // 2. 시간대별 카드 확인
    const hourlyCards = page.locator('div.grid.grid-cols-2.sm\\:grid-cols-3.lg\\:grid-cols-4 > div');
    const hourlyCardCount = await hourlyCards.count();
    console.log('시간대별 카드 수:', hourlyCardCount);
    
    if (hourlyCardCount > 0) {
      console.log('=== 첫 번째 카드 구조 분석 ===');
      
      const firstCard = hourlyCards.first();
      
      // 카드의 전체 HTML 구조 확인
      const cardHTML = await firstCard.innerHTML();
      console.log('첫 번째 카드 HTML:', cardHTML);
      
      // 3. 9-10 시간대 카드 찾기
      console.log('=== 9-10 시간대 카드 찾기 ===');
      
      // 모든 카드에서 9-10 텍스트 검색
      for (let i = 0; i < hourlyCardCount; i++) {
        const card = hourlyCards.nth(i);
        const cardText = await card.textContent();
        
        if (cardText?.includes('9-10')) {
          console.log(`🎯 9-10 시간대 카드 발견! (인덱스: ${i})`);
          console.log(`카드 텍스트: ${cardText?.trim()}`);
          
          // 이 카드의 근무자 수 확인
          const employeeCount = await card.locator('div.text-2xl.font-bold').textContent();
          console.log(`9-10 시간대 근무자 수: ${employeeCount?.trim()}`);
          
          // 이 카드의 설명 확인
          const description = await card.locator('div.text-xs').textContent();
          console.log(`9-10 시간대 설명: ${description?.trim()}`);
          
          break;
        }
      }
      
      // 4. 모든 시간대 라벨 확인
      console.log('=== 모든 시간대 라벨 확인 ===');
      const timeLabels = [];
      
      for (let i = 0; i < hourlyCardCount; i++) {
        const card = hourlyCards.nth(i);
        const timeLabel = await card.locator('div.font-bold.text-lg').textContent();
        timeLabels.push(timeLabel?.trim());
      }
      
      console.log('발견된 시간대 라벨:', timeLabels);
      
      // 5. 9-10이 포함되어 있는지 확인
      if (timeLabels.includes('9-10')) {
        console.log('✅ 9-10 시간대가 포함되어 있습니다');
      } else {
        console.log('❌ 9-10 시간대가 포함되어 있지 않습니다');
        console.log('누락된 시간대:', timeLabels.filter(label => !label?.includes('9-10')));
      }
      
    } else {
      console.log('❌ 시간대별 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션을 찾을 수 없습니다');
  }
  
  // 6. 스크린샷 저장
  console.log('=== 6. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-simple-check.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-simple-check.png');
  
  console.log('=== 시간대별 카드 구조 확인 완료 ===');
});
