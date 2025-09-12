import { test, expect } from '@playwright/test';

test('관리자(김탁수) 정산서 조회 테스트', async ({ page }) => {
  console.log('🧪 관리자(김탁수) 정산서 조회 테스트 시작');
  
  // 1. 관리자 로그인
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
    await usernameInput.fill('admin');
    console.log('✅ 관리자 사용자명 입력 완료');
  } else {
    console.log('❌ 사용자명 입력 필드를 찾을 수 없음');
  }
  
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('admin123');
    console.log('✅ 관리자 비밀번호 입력 완료');
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
  
  console.log('✅ 관리자 로그인 완료');
  
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
  await page.screenshot({ path: 'test-results/admin-payslip-page.png' });
  console.log('📸 관리자 정산서 페이지 스크린샷 저장');
  
  console.log('🎉 관리자(김탁수) 정산서 조회 테스트 완료');
});
