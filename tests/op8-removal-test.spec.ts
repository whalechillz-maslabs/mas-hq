import { test, expect } from '@playwright/test';

test.describe('OP8 카드 제거 확인 테스트', () => {
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

  test('OP8 카드가 제거되었는지 확인', async ({ page }) => {
    console.log('🔍 OP8 카드 제거 확인 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/op8-removal-test.png',
      fullPage: true 
    });
    
    // 1. OP8 카드가 없는지 확인
    const op8Cards = page.locator('div').filter({ hasText: 'OP8' });
    const op8CardCount = await op8Cards.count();
    console.log('📊 OP8 카드 개수:', op8CardCount);
    expect(op8CardCount).toBe(0);
    console.log('✅ OP8 카드가 제거됨을 확인');
    
    // 2. 다른 OP 카드들이 있는지 확인
    const op1Card = page.locator('div').filter({ hasText: 'OP1' });
    const op1CardCount = await op1Card.count();
    console.log('📊 OP1 카드 개수:', op1CardCount);
    expect(op1CardCount).toBeGreaterThan(0);
    console.log('✅ OP1 카드가 표시됨을 확인');
    
    const op3Card = page.locator('div').filter({ hasText: 'OP3' });
    const op3CardCount = await op3Card.count();
    console.log('📊 OP3 카드 개수:', op3CardCount);
    expect(op3CardCount).toBeGreaterThan(0);
    console.log('✅ OP3 카드가 표시됨을 확인');
    
    // 3. 상태 변경 버튼이 있는지 확인
    const statusButtons = page.locator('button:has-text("상태")');
    const statusButtonCount = await statusButtons.count();
    console.log('📊 상태 변경 버튼 개수:', statusButtonCount);
    expect(statusButtonCount).toBeGreaterThan(0);
    console.log('✅ 상태 변경 버튼이 표시됨을 확인');
    
    console.log('🎉 OP8 카드 제거 확인 테스트 완료!');
  });
});
