import { test, expect } from '@playwright/test';

test('시간대별 근무현황에서 9-10 시간대 누락 원인 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 9-10 시간대 누락 원인 확인 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. timeSlots 배열 확인
  console.log('=== 1. timeSlots 배열 확인 ===');
  
  // 페이지 소스에서 timeSlots 확인
  const pageContent = await page.content();
  
  const timeSlotPatterns = [
    /09:00.*9-10/,
    /10:00.*10-11/,
    /11:00.*11-12/,
    /12:00.*12-1/,
    /13:00.*1-2/,
    /14:00.*2-3/,
    /15:00.*3-4/,
    /16:00.*4-5/,
    /17:00.*5-6/
  ];
  
  timeSlotPatterns.forEach(pattern => {
    const matches = pageContent.match(pattern);
    if (matches) {
      console.log(`✅ ${pattern.source} 패턴 발견`);
    } else {
      console.log(`❌ ${pattern.source} 패턴 누락`);
    }
  });
  
  // 2. 시간대별 근무자 현황 섹션 확인
  console.log('=== 2. 시간대별 근무자 현황 섹션 확인 ===');
  
  const hourlyStatusSection = page.locator('h4:has-text("시간대별 근무자 현황")');
  if (await hourlyStatusSection.isVisible()) {
    console.log('✅ 시간대별 근무자 현황 섹션이 표시됩니다');
    
    // 시간대별 카드 확인
    const hourlyCards = page.locator('div.grid.grid-cols-2.sm\\:grid-cols-3.lg\\:grid-cols-4 > div');
    const hourlyCardCount = await hourlyCards.count();
    console.log('시간대별 카드 수:', hourlyCardCount);
    
    if (hourlyCardCount > 0) {
      console.log('=== 시간대별 카드 상세 분석 ===');
      
      for (let i = 0; i < hourlyCardCount; i++) {
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
        
        // 9-10 시간대 특별 확인
        if (timeLabel?.trim() === '9-10') {
          console.log('🎯 9-10 시간대를 찾았습니다!');
        }
      }
      
      // 3. 9-10 시간대 누락 확인
      console.log('=== 3. 9-10 시간대 누락 확인 ===');
      
      const nineTenCard = page.locator('div:has-text("9-10")');
      if (await nineTenCard.isVisible()) {
        console.log('✅ 9-10 시간대가 정상적으로 표시됩니다');
      } else {
        console.log('❌ 9-10 시간대가 표시되지 않습니다');
        
        // 4. 누락 원인 분석
        console.log('=== 4. 누락 원인 분석 ===');
        
        // 기존 스케줄에서 9-10 시간대 데이터 확인
        const existingSchedules = page.locator('div.p-3.rounded-lg.border');
        const scheduleCount = await existingSchedules.count();
        console.log('기존 스케줄 수:', scheduleCount);
        
        if (scheduleCount > 0) {
          // 9-10 시간대에 해당하는 스케줄 찾기
          let nineTenSchedules = 0;
          
          for (let i = 0; i < Math.min(scheduleCount, 10); i++) {
            const schedule = existingSchedules.nth(i);
            const timeText = await schedule.locator('p.font-mono').first().textContent();
            
            if (timeText && timeText.includes('09:00')) {
              nineTenSchedules++;
              console.log(`9-10 시간대 스케줄 발견: ${timeText?.trim()}`);
            }
          }
          
          console.log(`9-10 시간대 스케줄 수: ${nineTenSchedules}`);
          
          if (nineTenSchedules === 0) {
            console.log('⚠️ 9-10 시간대에 스케줄이 없어서 표시되지 않을 수 있습니다');
          }
        }
      }
      
    } else {
      console.log('❌ 시간대별 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션을 찾을 수 없습니다');
  }
  
  // 5. JavaScript 콘솔 로그 확인
  console.log('=== 5. JavaScript 콘솔 로그 확인 ===');
  
  // 콘솔 로그 수집 시작
  await page.addInitScript(() => {
    (window as any).consoleLogs = [];
    
    const originalLog = console.log;
    console.log = (...args) => {
      (window as any).consoleLogs.push({ type: 'log', args, timestamp: new Date().toISOString() });
      originalLog.apply(console, args);
    };
  });
  
  // 페이지 새로고침하여 로그 수집
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('수집된 콘솔 로그:', consoleLogs);
    
    // timeSlots 관련 로그 확인
    const timeSlotLogs = consoleLogs.filter(log => 
      log.args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('timeSlots') || arg.includes('9-10') || arg.includes('09:00'))
      )
    );
    
    if (timeSlotLogs.length > 0) {
      console.log('✅ timeSlots 관련 로그 발견:', timeSlotLogs);
    } else {
      console.log('❌ timeSlots 관련 로그가 없습니다');
    }
  } else {
    console.log('콘솔 로그가 없습니다');
  }
  
  // 6. 네트워크 요청 확인
  console.log('=== 6. 네트워크 요청 확인 ===');
  
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('schedules') || entry.name.includes('add'))
      .map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('스케줄 관련 네트워크 요청:', networkRequests);
  
  // 7. 스크린샷 저장
  console.log('=== 7. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-time-slot-missing.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-time-slot-missing.png');
  
  console.log('=== 9-10 시간대 누락 원인 확인 테스트 완료 ===');
});
