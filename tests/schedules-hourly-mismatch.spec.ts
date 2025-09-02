import { test, expect } from '@playwright/test';

test('시간대별 근무현황 데이터 불일치 문제 진단', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 시간대별 근무현황 데이터 불일치 문제 진단 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 콘솔 로그 수집 시작
  await page.addInitScript(() => {
    (window as any).consoleLogs = [];
    (window as any).jsErrors = [];
    
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      (window as any).consoleLogs.push({ type: 'log', args, timestamp: new Date().toISOString() });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      (window as any).jsErrors.push({ type: 'error', args, timestamp: new Date().toISOString() });
      originalError.apply(console, args);
    };
  });
  
  // 2. 기존 스케줄 데이터 분석
  console.log('=== 2. 기존 스케줄 데이터 분석 ===');
  
  // 기존 스케줄 제목 확인
  const existingScheduleTitle = page.locator('h3:has-text("기존 스케줄")');
  if (await existingScheduleTitle.isVisible()) {
    console.log('✅ 기존 스케줄 섹션이 표시됩니다');
    
    // 개별 스케줄 카드 확인
    const scheduleCards = page.locator('div.p-3.rounded-lg.border');
    const cardCount = await scheduleCards.count();
    console.log('스케줄 카드 수:', cardCount);
    
    if (cardCount > 0) {
      console.log('=== 개별 스케줄 카드 상세 분석 ===');
      
      const scheduleData = [];
      
      for (let i = 0; i < Math.min(cardCount, 10); i++) {
        const card = scheduleCards.nth(i);
        
        // 직원 이름 (첫 번째 font-semibold만 선택)
        const name = await card.locator('p.font-semibold').first().textContent();
        
        // 근무 시간 (font-mono 중 첫 번째)
        const workTime = await card.locator('p.font-mono').first().textContent();
        
        // 총 근무 시간 (font-mono 중 마지막)
        const totalHours = await card.locator('p.font-mono').last().textContent();
        
        scheduleData.push({
          name: name?.trim() || 'N/A',
          workTime: workTime?.trim() || 'N/A',
          totalHours: totalHours?.trim() || 'N/A'
        });
        
        console.log(`스케줄 ${i + 1}: ${name?.trim()} - ${workTime?.trim()} (${totalHours?.trim()})`);
      }
      
      // 3. 9-10 시간대 스케줄 확인
      console.log('=== 3. 9-10 시간대 스케줄 확인 ===');
      
      const nineToTenSchedules = scheduleData.filter(schedule => {
        const workTime = schedule.workTime;
        if (workTime.includes(' - ')) {
          const [start, end] = workTime.split(' - ');
          const startHour = parseInt(start.split(':')[0]);
          const endHour = parseInt(end.split(':')[0]);
          
          // 9-10 시간대에 겹치는 스케줄 확인
          return (startHour <= 9 && endHour > 9) || (startHour < 10 && endHour >= 10);
        }
        return false;
      });
      
      console.log('9-10 시간대에 겹치는 스케줄:', nineToTenSchedules);
      
      if (nineToTenSchedules.length > 0) {
        console.log('✅ 9-10 시간대에 스케줄이 있습니다');
        nineToTenSchedules.forEach(schedule => {
          console.log(`  - ${schedule.name}: ${schedule.workTime}`);
        });
      } else {
        console.log('❌ 9-10 시간대에 스케줄이 없습니다');
      }
      
    } else {
      console.log('❌ 스케줄 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 기존 스케줄 섹션을 찾을 수 없습니다');
  }
  
  // 4. 시간대별 근무자 현황 분석
  console.log('=== 4. 시간대별 근무자 현황 분석 ===');
  
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
          console.log('🎯 9-10 시간대 카드를 찾았습니다!');
          console.log(`  - 근무자 수: ${employeeCount?.trim()}`);
          
          // 9-10 시간대 카드의 상세 정보 확인
          const nineToTenCard = card;
          
          // 근무자 이름 표시 확인
          const employeeNames = nineToTenCard.locator('span.text-xs.bg-white.px-2.py-1.rounded-full.border');
          const nameCount = await employeeNames.count();
          console.log(`  - 표시된 근무자 이름 수: ${nameCount}`);
          
          if (nameCount > 0) {
            for (let j = 0; j < nameCount; j++) {
              const name = await employeeNames.nth(j).textContent();
              console.log(`    - 근무자 ${j + 1}: ${name?.trim()}`);
            }
          } else {
            console.log('  - 표시된 근무자 이름이 없습니다');
          }
        }
      }
      
      // 5. 9-10 시간대 카드가 없는지 확인
      console.log('=== 5. 9-10 시간대 카드 존재 여부 확인 ===');
      
      const nineToTenCard = page.locator('div:has-text("9-10")');
      const nineToTenExists = await nineToTenCard.count();
      
      if (nineToTenExists > 0) {
        console.log('✅ 9-10 시간대 카드가 존재합니다');
      } else {
        console.log('❌ 9-10 시간대 카드가 존재하지 않습니다');
      }
      
    } else {
      console.log('❌ 시간대별 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션을 찾을 수 없습니다');
  }
  
  // 6. timeSlots 배열 확인
  console.log('=== 6. timeSlots 배열 확인 ===');
  
  // 페이지에서 timeSlots 관련 정보 확인
  const pageContent = await page.content();
  
  // timeSlots 패턴 검색
  const timeSlotsPatterns = [
    /9-10/g,
    /10-11/g,
    /11-12/g,
    /12-1/g,
    /1-2/g,
    /2-3/g,
    /3-4/g,
    /4-5/g,
    /5-6/g
  ];
  
  timeSlotsPatterns.forEach(pattern => {
    const matches = pageContent.match(pattern);
    if (matches) {
      console.log(`✅ timeSlots 패턴 발견: ${pattern.source} (${matches.length}개)`);
    } else {
      console.log(`❌ timeSlots 패턴 누락: ${pattern.source}`);
    }
  });
  
  // 7. 콘솔 로그 확인
  console.log('=== 7. 콘솔 로그 확인 ===');
  
  // 잠시 대기하여 로그 수집
  await page.waitForTimeout(3000);
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('수집된 콘솔 로그:', consoleLogs);
    
    // getSchedulesForTimeSlot 관련 로그 확인
    const timeSlotLogs = consoleLogs.filter(log => 
      log.args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('getSchedulesForTimeSlot') || arg.includes('9-10'))
      )
    );
    
    if (timeSlotLogs.length > 0) {
      console.log('✅ 시간대별 스케줄 관련 로그 발견:', timeSlotLogs);
    } else {
      console.log('❌ 시간대별 스케줄 관련 로그가 없습니다');
    }
  } else {
    console.log('콘솔 로그가 없습니다.');
  }
  
  // 8. JavaScript 오류 확인
  const jsErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다.');
  }
  
  // 9. 스크린샷 저장
  console.log('=== 9. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-hourly-mismatch.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-hourly-mismatch.png');
  
  console.log('=== 시간대별 근무현황 데이터 불일치 문제 진단 완료 ===');
});
