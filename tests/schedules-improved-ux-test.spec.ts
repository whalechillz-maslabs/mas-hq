import { test, expect } from '@playwright/test';

test('개선된 스케줄 UX/UI 테스트 - 통합 표시 및 모바일 최적화', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 개선된 스케줄 UX/UI 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 통합된 스케줄 표시 확인
  console.log('=== 1. 통합된 스케줄 표시 확인 ===');
  
  // 기존 스케줄 제목 확인
  const existingScheduleTitle = page.locator('h3:has-text("기존 스케줄")');
  if (await existingScheduleTitle.isVisible()) {
    console.log('✅ 기존 스케줄 섹션이 표시됩니다');
    
    // 통합된 스케줄 카드 확인
    const scheduleCards = page.locator('div.p-3.rounded-lg.border');
    const cardCount = await scheduleCards.count();
    console.log('통합된 스케줄 카드 수:', cardCount);
    
    if (cardCount > 0) {
      console.log('=== 통합된 스케줄 카드 분석 ===');
      
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = scheduleCards.nth(i);
        
        // 직원 이름
        const name = await card.locator('p.font-semibold').textContent();
        
        // 연속 표시 배지
        const continuousBadge = card.locator('span:has-text("연속")');
        const hasContinuousBadge = await continuousBadge.isVisible();
        
        // 근무 시간
        const workTime = await card.locator('p.font-mono').first().textContent();
        
        // 총 근무 시간
        const totalHours = await card.locator('p.font-mono').last().textContent();
        
        // 통합된 시간대 수
        const scheduleCount = await card.locator('p:has-text("개 시간대 통합")').textContent();
        
        console.log(`스케줄 ${i + 1}:`);
        console.log(`  - 이름: ${name?.trim()}`);
        console.log(`  - 연속 표시: ${hasContinuousBadge ? '✅' : '❌'}`);
        console.log(`  - 근무 시간: ${workTime?.trim()}`);
        console.log(`  - 총 근무: ${totalHours?.trim()}`);
        console.log(`  - 통합 정보: ${scheduleCount?.trim()}`);
      }
      
      // 2. 중복 제거 확인
      console.log('=== 2. 중복 제거 확인 ===');
      
      if (cardCount < 10) {
        console.log('✅ 중복이 제거되었습니다!');
        console.log(`이전: 40개 개별 카드 → 현재: ${cardCount}개 통합 카드`);
      } else {
        console.log('❌ 아직 중복이 제거되지 않았습니다.');
      }
      
    } else {
      console.log('❌ 통합된 스케줄 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 기존 스케줄 섹션을 찾을 수 없습니다');
  }
  
  // 3. 시간대별 근무자 현황 개선 확인
  console.log('=== 3. 시간대별 근무자 현황 개선 확인 ===');
  
  const hourlyStatusSection = page.locator('h4:has-text("시간대별 근무자 현황")');
  if (await hourlyStatusSection.isVisible()) {
    console.log('✅ 시간대별 근무자 현황 섹션이 표시됩니다');
    
    // 시간대별 카드 확인
    const hourlyCards = page.locator('div.grid.grid-cols-2.sm\\:grid-cols-3.lg\\:grid-cols-4 > div');
    const hourlyCardCount = await hourlyCards.count();
    console.log('시간대별 카드 수:', hourlyCardCount);
    
    if (hourlyCardCount > 0) {
      console.log('=== 시간대별 카드 분석 ===');
      
      for (let i = 0; i < Math.min(hourlyCardCount, 3); i++) {
        const card = hourlyCards.nth(i);
        
        // 시간대 라벨
        const timeLabel = await card.locator('div.font-bold.text-lg').textContent();
        
        // 근무자 수
        const employeeCount = await card.locator('div.text-2xl.font-bold').textContent();
        
        // 설명
        const description = await card.locator('div.text-xs.opacity-75').textContent();
        
        console.log(`시간대 ${i + 1}:`);
        console.log(`  - 라벨: ${timeLabel?.trim()}`);
        console.log(`  - 근무자: ${employeeCount?.trim()}`);
        console.log(`  - 설명: ${description?.trim()}`);
      }
      
      // 전체 요약 확인
      const totalSummary = page.locator('div.bg-blue-50.rounded-xl');
      if (await totalSummary.isVisible()) {
        console.log('✅ 전체 요약 섹션이 표시됩니다');
        
        const totalEmployees = await totalSummary.locator('span.text-lg.font-bold').textContent();
        const totalSchedules = await totalSummary.locator('div.text-xs.text-blue-600').textContent();
        
        console.log(`전체 근무자: ${totalEmployees?.trim()}`);
        console.log(`전체 스케줄: ${totalSchedules?.trim()}`);
      } else {
        console.log('❌ 전체 요약 섹션이 표시되지 않습니다');
      }
      
    } else {
      console.log('❌ 시간대별 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션을 찾을 수 없습니다');
  }
  
  // 4. 모바일 최적화 확인
  console.log('=== 4. 모바일 최적화 확인 ===');
  
  // 반응형 클래스 확인
  const responsiveClasses = [
    'grid-cols-1 xl:grid-cols-2',
    'order-2 xl:order-1',
    'order-1 xl:order-2',
    'text-sm sm:text-base',
    'text-xs sm:text-sm',
    'p-2 sm:p-3'
  ];
  
  const pageContent = await page.content();
  responsiveClasses.forEach(className => {
    if (pageContent.includes(className)) {
      console.log(`✅ 반응형 클래스 발견: ${className}`);
    } else {
      console.log(`❌ 반응형 클래스 누락: ${className}`);
    }
  });
  
  // 5. 상호작용 기능 확인
  console.log('=== 5. 상호작용 기능 확인 ===');
  
  // 상세보기 버튼
  const detailButtons = page.locator('button:has-text("상세보기")');
  const detailButtonCount = await detailButtons.count();
  console.log('상세보기 버튼 수:', detailButtonCount);
  
  if (detailButtonCount > 0) {
    console.log('✅ 상세보기 기능이 구현되었습니다');
  } else {
    console.log('❌ 상세보기 기능이 구현되지 않았습니다');
  }
  
  // 시간대별 카드 클릭 기능
  const clickableHourlyCards = page.locator('div.cursor-pointer');
  const clickableCount = await clickableHourlyCards.count();
  console.log('클릭 가능한 시간대별 카드 수:', clickableCount);
  
  if (clickableCount > 0) {
    console.log('✅ 시간대별 카드 클릭 기능이 구현되었습니다');
  } else {
    console.log('❌ 시간대별 카드 클릭 기능이 구현되지 않았습니다');
  }
  
  // 6. 시각적 개선 확인
  console.log('=== 6. 시각적 개선 확인 ===');
  
  // 호버 효과
  const hoverEffects = page.locator('div.hover\\:shadow-md, div.hover\\:scale-105');
  const hoverEffectCount = await hoverEffects.count();
  console.log('호버 효과가 적용된 요소 수:', hoverEffectCount);
  
  if (hoverEffectCount > 0) {
    console.log('✅ 호버 효과가 구현되었습니다');
  } else {
    console.log('❌ 호버 효과가 구현되지 않았습니다');
  }
  
  // 전환 효과
  const transitionEffects = page.locator('div.transition-all');
  const transitionEffectCount = await transitionEffects.count();
  console.log('전환 효과가 적용된 요소 수:', transitionEffectCount);
  
  if (transitionEffectCount > 0) {
    console.log('✅ 전환 효과가 구현되었습니다');
  } else {
    console.log('❌ 전환 효과가 구현되지 않았습니다');
  }
  
  // 7. 스크린샷 저장
  console.log('=== 7. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-improved-ux.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-improved-ux.png');
  
  console.log('=== 개선된 스케줄 UX/UI 테스트 완료 ===');
});
