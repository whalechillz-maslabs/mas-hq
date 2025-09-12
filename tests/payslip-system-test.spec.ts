import { test, expect } from '@playwright/test';

test('정산서 시스템 테스트', async ({ page }) => {
  console.log('🧪 정산서 시스템 테스트 시작');
  
  // 1. 허상원으로 로그인
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  
  // 로그인 시도
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('89484501'); // 허상원 비밀번호
    console.log('✅ 허상원 비밀번호 입력 완료');
  }
  
  const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
  if (await submitButton.count() > 0) {
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭');
    await page.waitForTimeout(3000);
  }
  
  // 2. 정산서 페이지로 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 3. 정산서 목록 확인
  const pageContent = await page.content();
  console.log('📄 페이지 내용 확인');
  
  // 정산서 목록이 있는지 확인
  const hasPayslips = pageContent.includes('2025-08') || pageContent.includes('1,137,500');
  if (hasPayslips) {
    console.log('✅ 정산서 목록 확인됨');
  } else {
    console.log('❌ 정산서 목록을 찾을 수 없음');
  }
  
  // 4. 정산서 상세보기 테스트
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
      }
      
      const totalHours = page.locator('text=/87.5시간/');
      if (await totalHours.count() > 0) {
        console.log('✅ 총 근무시간 87.5시간 확인됨');
      }
      
      // 닫기 버튼 클릭
      const closeButton = page.locator('button:has-text("닫기")');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        console.log('✅ 정산서 상세 모달 닫기');
      }
    }
  }
  
  // 5. 인쇄 기능 테스트
  const printButton = page.locator('button:has-text("인쇄")').first();
  if (await printButton.count() > 0) {
    console.log('✅ 인쇄 버튼 발견');
    
    // 인쇄 버튼 클릭 (실제 인쇄는 하지 않음)
    await printButton.click();
    console.log('✅ 인쇄 버튼 클릭');
    await page.waitForTimeout(1000);
  }
  
  // 6. 페이지 스크린샷
  await page.screenshot({ path: 'test-results/payslip-page.png' });
  console.log('📸 정산서 페이지 스크린샷 저장');
  
  console.log('🎉 정산서 시스템 테스트 완료');
});
