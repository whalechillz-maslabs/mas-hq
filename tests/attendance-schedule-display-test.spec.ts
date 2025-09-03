import { test, expect } from '@playwright/test';

test('출근 관리 스케줄 표시 문제 진단', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 출근 관리 스케줄 표시 문제 진단 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 스케줄 섹션 확인
  console.log('=== 1. 스케줄 섹션 확인 ===');
  
  // "오늘의 근무 스케줄" 섹션 찾기
  const scheduleSection = page.locator('text=오늘의 근무 스케줄');
  const sectionExists = await scheduleSection.count() > 0;
  console.log('스케줄 섹션 존재:', sectionExists);
  
  if (sectionExists) {
    // 스케줄 섹션의 전체 내용 확인
    const sectionContent = await scheduleSection.locator('..').textContent();
    console.log('스케줄 섹션 내용:', sectionContent);
    
    // "--:-- - --:--" 패턴 찾기
    const dashPattern = sectionContent?.includes('--:--');
    console.log('"--:--" 패턴 존재:', dashPattern);
    
    if (dashPattern) {
      console.log('❌ 문제 발견: "--:--" 패턴이 스케줄에 표시됨');
    }
  }
  
  // 2. 스케줄 카드들 확인
  console.log('=== 2. 스케줄 카드들 확인 ===');
  
  // 스케줄 카드들 찾기
  const scheduleCards = page.locator('text=오늘의 근무 스케줄').locator('..').locator('.space-y-2 > div');
  const cardCount = await scheduleCards.count();
  console.log('스케줄 카드 수:', cardCount);
  
  for (let i = 0; i < cardCount; i++) {
    const card = scheduleCards.nth(i);
    const cardText = await card.textContent();
    console.log(`카드 ${i + 1}: ${cardText}`);
    
    // "--:--" 패턴이 있는지 확인
    if (cardText?.includes('--:--')) {
      console.log(`❌ 카드 ${i + 1}에 "--:--" 패턴 발견!`);
      
      // 카드 내부 구조 분석
      const timeElements = card.locator('text=--:--');
      const timeCount = await timeElements.count();
      console.log(`  - "--:--" 요소 수: ${timeCount}`);
      
      // 시간 관련 요소들 찾기
      const timeRelatedElements = card.locator('*');
      const elementCount = await timeRelatedElements.count();
      console.log(`  - 총 요소 수: ${elementCount}`);
      
      for (let j = 0; j < elementCount; j++) {
        const element = timeRelatedElements.nth(j);
        const elementText = await element.textContent();
        const elementTag = await element.evaluate(el => el.tagName);
        const elementClass = await element.getAttribute('class');
        
        if (elementText?.includes('--:--')) {
          console.log(`    요소 ${j + 1}: <${elementTag}> "${elementText}" (클래스: ${elementClass})`);
        }
      }
    }
  }
  
  // 3. 네트워크 요청 확인
  console.log('=== 3. 네트워크 요청 확인 ===');
  
  // 페이지 새로고침으로 네트워크 요청 모니터링
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Supabase 관련 요청 확인
  const networkRequests = await page.evaluate(() => {
    return (window as any).performance?.getEntriesByType?.('resource') || [];
  });
  
  const supabaseRequests = networkRequests.filter((req: any) => 
    req.name?.includes('supabase') || req.name?.includes('schedules')
  );
  
  console.log('Supabase 관련 요청 수:', supabaseRequests.length);
  
  if (supabaseRequests.length > 0) {
    supabaseRequests.forEach((req: any, index: number) => {
      console.log(`  ${index + 1}. ${req.name}`);
    });
  }
  
  // 4. 디버깅 정보 확인
  console.log('=== 4. 디버깅 정보 확인 ===');
  
  const debugInfo = await page.locator('text=디버깅 정보').locator('..').textContent();
  console.log('디버깅 정보:', debugInfo);
  
  // 5. 스케줄 데이터 직접 확인
  console.log('=== 5. 스케줄 데이터 직접 확인 ===');
  
  // 페이지에서 스케줄 관련 데이터 추출
  const scheduleData = await page.evaluate(() => {
    // React 컴포넌트의 상태나 props에 접근 시도
    const scheduleElements = document.querySelectorAll('[class*="schedule"], [class*="time"], [class*="card"]');
    const scheduleInfo = [];
    
    scheduleElements.forEach((el, index) => {
      const text = el.textContent;
      const className = el.className;
      const tagName = el.tagName;
      
      if (text && (text.includes('--:--') || text.includes('스케줄') || text.includes('시간'))) {
        scheduleInfo.push({
          index,
          tagName,
          className,
          text: text.trim()
        });
      }
    });
    
    return scheduleInfo;
  });
  
  console.log('스케줄 관련 요소들:', scheduleData);
  
  // 6. 문제 해결을 위한 스크린샷
  console.log('=== 6. 문제 해결을 위한 스크린샷 ===');
  
  await page.screenshot({ path: 'playwright-report/attendance-schedule-problem.png', fullPage: true });
  console.log('✅ 스케줄 문제 진단 스크린샷 저장');
  
  console.log('=== 출근 관리 스케줄 표시 문제 진단 완료 ===');
});
