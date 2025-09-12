import { test, expect } from '@playwright/test';

test('당사자(허상원) 정산서 조회 테스트', async ({ page }) => {
  console.log('🧪 당사자(허상원) 정산서 조회 테스트 시작');
  
  // 1. 허상원 로그인
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  
  // 로그인 페이지 구조 확인
  const pageContent = await page.content();
  console.log('📄 로그인 페이지 접근 완료');
  
  // 다양한 로그인 방법 시도
  const usernameInput = page.locator('input[type="text"], input[name="username"], input[name="email"], input[placeholder*="사용자"], input[placeholder*="아이디"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
  
  if (await usernameInput.count() > 0) {
    await usernameInput.fill('maslabs-003@maslabs.kr');
    console.log('✅ 허상원 이메일 입력 완료');
  } else {
    console.log('❌ 사용자명 입력 필드를 찾을 수 없음');
  }
  
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('89484501');
    console.log('✅ 허상원 비밀번호 입력 완료');
  } else {
    console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
  }
  
  if (await submitButton.count() > 0) {
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭');
    await page.waitForTimeout(3000);
  } else {
    console.log('❌ 로그인 버튼을 찾을 수 없음');
  }
  
  console.log('✅ 허상원 로그인 완료');
  
  // 2. 정산서 페이지로 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 3. 정산서 목록 확인
  const pageContentAfter = await page.content();
  console.log('📄 정산서 페이지 내용 확인');
  
  // 정산서 목록이 있는지 확인
  const hasPayslips = pageContentAfter.includes('2025-08') || pageContentAfter.includes('1,137,500') || pageContentAfter.includes('허상원');
  if (hasPayslips) {
    console.log('✅ 정산서 목록 확인됨');
  } else {
    console.log('❌ 정산서 목록을 찾을 수 없음');
    console.log('   페이지 내용 일부:', pageContentAfter.substring(0, 500));
  }
  
  // 4. 정산서 테이블 확인
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
  } else {
    console.log('❌ 정산서 테이블을 찾을 수 없음');
  }
  
  // 5. 정산서 상세보기 테스트
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
      const summary = page.locator('.grid.grid-cols-2');
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
  
  // 6. 인쇄 기능 테스트
  const printButton = page.locator('button:has-text("인쇄")').first();
  if (await printButton.count() > 0) {
    console.log('✅ 인쇄 버튼 발견');
    
    // 인쇄 버튼 클릭 (실제 인쇄는 하지 않음)
    await printButton.click();
    console.log('✅ 인쇄 버튼 클릭');
    await page.waitForTimeout(1000);
  } else {
    console.log('❌ 인쇄 버튼을 찾을 수 없음');
  }
  
  // 7. 페이지 스크린샷
  await page.screenshot({ path: 'test-results/employee-payslip-page.png' });
  console.log('📸 허상원 정산서 페이지 스크린샷 저장');
  
  console.log('🎉 당사자(허상원) 정산서 조회 테스트 완료');
});
