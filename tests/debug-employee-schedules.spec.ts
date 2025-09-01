import { test, expect } from '@playwright/test';

test('직원별 스케줄 관리 페이지 구조 디버깅', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  // 직원별 스케줄 관리 페이지로 이동
  await page.goto('https://maslabs.kr/admin/employee-schedules');
  await page.waitForLoadState('networkidle');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/employee-schedules-debug.png' });
  
  // 페이지 제목 확인
  const pageTitle = await page.title();
  console.log('페이지 제목:', pageTitle);
  
  // 모든 버튼 찾기
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('총 버튼 수:', buttonCount);
  
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const buttonText = await button.textContent();
    const buttonClass = await button.getAttribute('class');
    console.log(`버튼 ${i + 1}: "${buttonText}" - 클래스: ${buttonClass}`);
  }
  
  // 직원 목록 섹션 찾기
  const employeeListSection = page.locator('text=직원 목록');
  if (await employeeListSection.isVisible()) {
    console.log('직원 목록 섹션이 표시됨');
    
    // 직원 목록 내의 모든 텍스트 찾기
    const employeeTexts = page.locator('text=/[가-힣]+ \([A-Z]+, [가-힣]+팀 • [가-힣]+\)/');
    const employeeCount = await employeeTexts.count();
    console.log('직원 텍스트 패턴 매치 수:', employeeCount);
    
    for (let i = 0; i < employeeCount; i++) {
      const employeeText = await employeeTexts.nth(i).textContent();
      console.log(`직원 ${i + 1}: ${employeeText}`);
    }
    
    // 직원 목록 내의 모든 클릭 가능한 요소 찾기
    const clickableElements = page.locator('div, span, button').filter({ hasText: /[가-힣]+ \([A-Z]+/ });
    const clickableCount = await clickableElements.count();
    console.log('클릭 가능한 직원 요소 수:', clickableCount);
    
    for (let i = 0; i < Math.min(clickableCount, 5); i++) {
      const element = clickableElements.nth(i);
      const elementText = await element.textContent();
      const elementTag = await element.evaluate(el => el.tagName);
      const elementClass = await element.getAttribute('class');
      console.log(`클릭 가능한 요소 ${i + 1}: <${elementTag}> "${elementText}" - 클래스: ${elementClass}`);
    }
  } else {
    console.log('직원 목록 섹션이 표시되지 않음');
  }
  
  // 개별 관리 버튼 찾기
  const individualButton = page.locator('button:has-text("개별 관리")');
  if (await individualButton.isVisible()) {
    console.log('개별 관리 버튼이 표시됨');
    
    // 개별 관리 버튼 클릭
    await individualButton.click();
    await page.waitForTimeout(2000);
    
    // 클릭 후 페이지 상태 확인
    await page.screenshot({ path: 'test-results/employee-schedules-individual-mode.png' });
    
    // 개별 관리 모드 활성화 확인
    const buttonClass = await individualButton.getAttribute('class');
    console.log('개별 관리 버튼 클래스 (클릭 후):', buttonClass);
    
    // 클릭 후 직원 목록 상태 확인
    const employeeListAfterClick = page.locator('text=직원 목록');
    if (await employeeListAfterClick.isVisible()) {
      console.log('클릭 후 직원 목록이 여전히 표시됨');
      
      // 직원 선택 시도
      const firstEmployee = page.locator('text=/[가-힣]+ \([A-Z]+/').first();
      if (await firstEmployee.isVisible()) {
        console.log('첫 번째 직원 요소가 표시됨');
        
        // 직원 클릭 시도
        try {
          await firstEmployee.click();
          console.log('직원 클릭 성공');
          await page.waitForTimeout(1000);
          
          // 클릭 후 상태 확인
          await page.screenshot({ path: 'test-results/employee-schedules-employee-selected.png' });
          
        } catch (error) {
          console.log('직원 클릭 실패:', error.message);
        }
      } else {
        console.log('첫 번째 직원 요소가 표시되지 않음');
      }
    }
  } else {
    console.log('개별 관리 버튼이 표시되지 않음');
  }
  
  // 전체 보기 버튼 찾기
  const overallButton = page.locator('button:has-text("전체 보기")');
  if (await overallButton.isVisible()) {
    console.log('전체 보기 버튼이 표시됨');
    const buttonClass = await overallButton.getAttribute('class');
    console.log('전체 보기 버튼 클래스:', buttonClass);
  }
  
  // 내 스케줄 버튼 찾기
  const myScheduleButton = page.locator('button:has-text("내 스케줄")');
  if (await myScheduleButton.isVisible()) {
    console.log('내 스케줄 버튼이 표시됨');
    const buttonClass = await myScheduleButton.getAttribute('class');
    console.log('내 스케줄 버튼 클래스:', buttonClass);
  }
  
  console.log('디버깅 완료');
});
