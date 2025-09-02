import { test, expect } from '@playwright/test';

test('스케줄 추가 페이지에서 날짜 고정 문제 확인 및 수정 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 직접 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules/add');
  
  console.log('=== 날짜 고정 문제 확인 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 현재 날짜 확인
  console.log('=== 1. 현재 날짜 확인 ===');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  console.log('현재 날짜 (YYYY-MM-DD):', todayStr);
  console.log('현재 날짜 (한국 시간):', today.toLocaleDateString('ko-KR'));
  
  // 2. 날짜 입력 필드 확인
  console.log('=== 2. 날짜 입력 필드 확인 ===');
  
  const dateInput = page.locator('input[type="date"]');
  const dateInputCount = await dateInput.count();
  console.log('날짜 입력 필드 수:', dateInputCount);
  
  if (dateInputCount > 0) {
    const input = dateInput.first();
    
    // 현재 설정된 값 확인
    const currentValue = await input.getAttribute('value');
    console.log('현재 설정된 날짜 값:', currentValue);
    
    // placeholder 확인
    const placeholder = await input.getAttribute('placeholder');
    console.log('날짜 입력 필드 placeholder:', placeholder);
    
    // 3. 날짜가 고정되어 있는지 확인
    console.log('=== 3. 날짜 고정 여부 확인 ===');
    
    if (currentValue === '2025-09-02') {
      console.log('❌ 문제 발견: 날짜가 2025-09-02로 고정되어 있습니다!');
      console.log('현재 날짜로 수정이 필요한 상황입니다.');
    } else if (currentValue === todayStr) {
      console.log('✅ 정상: 현재 날짜가 설정되어 있습니다.');
    } else {
      console.log('⚠️ 예상과 다른 날짜가 설정되어 있습니다:', currentValue);
    }
    
    // 4. 날짜 수정 시도
    console.log('=== 4. 날짜 수정 시도 ===');
    
    try {
      // 현재 날짜로 변경
      await input.fill(todayStr);
      console.log('✅ 날짜를 현재 날짜로 변경했습니다:', todayStr);
      
      // 변경된 값 확인
      const newValue = await input.getAttribute('value');
      console.log('변경된 날짜 값:', newValue);
      
      if (newValue === todayStr) {
        console.log('✅ 날짜 수정이 성공했습니다!');
      } else {
        console.log('❌ 날짜 수정이 실패했습니다.');
      }
      
    } catch (error) {
      console.log('❌ 날짜 수정 중 오류 발생:', error);
    }
    
    // 5. 다른 날짜로도 변경 가능한지 테스트
    console.log('=== 5. 다른 날짜 변경 테스트 ===');
    
    try {
      // 내일 날짜로 변경
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      await input.fill(tomorrowStr);
      console.log('✅ 내일 날짜로 변경 시도:', tomorrowStr);
      
      const tomorrowValue = await input.getAttribute('value');
      console.log('내일 날짜 설정 결과:', tomorrowValue);
      
      if (tomorrowValue === tomorrowStr) {
        console.log('✅ 다른 날짜로도 변경이 가능합니다!');
      } else {
        console.log('❌ 다른 날짜로 변경이 불가능합니다.');
      }
      
      // 다시 현재 날짜로 복원
      await input.fill(todayStr);
      console.log('✅ 현재 날짜로 복원 완료');
      
    } catch (error) {
      console.log('❌ 다른 날짜 변경 테스트 중 오류:', error);
    }
    
  } else {
    console.log('❌ 날짜 입력 필드를 찾을 수 없습니다.');
  }
  
  // 6. 페이지 소스에서 하드코딩된 날짜 검색
  console.log('=== 6. 페이지 소스에서 하드코딩된 날짜 검색 ===');
  
  const pageContent = await page.content();
  const hardcodedDates = pageContent.match(/2025-09-02|9월 2일|September 2/g);
  
  if (hardcodedDates) {
    console.log('❌ 하드코딩된 날짜를 발견했습니다:', hardcodedDates);
    console.log('이 날짜들이 코드에 고정되어 있을 수 있습니다.');
  } else {
    console.log('✅ 하드코딩된 날짜를 발견하지 못했습니다.');
  }
  
  // 7. 콘솔 로그 확인
  console.log('=== 7. 콘솔 로그 확인 ===');
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
  } else {
    console.log('콘솔 로그가 없습니다.');
  }
  
  // 8. 스크린샷 저장
  console.log('=== 8. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-date-fix-test.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-date-fix-test.png');
  
  console.log('=== 날짜 고정 문제 확인 테스트 완료 ===');
});
