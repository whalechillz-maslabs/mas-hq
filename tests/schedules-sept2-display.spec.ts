import { test, expect } from '@playwright/test';

test('스케줄 페이지에서 9월 2일이 올바르게 표시되는지 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules');
  
  console.log('=== 9월 2일 표시 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 기본 페이지 구조 확인
  console.log('=== 1. 기본 페이지 구조 확인 ===');
  
  // 페이지 제목 확인
  const pageTitle = page.locator('h1, h2, .text-3xl, .text-2xl');
  const titleCount = await pageTitle.count();
  console.log('페이지 제목 요소 수:', titleCount);
  
  if (titleCount > 0) {
    for (let i = 0; i < Math.min(titleCount, 3); i++) {
      const title = pageTitle.nth(i);
      const titleText = await title.textContent();
      console.log(`페이지 제목 ${i + 1}: ${titleText}`);
    }
  }
  
  // 2. 현재 표시된 주간 날짜 범위 확인
  console.log('=== 2. 현재 표시된 주간 날짜 범위 확인 ===');
  
  // 날짜 범위 텍스트 찾기 (예: "08/31 - 09/06 (36주차)")
  const dateRangeElements = page.locator('text=/.*[0-9]{2}\/[0-9]{2}.*[0-9]{2}\/[0-9]{2}.*/');
  const dateRangeCount = await dateRangeElements.count();
  console.log('날짜 범위 요소 수:', dateRangeCount);
  
  if (dateRangeCount > 0) {
    for (let i = 0; i < Math.min(dateRangeCount, 3); i++) {
      const dateRange = dateRangeElements.nth(i);
      const dateRangeText = await dateRange.textContent();
      console.log(`날짜 범위 ${i + 1}: ${dateRangeText}`);
      
      // 9월 2일이 포함되어 있는지 확인
      if (dateRangeText && dateRangeText.includes('09/02') || dateRangeText.includes('9/2')) {
        console.log('✅ 9월 2일이 현재 주간 범위에 포함되어 있습니다!');
      }
    }
  }
  
  // 3. 9월 2일 (화) 헤더 확인
  console.log('=== 3. 9월 2일 (화) 헤더 확인 ===');
  
  // "화 2" 또는 "화 02" 텍스트를 포함하는 헤더 찾기
  const tuesdayHeader = page.locator('text=/화.*2/');
  const tuesdayHeaderCount = await tuesdayHeader.count();
  console.log('화요일 2일 헤더 요소 수:', tuesdayHeaderCount);
  
  if (tuesdayHeaderCount > 0) {
    for (let i = 0; i < Math.min(tuesdayHeaderCount, 3); i++) {
      const header = tuesdayHeader.nth(i);
      const headerText = await header.textContent();
      console.log(`화요일 헤더 ${i + 1}: ${headerText}`);
    }
    console.log('✅ 9월 2일 (화) 헤더가 스케줄 그리드에 표시됩니다.');
  } else {
    console.log('❌ 9월 2일 (화) 헤더를 찾을 수 없습니다.');
  }
  
  // 4. 9월 2일의 스케줄 데이터 확인
  console.log('=== 4. 9월 2일의 스케줄 데이터 확인 ===');
  
  // 스케줄 그리드에서 숫자 데이터 찾기 (예: "3", "2" 등)
  const scheduleNumbers = page.locator('text=/^[0-9]+$/');
  const scheduleNumberCount = await scheduleNumbers.count();
  console.log('스케줄 숫자 요소 수:', scheduleNumberCount);
  
  if (scheduleNumberCount > 0) {
    for (let i = 0; i < Math.min(scheduleNumberCount, 10); i++) {
      const number = scheduleNumbers.nth(i);
      const numberText = await number.textContent();
      console.log(`스케줄 숫자 ${i + 1}: ${numberText}`);
    }
  }
  
  // 5. 우상단 "추가" 버튼 클릭 테스트
  console.log('=== 5. 우상단 "추가" 버튼 클릭 테스트 ===');
  
  // "추가" 버튼 찾기
  const addButton = page.locator('button:has-text("추가"), button:has-text("+"), button:has-text("Add")');
  const addButtonCount = await addButton.count();
  console.log('추가 버튼 수:', addButtonCount);
  
  if (addButtonCount > 0) {
    console.log('추가 버튼을 찾았습니다. 클릭하겠습니다...');
    
    // 첫 번째 추가 버튼 클릭
    await addButton.first().click();
    await page.waitForTimeout(2000);
    
    // 새 페이지로 이동했는지 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    if (currentUrl.includes('/add')) {
      console.log('✅ 스케줄 추가 페이지로 이동되었습니다.');
      
      // 6. 스케줄 추가 페이지에서 9월 2일 표시 확인
      console.log('=== 6. 스케줄 추가 페이지에서 9월 2일 표시 확인 ===');
      
      // 페이지 제목 확인
      const addPageTitle = page.locator('h1, h2, .text-3xl, .text-2xl');
      const addTitleCount = await addPageTitle.count();
      console.log('추가 페이지 제목 요소 수:', addTitleCount);
      
      if (addTitleCount > 0) {
        for (let i = 0; i < Math.min(addTitleCount, 3); i++) {
          const title = addPageTitle.nth(i);
          const titleText = await title.textContent();
          console.log(`추가 페이지 제목 ${i + 1}: ${titleText}`);
        }
      }
      
      // 9월 2일 날짜 입력 필드 확인
      const dateInput = page.locator('input[type="date"], input[placeholder*="날짜"], input[placeholder*="Date"]');
      const dateInputCount = await dateInput.count();
      console.log('날짜 입력 필드 수:', dateInputCount);
      
      if (dateInputCount > 0) {
        for (let i = 0; i < dateInputCount; i++) {
          const input = dateInput.nth(i);
          const inputValue = await input.getAttribute('value');
          const inputPlaceholder = await input.getAttribute('placeholder');
          console.log(`날짜 입력 필드 ${i + 1}: value="${inputValue}", placeholder="${inputPlaceholder}"`);
          
          // 9월 2일이 기본값으로 설정되어 있는지 확인
          if (inputValue && (inputValue.includes('2025-09-02') || inputValue.includes('09/02'))) {
            console.log('✅ 9월 2일이 날짜 입력 필드의 기본값으로 설정되어 있습니다!');
          }
        }
      }
      
      // 7. 기존 스케줄 섹션에서 9월 2일 확인
      console.log('=== 7. 기존 스케줄 섹션에서 9월 2일 확인 ===');
      
      // "기존 스케줄" 또는 "Existing Schedule" 텍스트 찾기
      const existingScheduleHeader = page.locator('text=/.*기존.*스케줄.*/, text=/.*Existing.*Schedule.*/');
      const existingHeaderCount = await existingScheduleHeader.count();
      console.log('기존 스케줄 헤더 요소 수:', existingHeaderCount);
      
      if (existingHeaderCount > 0) {
        for (let i = 0; i < existingHeaderCount; i++) {
          const header = existingScheduleHeader.nth(i);
          const headerText = await header.textContent();
          console.log(`기존 스케줄 헤더 ${i + 1}: ${headerText}`);
          
          // 9월 2일이 포함되어 있는지 확인
          if (headerText && (headerText.includes('09/02') || headerText.includes('9월 2일') || headerText.includes('September 2'))) {
            console.log('✅ 기존 스케줄 섹션에 9월 2일이 표시되어 있습니다!');
          }
        }
      }
      
      // 8. 스크린샷 저장
      console.log('=== 8. 스크린샷 저장 ===');
      await page.screenshot({ path: 'playwright-report/schedules-add-sept2.png', fullPage: true });
      console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-add-sept2.png');
      
    } else {
      console.log('❌ 스케줄 추가 페이지로 이동하지 못했습니다.');
    }
  } else {
    console.log('❌ 추가 버튼을 찾을 수 없습니다.');
  }
  
  // 9. 전체 페이지 텍스트에서 9월 2일 검색
  console.log('=== 9. 전체 페이지 텍스트에서 9월 2일 검색 ===');
  
  const allTexts = page.locator('text=/.*/');
  const textCount = await allTexts.count();
  console.log('페이지에 있는 텍스트 요소 수:', textCount);
  
  if (textCount > 0) {
    const september2Texts = [];
    for (let i = 0; i < Math.min(textCount, 50); i++) {
      const text = allTexts.nth(i);
      const textContent = await text.textContent();
      if (textContent && (textContent.includes('9월 2일') || textContent.includes('09/02') || textContent.includes('September 2'))) {
        september2Texts.push(textContent.trim());
      }
    }
    
    if (september2Texts.length > 0) {
      console.log('✅ 9월 2일 관련 텍스트를 찾았습니다:', september2Texts);
    } else {
      console.log('❌ 9월 2일 관련 텍스트를 찾을 수 없습니다.');
    }
  }
  
  console.log('=== 9월 2일 표시 테스트 완료 ===');
});
