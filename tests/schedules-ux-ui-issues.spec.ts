import { test, expect } from '@playwright/test';

test('스케줄 표시 UX/UI 문제점 확인 및 개선 방안 제시', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 스케줄 UX/UI 문제점 확인 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 기존 스케줄 섹션 분석
  console.log('=== 1. 기존 스케줄 섹션 분석 ===');
  
  // 기존 스케줄 제목 확인
  const existingScheduleTitle = page.locator('h3:has-text("기존 스케줄")');
  if (await existingScheduleTitle.isVisible()) {
    console.log('✅ 기존 스케줄 섹션이 표시됩니다');
    
    // 개별 스케줄 카드 확인
    const scheduleCards = page.locator('div.p-3.rounded-lg.border.bg-white.border-gray-200');
    const cardCount = await scheduleCards.count();
    console.log('스케줄 카드 수:', cardCount);
    
    if (cardCount > 0) {
      console.log('=== 개별 스케줄 카드 분석 ===');
      
      const scheduleData = [];
      
      for (let i = 0; i < cardCount; i++) {
        const card = scheduleCards.nth(i);
        
        // 직원 이름
        const name = await card.locator('p.font-semibold').textContent();
        
        // 시간대
        const timeSlot = await card.locator('p.text-sm.text-gray-600').textContent();
        
        // 상태
        const status = await card.locator('span.px-2.py-1.text-xs.font-semibold.rounded-full').textContent();
        
        scheduleData.push({
          name: name?.trim() || 'N/A',
          timeSlot: timeSlot?.trim() || 'N/A',
          status: status?.trim() || 'N/A'
        });
        
        console.log(`스케줄 ${i + 1}: ${name?.trim()} - ${timeSlot?.trim()} (${status?.trim()})`);
      }
      
      // 2. 중복 스케줄 패턴 분석
      console.log('=== 2. 중복 스케줄 패턴 분석 ===');
      
      const nameTimeMap = new Map();
      
      scheduleData.forEach(schedule => {
        const key = `${schedule.name}-${schedule.timeSlot}`;
        if (nameTimeMap.has(key)) {
          console.log(`❌ 중복 발견: ${schedule.name} - ${schedule.timeSlot}`);
        } else {
          nameTimeMap.set(key, schedule);
        }
      });
      
      // 3. 연속 시간대 중복 분석
      console.log('=== 3. 연속 시간대 중복 분석 ===');
      
      const employeeSchedules = new Map();
      
      scheduleData.forEach(schedule => {
        if (!employeeSchedules.has(schedule.name)) {
          employeeSchedules.set(schedule.name, []);
        }
        employeeSchedules.get(schedule.name).push(schedule.timeSlot);
      });
      
      employeeSchedules.forEach((timeSlots, employeeName) => {
        if (timeSlots.length > 1) {
          console.log(`📋 ${employeeName}의 스케줄:`, timeSlots);
          
          // 연속 시간대 확인
          const sortedSlots = timeSlots.sort();
          for (let i = 0; i < sortedSlots.length - 1; i++) {
            const current = sortedSlots[i];
            const next = sortedSlots[i + 1];
            
            // 시간 파싱
            const currentEnd = current.split(' - ')[1];
            const nextStart = next.split(' - ')[0];
            
            if (currentEnd === nextStart) {
              console.log(`⚠️ 연속 시간대 발견: ${employeeName} - ${current} → ${next}`);
            }
          }
        }
      });
      
    } else {
      console.log('❌ 스케줄 카드를 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 기존 스케줄 섹션을 찾을 수 없습니다');
  }
  
  // 4. 시간대별 근무자 현황 분석
  console.log('=== 4. 시간대별 근무자 현황 분석 ===');
  
  const hourlyStatusSection = page.locator('text=/시간대별 근무자 현황/');
  if (await hourlyStatusSection.isVisible()) {
    console.log('✅ 시간대별 근무자 현황 섹션이 표시됩니다');
    
    // 시간대별 버튼 확인
    const hourlyButtons = page.locator('button:has-text("명")');
    const buttonCount = await hourlyButtons.count();
    console.log('시간대별 버튼 수:', buttonCount);
    
    if (buttonCount > 0) {
      console.log('=== 시간대별 현황 분석 ===');
      
      for (let i = 0; i < buttonCount; i++) {
        const button = hourlyButtons.nth(i);
        const buttonText = await button.textContent();
        console.log(`시간대 ${i + 1}: ${buttonText?.trim()}`);
      }
      
      // 5. 데이터 일치성 검증
      console.log('=== 5. 데이터 일치성 검증 ===');
      
      // 기존 스케줄에서 시간대별 인원 수 계산
      const hourlyCounts = new Map();
      
      scheduleData.forEach(schedule => {
        const timeSlot = schedule.timeSlot;
        if (timeSlot.includes(' - ')) {
          const [start, end] = timeSlot.split(' - ');
          const startHour = parseInt(start.split(':')[0]);
          const endHour = parseInt(end.split(':')[0]);
          
          // 시간대별로 카운트
          for (let hour = startHour; hour < endHour; hour++) {
            const timeRange = `${hour}-${hour + 1}`;
            hourlyCounts.set(timeRange, (hourlyCounts.get(timeRange) || 0) + 1);
          }
        }
      });
      
      console.log('=== 계산된 시간대별 인원 수 ===');
      hourlyCounts.forEach((count, timeRange) => {
        console.log(`${timeRange}: ${count}명`);
      });
      
    } else {
      console.log('❌ 시간대별 버튼을 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션을 찾을 수 없습니다');
  }
  
  // 6. UX/UI 개선 방안 제시
  console.log('=== 6. UX/UI 개선 방안 제시 ===');
  
  console.log('🔧 개선 방안 1: 스케줄 표시 방식 개선');
  console.log('- 연속 시간대 통합: 16:30-17:30으로 표시');
  console.log('- 중복 제거: 같은 사람의 연속 스케줄을 하나로 묶기');
  console.log('- 시간 범위 표시: 시작-종료 시간을 명확하게 표시');
  
  console.log('🔧 개선 방안 2: 시간대별 현황 정확성 개선');
  console.log('- 30분 단위와 1시간 단위 일치: 데이터 정합성 확보');
  console.log('- 실제 근무 시간 반영: 시작-종료 시간 기준으로 정확한 계산');
  console.log('- 시각적 개선: 색상, 아이콘 등을 활용한 직관적 표시');
  
  console.log('🔧 개선 방안 3: 전체적인 UX 개선');
  console.log('- 스케줄 그룹화: 같은 사람의 연속 스케줄을 시각적으로 그룹화');
  console.log('- 시간대 필터링: 특정 시간대만 보기 기능');
  console.log('- 스케줄 편집: 직접 클릭하여 수정 가능한 인터페이스');
  
  // 7. 스크린샷 저장
  console.log('=== 7. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-ux-ui-issues.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-ux-ui-issues.png');
  
  console.log('=== 스케줄 UX/UI 문제점 확인 테스트 완료 ===');
});
