import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 디버그', () => {
  test('출근 관리 페이지 접근 및 필터 테스트', async ({ page }) => {
    console.log('🚀 출근 관리 페이지 테스트 시작');
    
    // 페이지로 이동
    await page.goto('https://maslabs.kr/admin/insert-attendance');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 콘솔 에러 수집
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ 콘솔 에러:', msg.text());
      }
    });
    
    // 페이지 제목 확인
    const title = await page.textContent('h1');
    console.log('📋 페이지 제목:', title);
    
    // 날짜 선택 확인
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    console.log('📅 날짜 입력 필드 확인됨');
    
    // 직원 선택 드롭다운 확인
    const employeeSelect = page.locator('select').first();
    await expect(employeeSelect).toBeVisible();
    console.log('👥 직원 선택 드롭다운 확인됨');
    
    // 상태 필터 드롭다운 확인
    const statusSelect = page.locator('select').nth(1);
    await expect(statusSelect).toBeVisible();
    console.log('📊 상태 필터 드롭다운 확인됨');
    
    // 조회 버튼 확인
    const searchButton = page.locator('button:has-text("조회")');
    await expect(searchButton).toBeVisible();
    console.log('🔍 조회 버튼 확인됨');
    
    // 전체 조회 테스트
    console.log('🔄 전체 조회 테스트 시작');
    await employeeSelect.selectOption('all');
    await statusSelect.selectOption('all');
    await searchButton.click();
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 테이블 확인
    const table = page.locator('table');
    if (await table.isVisible()) {
      console.log('✅ 테이블이 정상적으로 표시됨');
      
      // 테이블 행 개수 확인
      const rows = await page.locator('tbody tr').count();
      console.log(`📋 테이블 행 개수: ${rows}`);
    } else {
      console.log('❌ 테이블이 표시되지 않음');
    }
    
    // 완료 조회 테스트
    console.log('🔄 완료 조회 테스트 시작');
    await statusSelect.selectOption('completed');
    await searchButton.click();
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 결과 확인
    if (await table.isVisible()) {
      const completedRows = await page.locator('tbody tr').count();
      console.log(`✅ 완료 상태 필터 작동: ${completedRows}개 행`);
    } else {
      console.log('❌ 완료 상태 필터에서 테이블이 표시되지 않음');
    }
    
    // 미출근 조회 테스트
    console.log('🔄 미출근 조회 테스트 시작');
    await statusSelect.selectOption('no-attendance');
    await searchButton.click();
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 결과 확인
    if (await table.isVisible()) {
      const noAttendanceRows = await page.locator('tbody tr').count();
      console.log(`✅ 미출근 상태 필터 작동: ${noAttendanceRows}개 행`);
    } else {
      console.log('❌ 미출근 상태 필터에서 테이블이 표시되지 않음');
    }
    
    // 콘솔 에러 확인
    if (consoleErrors.length > 0) {
      console.log('❌ 발견된 콘솔 에러들:');
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 콘솔 에러 없음');
    }
    
    console.log('🏁 출근 관리 페이지 테스트 완료');
  });
});
