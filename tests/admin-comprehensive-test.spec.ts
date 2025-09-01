import { test, expect } from '@playwright/test';

test('관리자 기능 종합 테스트 - 스케줄 모달, 개별관리, 전체보기, 내 스케줄 개선점 확인', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  console.log('=== 관리자 기능 종합 테스트 시작 ===');
  
  // 콘솔 로그 수집 시작
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
  
  // 관리자 페이지로 이동
  await page.goto('https://maslabs.kr/admin/employee-schedules');
  await page.waitForLoadState('networkidle');
  
  // 페이지 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin');
  if (await loadingElement.isVisible()) {
    console.log('페이지가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(5000);
  }
  
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
  
  // 네비게이션 버튼 확인
  const individualBtn = page.locator('button:has-text("개별 관리")');
  const fullViewBtn = page.locator('button:has-text("전체 보기")');
  const myScheduleBtn = page.locator('button:has-text("내 스케줄")');
  
  console.log('개별 관리 버튼 표시:', await individualBtn.isVisible());
  console.log('전체 보기 버튼 표시:', await fullViewBtn.isVisible());
  console.log('내 스케줄 버튼 표시:', await myScheduleBtn.isVisible());
  
  // 2. 개별 관리 모드 테스트
  console.log('=== 2. 개별 관리 모드 테스트 ===');
  
  if (await individualBtn.isVisible()) {
    console.log('개별 관리 버튼 클릭...');
    await individualBtn.click();
    await page.waitForTimeout(2000);
    
    // 개별 관리 모드에서 직원 목록 확인
    const employeeList = page.locator('text=직원 목록');
    if (await employeeList.isVisible()) {
      console.log('✅ 직원 목록 섹션이 표시됩니다');
      
      // 직원 검색창 확인
      const searchBox = page.locator('input[placeholder*="직원 검색"], input[placeholder*="Search"]');
      if (await searchBox.isVisible()) {
        console.log('✅ 직원 검색창이 표시됩니다');
      } else {
        console.log('❌ 직원 검색창이 표시되지 않습니다');
      }
      
      // 직원 목록 확인
      const employees = page.locator('div[class*="cursor-pointer"], button[class*="cursor-pointer"]');
      const employeeCount = await employees.count();
      console.log('직원 목록 수:', employeeCount);
      
      if (employeeCount > 0) {
        for (let i = 0; i < Math.min(employeeCount, 5); i++) {
          const employee = employees.nth(i);
          const employeeText = await employee.textContent();
          console.log(`직원 ${i + 1}: ${employeeText}`);
        }
        
        // 첫 번째 직원 선택
        console.log('첫 번째 직원 선택...');
        await employees.first().click();
        await page.waitForTimeout(2000);
        
        // 선택된 직원의 스케줄 확인
        const selectedEmployeeName = page.locator('h2, h3, .text-xl, .text-lg');
        const nameCount = await selectedEmployeeName.count();
        console.log('선택된 직원 이름 요소 수:', nameCount);
        
        if (nameCount > 0) {
          for (let i = 0; i < Math.min(nameCount, 3); i++) {
            const name = selectedEmployeeName.nth(i);
            const nameText = await name.textContent();
            console.log(`이름 요소 ${i + 1}: ${nameText}`);
          }
        }
      }
    } else {
      console.log('❌ 직원 목록 섹션이 표시되지 않습니다');
    }
  } else {
    console.log('❌ 개별 관리 버튼을 찾을 수 없습니다');
  }
  
  // 3. 전체 보기 모드 테스트
  console.log('=== 3. 전체 보기 모드 테스트 ===');
  
  if (await fullViewBtn.isVisible()) {
    console.log('전체 보기 버튼 클릭...');
    await fullViewBtn.click();
    await page.waitForTimeout(2000);
    
    // 전체 보기 모드에서 스케줄 그리드 확인
    const scheduleGrid = page.locator('div[class*="grid"], table');
    const gridCount = await scheduleGrid.count();
    console.log('스케줄 그리드 수:', gridCount);
    
    if (gridCount > 0) {
      console.log('✅ 스케줄 그리드가 표시됩니다');
      
      // 시간 열 확인
      const timeColumn = page.locator('div[class*="text-center"], th, td');
      const timeCount = await timeColumn.count();
      console.log('시간 열 요소 수:', timeCount);
      
      // 날짜 헤더 확인
      const dateHeaders = page.locator('div[class*="text-center"], th, td');
      const dateCount = await dateHeaders.count();
      console.log('날짜 헤더 요소 수:', dateCount);
      
      // 스케줄 셀 확인
      const scheduleCells = page.locator('div[class*="bg-blue"], div[class*="bg-gray"], td');
      const cellCount = await scheduleCells.count();
      console.log('스케줄 셀 수:', cellCount);
      
      if (cellCount > 0) {
        for (let i = 0; i < Math.min(cellCount, 5); i++) {
          const cell = scheduleCells.nth(i);
          const cellText = await cell.textContent();
          const cellClass = await cell.getAttribute('class');
          console.log(`스케줄 셀 ${i + 1}: 텍스트="${cellText}", 클래스="${cellClass}"`);
        }
      }
    } else {
      console.log('❌ 스케줄 그리드가 표시되지 않습니다');
    }
  } else {
    console.log('❌ 전체 보기 버튼을 찾을 수 없습니다');
  }
  
  // 4. 내 스케줄 모드 테스트
  console.log('=== 4. 내 스케줄 모드 테스트 ===');
  
  if (await myScheduleBtn.isVisible()) {
    console.log('내 스케줄 버튼 클릭...');
    await myScheduleBtn.click();
    await page.waitForTimeout(2000);
    
    // 내 스케줄 모드에서 내용 확인
    const myScheduleContent = page.locator('h2, h3, .text-xl, .text-lg');
    const contentCount = await myScheduleContent.count();
    console.log('내 스케줄 내용 요소 수:', contentCount);
    
    if (contentCount > 0) {
      for (let i = 0; i < Math.min(contentCount, 3); i++) {
        const content = myScheduleContent.nth(i);
        const contentText = await content.textContent();
        console.log(`내 스케줄 내용 ${i + 1}: ${contentText}`);
      }
    }
  } else {
    console.log('❌ 내 스케줄 버튼을 찾을 수 없습니다');
  }
  
  // 5. 스케줄 추가 기능 테스트
  console.log('=== 5. 스케줄 추가 기능 테스트 ===');
  
  // 스케줄 추가 버튼 찾기
  const addButton = page.locator('button:has-text("추가"), button:has-text("Add"), button:has-text("+")');
  const addButtonCount = await addButton.count();
  console.log('스케줄 추가 버튼 수:', addButtonCount);
  
  if (addButtonCount > 0) {
    console.log('스케줄 추가 버튼을 찾았습니다');
    
    // 첫 번째 추가 버튼 클릭
    console.log('첫 번째 스케줄 추가 버튼 클릭...');
    await addButton.first().click();
    await page.waitForTimeout(2000);
    
    // 모달 창 확인
    const modal = page.locator('div[class*="modal"], div[class*="fixed"], div[class*="absolute"]');
    const modalCount = await modal.count();
    console.log('모달 창 수:', modalCount);
    
    if (modalCount > 0) {
      console.log('✅ 모달 창이 표시됩니다');
      
      // 모달 내용 확인
      const modalTitle = page.locator('h2, h3, .text-xl, .text-lg');
      const titleCount = await modalTitle.count();
      console.log('모달 제목 요소 수:', titleCount);
      
      if (titleCount > 0) {
        for (let i = 0; i < Math.min(titleCount, 3); i++) {
          const title = modalTitle.nth(i);
          const titleText = await title.textContent();
          console.log(`모달 제목 ${i + 1}: ${titleText}`);
        }
      }
      
      // 모달 입력 필드 확인
      const inputFields = page.locator('input, textarea, select');
      const inputCount = await inputFields.count();
      console.log('모달 입력 필드 수:', inputCount);
      
      if (inputCount > 0) {
        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = inputFields.nth(i);
          const inputType = await input.getAttribute('type');
          const inputPlaceholder = await input.getAttribute('placeholder');
          console.log(`입력 필드 ${i + 1}: type="${inputType}", placeholder="${inputPlaceholder}"`);
        }
      }
      
      // 모달 닫기 버튼 확인
      const closeButton = page.locator('button:has-text("취소"), button:has-text("Cancel"), button:has-text("X")');
      if (await closeButton.isVisible()) {
        console.log('✅ 모달 닫기 버튼이 표시됩니다');
        await closeButton.first().click();
        await page.waitForTimeout(1000);
      } else {
        console.log('❌ 모달 닫기 버튼이 표시되지 않습니다');
      }
    } else {
      console.log('❌ 모달 창이 표시되지 않습니다');
      
      // 인라인 편집 가능한지 확인
      const editableCells = page.locator('div[contenteditable="true"], input, textarea');
      const editableCount = await editableCells.count();
      console.log('편집 가능한 셀 수:', editableCount);
      
      if (editableCount > 0) {
        console.log('✅ 인라인 편집이 가능합니다');
      } else {
        console.log('❌ 인라인 편집이 불가능합니다');
      }
    }
  } else {
    console.log('❌ 스케줄 추가 버튼을 찾을 수 없습니다');
  }
  
  // 6. 개선점 분석
  console.log('=== 6. 개선점 분석 ===');
  
  // 현재 페이지의 모든 텍스트 수집
  const allTexts = page.locator('text=/.*/');
  const textCount = await allTexts.count();
  console.log('페이지에 있는 텍스트 요소 수:', textCount);
  
  if (textCount > 0) {
    const textContents = [];
    for (let i = 0; i < Math.min(textCount, 20); i++) {
      const text = allTexts.nth(i);
      const textContent = await text.textContent();
      if (textContent && textContent.trim()) {
        textContents.push(textContent.trim());
      }
    }
    console.log('주요 텍스트 내용:', textContents);
  }
  
  // 7. 콘솔 로그 및 오류 확인
  console.log('=== 7. 콘솔 로그 및 오류 확인 ===');
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
  } else {
    console.log('콘솔 로그가 없습니다');
  }
  
  const jsErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다');
  }
  
  // 8. 네트워크 요청 분석
  console.log('=== 8. 네트워크 요청 분석 ===');
  
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('admin') || entry.name.includes('employee-schedules') || entry.name.includes('employees'))
      .map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('관리자 페이지 관련 네트워크 요청:', networkRequests);
  
  console.log('=== 관리자 기능 종합 테스트 완료 ===');
});
