import { test, expect } from '@playwright/test';

test('정산서 페이지 디버깅 테스트', async ({ page }) => {
  console.log('🔍 정산서 페이지 디버깅 테스트 시작');
  
  // 1. 정산서 페이지로 직접 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 2. 페이지 콘솔 로그 확인
  page.on('console', msg => {
    console.log('브라우저 콘솔:', msg.text());
  });
  
  // 3. 페이지 내용 확인
  const pageContent = await page.content();
  console.log('📄 페이지 내용 길이:', pageContent.length);
  
  // 4. 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin, [class*="loading"], [class*="spinner"]');
  if (await loadingElement.count() > 0) {
    console.log('⏳ 로딩 중...');
    await page.waitForTimeout(3000);
  }
  
  // 5. 에러 메시지 확인
  const errorElements = page.locator('text=/오류|에러|error|Error/');
  const errorCount = await errorElements.count();
  if (errorCount > 0) {
    console.log(`❌ 에러 메시지 ${errorCount}개 발견:`);
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorElements.nth(i).textContent();
      console.log(`  ${i + 1}. ${errorText}`);
    }
  }
  
  // 6. 정산서 관련 요소 확인
  const payslipElements = page.locator('text=/정산서|급여|payslip|Payslip/');
  const payslipCount = await payslipElements.count();
  console.log(`📋 정산서 관련 요소 ${payslipCount}개 발견`);
  
  // 7. 테이블 요소 확인
  const tables = page.locator('table');
  const tableCount = await tables.count();
  console.log(`📊 테이블 ${tableCount}개 발견`);
  
  if (tableCount > 0) {
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      const tableText = await table.textContent();
      console.log(`  테이블 ${i + 1}:`, tableText?.substring(0, 200));
    }
  }
  
  // 8. 버튼 요소 확인
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`🔘 버튼 ${buttonCount}개 발견`);
  
  if (buttonCount > 0) {
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      console.log(`  버튼 ${i + 1}:`, buttonText);
    }
  }
  
  // 9. 허상원 관련 텍스트 확인
  const heoElements = page.locator('text=/허상원|HEO/');
  const heoCount = await heoElements.count();
  console.log(`👤 허상원 관련 요소 ${heoCount}개 발견`);
  
  // 10. 금액 관련 텍스트 확인
  const amountElements = page.locator('text=/1,137,500|1137500|253,500/');
  const amountCount = await amountElements.count();
  console.log(`💰 금액 관련 요소 ${amountCount}개 발견`);
  
  // 11. 페이지 스크린샷
  await page.screenshot({ path: 'test-results/payslip-debug.png', fullPage: true });
  console.log('📸 정산서 페이지 전체 스크린샷 저장');
  
  // 12. 네트워크 요청 확인
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('payslips') || response.url().includes('supabase')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  // 페이지 새로고침하여 네트워크 요청 확인
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log('🌐 네트워크 요청:', responses);
  
  console.log('🎉 정산서 페이지 디버깅 테스트 완료');
});
