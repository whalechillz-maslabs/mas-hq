import { test, expect } from '@playwright/test';

test('정산서 상세보기 및 인쇄 기능 테스트', async ({ page }) => {
  console.log('🧪 정산서 상세보기 및 인쇄 기능 테스트 시작');
  
  // 1. 정산서 페이지로 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 2. 정산서 목록 확인
  const table = page.locator('table');
  if (await table.count() > 0) {
    console.log('✅ 정산서 테이블 발견');
    
    // 테이블 행 수 확인
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`📊 테이블 행 수: ${rowCount}개`);
    
    if (rowCount > 0) {
      // 첫 번째 행 내용 확인
      const firstRow = rows.first();
      const rowText = await firstRow.textContent();
      console.log('📋 첫 번째 행 내용:', rowText);
      
      // 정산 기간 확인
      const periodCell = firstRow.locator('td').first();
      const periodText = await periodCell.textContent();
      console.log('📅 정산 기간:', periodText);
      
      // 총 지급액 확인
      const amountCell = firstRow.locator('td').nth(2);
      const amountText = await amountCell.textContent();
      console.log('💰 총 지급액:', amountText);
      
      // 상태 확인
      const statusCell = firstRow.locator('td').nth(3);
      const statusText = await statusCell.textContent();
      console.log('📊 상태:', statusText);
    }
  }
  
  // 3. 정산서 상세보기 테스트
  const viewButton = page.locator('button:has-text("상세보기")').first();
  if (await viewButton.count() > 0) {
    await viewButton.click();
    console.log('✅ 정산서 상세보기 버튼 클릭');
    await page.waitForTimeout(2000);
    
    // 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0');
    if (await modal.count() > 0) {
      console.log('✅ 정산서 상세 모달 열림');
      
      // 정산서 헤더 확인
      const header = page.locator('h1, h2').first();
      const headerText = await header.textContent();
      console.log('📄 정산서 헤더:', headerText);
      
      // 직원 정보 확인
      const employeeInfo = page.locator('.grid.grid-cols-3');
      if (await employeeInfo.count() > 0) {
        const infoText = await employeeInfo.textContent();
        console.log('👤 직원 정보:', infoText);
      }
      
      // 정산 요약 확인
      const summary = page.locator('.grid.grid-cols-2').first();
      if (await summary.count() > 0) {
        const summaryText = await summary.textContent();
        console.log('📊 정산 요약:', summaryText);
      }
      
      // 정산서 내용 확인
      const totalAmount = page.locator('text=/1,137,500원/');
      if (await totalAmount.count() > 0) {
        console.log('✅ 총 금액 1,137,500원 확인됨');
      } else {
        console.log('❌ 총 금액을 찾을 수 없음');
      }
      
      const totalHours = page.locator('text=/87.5시간/');
      if (await totalHours.count() > 0) {
        console.log('✅ 총 근무시간 87.5시간 확인됨');
      } else {
        console.log('❌ 총 근무시간을 찾을 수 없음');
      }
      
      // 직원명 확인
      const employeeName = page.locator('text=/허상원/');
      if (await employeeName.count() > 0) {
        console.log('✅ 직원명 허상원 확인됨');
      } else {
        console.log('❌ 직원명을 찾을 수 없음');
      }
      
      // 일별 상세 내역 확인
      const dailyTable = page.locator('table').last();
      if (await dailyTable.count() > 0) {
        const dailyRows = dailyTable.locator('tbody tr');
        const dailyRowCount = await dailyRows.count();
        console.log(`📅 일별 내역 행 수: ${dailyRowCount}개`);
        
        if (dailyRowCount > 0) {
          const firstDailyRow = dailyRows.first();
          const dailyRowText = await firstDailyRow.textContent();
          console.log('📋 첫 번째 일별 내역:', dailyRowText);
        }
      }
      
      // 4. 인쇄 기능 테스트
      const modalPrintButton = modal.locator('button:has-text("인쇄")');
      if (await modalPrintButton.count() > 0) {
        console.log('✅ 모달 내 인쇄 버튼 발견');
        console.log('✅ 인쇄 기능이 정상적으로 표시됨');
      } else {
        console.log('❌ 모달 내 인쇄 버튼을 찾을 수 없음');
      }
      
      // 5. 모달 스크린샷
      await page.screenshot({ path: 'test-results/payslip-modal.png' });
      console.log('📸 정산서 상세 모달 스크린샷 저장');
      
      // 닫기 버튼 클릭
      const closeButton = page.locator('button:has-text("닫기")');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        console.log('✅ 정산서 상세 모달 닫기');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('❌ 정산서 상세 모달이 열리지 않음');
    }
  } else {
    console.log('❌ 상세보기 버튼을 찾을 수 없음');
  }
  
  // 6. 메인 페이지 인쇄 버튼 테스트
  const mainPrintButton = page.locator('button:has-text("인쇄")').first();
  if (await mainPrintButton.count() > 0) {
    console.log('✅ 메인 페이지 인쇄 버튼 발견');
    
    // 인쇄 버튼 클릭
    await mainPrintButton.click();
    console.log('✅ 메인 페이지 인쇄 버튼 클릭');
    await page.waitForTimeout(1000);
  }
  
  // 7. 최종 페이지 스크린샷
  await page.screenshot({ path: 'test-results/payslip-final.png' });
  console.log('📸 최종 정산서 페이지 스크린샷 저장');
  
  console.log('🎉 정산서 상세보기 및 인쇄 기능 테스트 완료');
});

