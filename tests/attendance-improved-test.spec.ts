import { test, expect } from '@playwright/test';

test('개선된 출근 관리 기능 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 개선된 출근 관리 기능 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 기본 정보 확인
  console.log('=== 1. 기본 정보 확인 ===');
  
  // 페이지 제목 확인
  const pageTitle = await page.locator('h1').textContent();
  console.log('페이지 제목:', pageTitle);
  
  // 현재 시간 확인
  const currentTime = await page.locator('text=현재 시간').locator('..').locator('p').last().textContent();
  console.log('현재 시간:', currentTime);
  
  // 2. 디버깅 정보 확인
  console.log('=== 2. 디버깅 정보 확인 ===');
  
  const debugInfo = await page.locator('text=디버깅 정보').locator('..').textContent();
  console.log('디버깅 정보:', debugInfo);
  
  // 스케줄 데이터 상세 정보 확인
  const scheduleDetailSection = page.locator('text=스케줄 데이터 상세');
  const hasScheduleDetail = await scheduleDetailSection.count() > 0;
  console.log('스케줄 데이터 상세 섹션 존재:', hasScheduleDetail);
  
  if (hasScheduleDetail) {
    const scheduleDetailContent = await scheduleDetailSection.locator('..').textContent();
    console.log('스케줄 데이터 상세 내용:', scheduleDetailContent);
    
    // "--:--" 패턴이 여전히 있는지 확인
    const stillHasDashPattern = scheduleDetailContent?.includes('--:--');
    console.log('여전히 "--:--" 패턴 존재:', stillHasDashPattern);
    
    if (stillHasDashPattern) {
      console.log('❌ 문제 지속: "--:--" 패턴이 여전히 표시됨');
    } else {
      console.log('✅ 문제 해결: "--:--" 패턴이 더 이상 표시되지 않음');
    }
  }
  
  // 3. 스케줄 섹션 확인
  console.log('=== 3. 스케줄 섹션 확인 ===');
  
  const scheduleSection = page.locator('text=오늘의 근무 스케줄');
  const sectionExists = await scheduleSection.count() > 0;
  console.log('스케줄 섹션 존재:', sectionExists);
  
  if (sectionExists) {
    const sectionContent = await scheduleSection.locator('..').textContent();
    console.log('스케줄 섹션 내용:', sectionContent);
    
    // 새로운 에러 메시지 확인
    const hasNewErrorMessages = sectionContent?.includes('시간 없음') || 
                               sectionContent?.includes('시간 오류') ||
                               sectionContent?.includes('날짜/시간 없음') ||
                               sectionContent?.includes('날짜/시간 오류');
    
    console.log('새로운 에러 메시지 존재:', hasNewErrorMessages);
    
    if (hasNewErrorMessages) {
      console.log('✅ 개선됨: "--:--" 대신 명확한 에러 메시지 표시');
    }
  }
  
  // 4. 콘솔 로그 확인
  console.log('=== 4. 콘솔 로그 확인 ===');
  
  // 페이지 새로고침으로 콘솔 로그 모니터링
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 5. 최종 스크린샷 저장
  console.log('=== 5. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/attendance-improved-final.png', fullPage: true });
  console.log('✅ 개선된 출근 관리 기능 최종 스크린샷 저장');
  
  console.log('=== 개선된 출근 관리 기능 테스트 완료 ===');
});
