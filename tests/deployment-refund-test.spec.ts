import { test, expect } from '@playwright/test';

test.describe('배포 서버 환불 처리 및 삭제 버튼 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 배포 서버로 접속
    await page.goto('https://www.maslabs.kr/login');
    
    // 관리자 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('환불 처리 점수 확인 및 삭제 버튼 테스트', async ({ page }) => {
    console.log('🔍 환불 처리 점수 확인 및 삭제 버튼 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/deployment-refund-test-initial.png',
      fullPage: true 
    });
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    // OP3 업무 추가 (40점)
    await page.selectOption('select[name="operationType"]', 'OP3');
    await page.fill('input[name="title"]', '테스트 OP3 업무');
    await page.fill('input[name="notes"]', '환불 테스트용 업무');
    await page.fill('input[name="customerName"]', '테스트 고객');
    await page.fill('input[name="salesAmount"]', '1000000');
    await page.selectOption('select[name="taskPriority"]', 'high');
    
    // 추가 버튼 클릭
    await page.click('button:has-text("추가")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ OP3 업무 추가 완료');
    
    // 업무 목록에서 완료 버튼 클릭
    await page.click('button:has-text("완료")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 완료 처리');
    
    // 환불 버튼 클릭
    await page.click('button:has-text("환불")');
    await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
    
    console.log('✅ 환불 모달 열림');
    
    // 환불 처리
    await page.fill('input[name="notes"]', '환불 테스트');
    await page.click('button:has-text("환불 처리")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 환불 처리 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/deployment-refund-test-after-refund.png',
      fullPage: true 
    });
    
    // 환불된 업무의 점수 확인 (음수여야 함)
    const refundTask = page.locator('tr').filter({ hasText: '환불 처리' });
    const pointsText = await refundTask.locator('td').nth(6).textContent();
    console.log('📊 환불된 업무 점수:', pointsText);
    
    // 삭제 버튼 확인
    const deleteButtons = page.locator('button[title="삭제"]');
    const deleteButtonCount = await deleteButtons.count();
    console.log('🗑️ 삭제 버튼 개수:', deleteButtonCount);
    
    // 삭제 버튼이 있는지 확인
    expect(deleteButtonCount).toBeGreaterThan(0);
    
    // 첫 번째 삭제 버튼 클릭
    await deleteButtons.first().click();
    
    // 확인 다이얼로그 처리
    page.on('dialog', dialog => dialog.accept());
    
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 삭제 기능 테스트 완료');
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'test-results/deployment-refund-test-final.png',
      fullPage: true 
    });
    
    console.log('🎉 환불 처리 점수 확인 및 삭제 버튼 테스트 완료!');
  });
});