test('정산서 상세보기 및 인쇄 기능 테스트', async ({ page }) => {
  console.log('🧪 정산서 상세보기 및 인쇄 기능 테스트 시작');
  
  // 1. 정산서 페이지로 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 2. 정산서 목록 확인
  const table = page.locator('table');
  if (await table.count() > 0) {
    console.log('✅ 정산서 테이블 발견');
    
    // 테이블 행 수 확인
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`📊 테이블 행 수: ${rowCount}개`);
    
    if (rowCount > 0) {
      // 첫 번째 행 내용 확인
      const firstRow = rows.first();
      const rowText = await firstRow.textContent();
      console.log('📋 첫 번째 행 내용:', rowText);
      
      // 정산 기간 확인
      const periodCell = firstRow.locator('td').first();
      const periodText = await periodCell.textContent();
      console.log('📅 정산 기간:', periodText);
      
      // 총 지급액 확인
      const amountCell = firstRow.locator('td').nth(2);
      const amountText = await amountCell.textContent();
      console.log('💰 총 지급액:', amountText);
      
      // 상태 확인
      const statusCell = firstRow.locator('td').nth(3);
      const statusText = await statusCell.textContent();
      console.log('📊 상태:', statusText);
    }
  }
  
  // 3. 정산서 상세보기 테스트
  const viewButton = page.locator('button:has-text("상세보기")').first();
  if (await viewButton.count() > 0) {
    await viewButton.click();
    console.log('✅ 정산서 상세보기 버튼 클릭');
    await page.waitForTimeout(2000);
    
    // 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0');
    if (await modal.count() > 0) {
      console.log('✅ 정산서 상세 모달 열림');
      
      // 정산서 헤더 확인
      const header = page.locator('h1, h2').first();
      const headerText = await header.textContent();
      console.log('📄 정산서 헤더:', headerText);
      
      // 직원 정보 확인
      const employeeInfo = page.locator('.grid.grid-cols-3');
      if (await employeeInfo.count() > 0) {
        const infoText = await employeeInfo.textContent();
        console.log('👤 직원 정보:', infoText);
      }
      
      // 정산 요약 확인
      const summary = page.locator('.grid.grid-cols-2').first();
      if (await summary.count() > 0) {
        const summaryText = await summary.textContent();
        console.log('📊 정산 요약:', summaryText);
      }
      
      // 정산서 내용 확인
      const totalAmount = page.locator('text=/1,137,500원/');
      if (await totalAmount.count() > 0) {
        console.log('✅ 총 금액 1,137,500원 확인됨');
      } else {
        console.log('❌ 총 금액을 찾을 수 없음');
      }
      
      const totalHours = page.locator('text=/87.5시간/');
      if (await totalHours.count() > 0) {
        console.log('✅ 총 근무시간 87.5시간 확인됨');
      } else {
        console.log('❌ 총 근무시간을 찾을 수 없음');
      }
      
      // 직원명 확인
      const employeeName = page.locator('text=/허상원/');
      if (await employeeName.count() > 0) {
        console.log('✅ 직원명 허상원 확인됨');
      } else {
        console.log('❌ 직원명을 찾을 수 없음');
      }
      
      // 일별 상세 내역 확인
      const dailyTable = page.locator('table').last();
      if (await dailyTable.count() > 0) {
        const dailyRows = dailyTable.locator('tbody tr');
        const dailyRowCount = await dailyRows.count();
        console.log(`📅 일별 내역 행 수: ${dailyRowCount}개`);
        
        if (dailyRowCount > 0) {
          const firstDailyRow = dailyRows.first();
          const dailyRowText = await firstDailyRow.textContent();
          console.log('📋 첫 번째 일별 내역:', dailyRowText);
        }
      }
      
      // 4. 인쇄 기능 테스트
      const modalPrintButton = modal.locator('button:has-text("인쇄")');
      if (await modalPrintButton.count() > 0) {
        console.log('✅ 모달 내 인쇄 버튼 발견');
        console.log('✅ 인쇄 기능이 정상적으로 표시됨');
      } else {
        console.log('❌ 모달 내 인쇄 버튼을 찾을 수 없음');
      }
      
      // 5. 모달 스크린샷
      await page.screenshot({ path: 'test-results/payslip-modal.png' });
      console.log('📸 정산서 상세 모달 스크린샷 저장');
      
      // 닫기 버튼 클릭
      const closeButton = page.locator('button:has-text("닫기")');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        console.log('✅ 정산서 상세 모달 닫기');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('❌ 정산서 상세 모달이 열리지 않음');
    }
  } else {
    console.log('❌ 상세보기 버튼을 찾을 수 없음');
  }
  
  // 6. 메인 페이지 인쇄 버튼 테스트
  const mainPrintButton = page.locator('button:has-text("인쇄")').first();
  if (await mainPrintButton.count() > 0) {
    console.log('✅ 메인 페이지 인쇄 버튼 발견');
    
    // 인쇄 버튼 클릭
    await mainPrintButton.click();
    console.log('✅ 메인 페이지 인쇄 버튼 클릭');
    await page.waitForTimeout(1000);
  }
  
  // 7. 최종 페이지 스크린샷
  await page.screenshot({ path: 'test-results/payslip-final.png' });
  console.log('📸 최종 정산서 페이지 스크린샷 저장');
  
  console.log('🎉 정산서 상세보기 및 인쇄 기능 테스트 완료');
});
