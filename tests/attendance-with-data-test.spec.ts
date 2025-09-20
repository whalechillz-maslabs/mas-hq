import { test, expect } from '@playwright/test';

test.describe('데이터가 있는 날짜로 출근 관리 테스트', () => {
  test('9월 19일 데이터로 필터 테스트', async ({ page }) => {
    console.log('🚀 9월 19일 데이터로 테스트 시작');
    
    // 콘솔 메시지 모니터링
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('스케줄')) {
        console.log(`📝 ${msg.text()}`);
      }
    });
    
    // 페이지로 이동
    await page.goto('https://maslabs.kr/admin/insert-attendance');
    await page.waitForLoadState('networkidle');
    
    // 날짜를 9월 19일로 변경
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-09-19');
    console.log('📅 날짜를 2025-09-19로 설정');
    
    // 전체 직원, 전체 상태로 조회
    const employeeSelect = page.locator('select').first();
    const statusSelect = page.locator('select').nth(1);
    const searchButton = page.locator('button:has-text("조회")');
    
    await employeeSelect.selectOption('all');
    await statusSelect.selectOption('all');
    console.log('🔍 전체 조회 시작');
    await searchButton.click();
    
    // 결과 대기
    await page.waitForTimeout(3000);
    
    // 테이블 확인
    const table = page.locator('table');
    const hasTable = await table.isVisible();
    console.log(`📊 테이블 존재: ${hasTable}`);
    
    if (hasTable) {
      const rowCount = await page.locator('tbody tr').count();
      console.log(`📋 테이블 행 개수: ${rowCount}`);
      
      // 첫 번째 행의 내용 확인
      if (rowCount > 0) {
        const firstRowText = await page.locator('tbody tr').first().innerText();
        console.log(`📄 첫 번째 행: ${firstRowText}`);
      }
    }
    
    // 완료 상태 필터 테스트
    console.log('🔄 완료 상태 필터 테스트');
    await statusSelect.selectOption('completed');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    const completedRows = await page.locator('tbody tr').count();
    console.log(`✅ 완료 상태 행 개수: ${completedRows}`);
    
    // 미출근 상태 필터 테스트
    console.log('🔄 미출근 상태 필터 테스트');
    await statusSelect.selectOption('no-attendance');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    const noAttendanceRows = await page.locator('tbody tr').count();
    console.log(`❌ 미출근 상태 행 개수: ${noAttendanceRows}`);
    
    console.log('🏁 9월 19일 데이터 테스트 완료');
  });
});
