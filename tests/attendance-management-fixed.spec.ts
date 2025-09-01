import { test, expect } from '@playwright/test';

test.describe('출근 관리 테스트 (수정됨)', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://maslabs.kr/login');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/quick-task');
  });

  test('개인별 출근 관리 페이지 테스트', async ({ page }) => {
    // 개인별 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인 (실제 제목: "출근 관리")
    await expect(page.locator('h1:has-text("출근 관리")')).toBeVisible();
    
    // 오늘의 근무 스케줄 섹션 확인
    await expect(page.locator('h2:has-text("오늘의 근무 스케줄")')).toBeVisible();
    
    // 이번 달 출근 기록 섹션 확인
    await expect(page.locator('h2:has-text("이번 달 출근 기록")')).toBeVisible();
    
    // 디버깅 정보가 표시되는지 확인
    const debugInfo = page.locator('text=디버깅 정보:');
    if (await debugInfo.isVisible()) {
      console.log('디버깅 정보가 표시됨');
      
      // 사용자 정보 확인
      const userInfo = await page.locator('text=사용자 이름:').textContent();
      console.log('사용자 정보:', userInfo);
    }
    
    // 로딩 상태 확인
    const loadingState = page.locator('text=로딩 중...');
    if (await loadingState.isVisible()) {
      console.log('페이지가 로딩 중입니다');
      await page.waitForTimeout(3000); // 로딩 완료 대기
    }
    
    // 스케줄 데이터가 로드되었는지 확인
    const scheduleSection = page.locator('text=오늘의 근무 스케줄');
    await expect(scheduleSection).toBeVisible();
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-personal-test.png' });
  });

  test('팀 관리 기능 직원 출근 관리 페이지 테스트', async ({ page }) => {
    // 팀 관리 기능 직원 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인 (실제 제목: "출근 관리")
    await expect(page.locator('h1:has-text("출근 관리")')).toBeVisible();
    
    // 출근 기록 테이블 확인
    const attendanceTable = page.locator('table');
    await expect(attendanceTable).toBeVisible();
    
    // 테이블 헤더 확인
    const tableHeaders = page.locator('thead th');
    const headerCount = await tableHeaders.count();
    console.log('테이블 헤더 수:', headerCount);
    
    // 최소 6개 이상의 컬럼이 있어야 함
    expect(headerCount).toBeGreaterThanOrEqual(6);
    
    // 출근 기록 데이터가 로드되었는지 확인
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    console.log('출근 기록 행 수:', rowCount);
    
    // 최소 1개 이상의 행이 있어야 함
    expect(rowCount).toBeGreaterThan(0);
    
    // 첫 번째 행의 데이터 확인
    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const employeeName = await firstRow.locator('td').nth(0).textContent();
      const employeeId = await firstRow.locator('td').nth(1).textContent();
      const department = await firstRow.locator('td').nth(2).textContent();
      
      console.log('첫 번째 직원 정보:', {
        name: employeeName,
        id: employeeId,
        department: department
      });
      
      // 기본 정보가 비어있지 않은지 확인
      expect(employeeName).not.toBe('');
      expect(employeeId).not.toBe('');
    }
    
    // 통계 카드 확인
    const statsCards = page.locator('text=출근 완료, text=근무 중, text=미출근, text=평균 근무시간');
    const statsCount = await statsCards.count();
    console.log('통계 카드 수:', statsCount);
    
    // 최소 4개의 통계 정보가 있어야 함
    expect(statsCount).toBeGreaterThanOrEqual(4);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-admin-test.png' });
  });

  test('출근 체크 기능 테스트', async ({ page }) => {
    // 개인별 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 출근 버튼이 있는지 확인
    const checkInButton = page.locator('button:has-text("출근")');
    const checkOutButton = page.locator('button:has-text("퇴근")');
    
    if (await checkInButton.isVisible()) {
      console.log('출근 버튼이 표시됨');
      
      // 출근 버튼 클릭
      await checkInButton.click();
      await page.waitForTimeout(1000);
      
      // 출근 처리 완료 확인
      const successMessage = page.locator('text=출근 처리 완료, text=출근되었습니다, text=성공');
      if (await successMessage.isVisible()) {
        console.log('출근 처리 성공');
      } else {
        console.log('출근 처리 메시지가 표시되지 않음');
      }
    } else {
      console.log('출근 버튼이 표시되지 않음');
    }
    
    if (await checkOutButton.isVisible()) {
      console.log('퇴근 버튼이 표시됨');
      
      // 퇴근 버튼 클릭
      await checkOutButton.click();
      await page.waitForTimeout(1000);
      
      // 퇴근 처리 완료 확인
      const successMessage = page.locator('text=퇴근 처리 완료, text=퇴근되었습니다, text=성공');
      if (await successMessage.isVisible()) {
        console.log('퇴근 처리 성공');
      } else {
        console.log('퇴근 처리 메시지가 표시되지 않음');
      }
    } else {
      console.log('퇴근 버튼이 표시되지 않음');
    }
  });

  test('출근 기록 필터링 및 검색 테스트', async ({ page }) => {
    // 팀 관리 기능 직원 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    
    // 검색 기능 확인
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"], input[placeholder*="이름"]');
    if (await searchInput.isVisible()) {
      console.log('검색 입력 필드가 표시됨');
      
      // 검색어 입력
      await searchInput.fill('하상희');
      await page.waitForTimeout(1000);
      
      // 검색 결과 확인
      const searchResults = page.locator('tbody tr');
      const resultCount = await searchResults.count();
      console.log('검색 결과 수:', resultCount);
      
      // 하상희 관련 결과가 있는지 확인
      const haSangheeRow = page.locator('text=하상희');
      if (await haSangheeRow.isVisible()) {
        console.log('하상희 검색 결과가 표시됨');
      } else {
        console.log('하상희 검색 결과가 표시되지 않음');
      }
    } else {
      console.log('검색 입력 필드가 표시되지 않음');
    }
    
    // 날짜 필터 확인
    const dateFilter = page.locator('input[type="date"], .date-filter');
    if (await dateFilter.isVisible()) {
      console.log('날짜 필터가 표시됨');
      
      // 오늘 날짜 선택
      const today = new Date().toISOString().split('T')[0];
      await dateFilter.fill(today);
      await page.waitForTimeout(1000);
      
      console.log('오늘 날짜로 필터링됨:', today);
    } else {
      console.log('날짜 필터가 표시되지 않음');
    }
    
    // 부서 필터 확인
    const departmentFilter = page.locator('select, .department-filter');
    if (await departmentFilter.isVisible()) {
      console.log('부서 필터가 표시됨');
      
      // 필터 옵션 확인
      const options = departmentFilter.locator('option');
      const optionCount = await options.count();
      console.log('부서 필터 옵션 수:', optionCount);
      
      if (optionCount > 1) {
        // 첫 번째 옵션 선택
        await departmentFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        console.log('부서 필터 적용됨');
      }
    } else {
      console.log('부서 필터가 표시되지 않음');
    }
  });

  test('엑셀 다운로드 기능 테스트', async ({ page }) => {
    // 팀 관리 기능 직원 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    
    // 엑셀 다운로드 버튼 찾기
    const excelButton = page.locator('button:has-text("엑셀 다운로드"), a:has-text("엑셀"), text=엑셀');
    if (await excelButton.isVisible()) {
      console.log('엑셀 다운로드 버튼이 표시됨');
      
      // 엑셀 다운로드 버튼 클릭
      await excelButton.click();
      await page.waitForTimeout(2000);
      
      console.log('엑셀 다운로드 버튼 클릭됨');
      
      // 다운로드 완료 확인 (파일 다운로드 이벤트 감지)
      const downloadPromise = page.waitForEvent('download');
      try {
        const download = await downloadPromise;
        console.log('파일 다운로드 시작:', download.suggestedFilename());
      } catch (error) {
        console.log('파일 다운로드 이벤트가 발생하지 않음');
      }
    } else {
      console.log('엑셀 다운로드 버튼이 표시되지 않음');
    }
  });
});
