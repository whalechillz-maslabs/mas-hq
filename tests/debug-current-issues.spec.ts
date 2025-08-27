import { test, expect } from '@playwright/test';

test.describe('현재 문제 진단 테스트', () => {
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

  test('현재 문제 진단', async ({ page }) => {
    console.log('🔍 현재 문제 진단 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/debug-current-issues.png',
      fullPage: true 
    });
    
    // 1. 업무 추가 버튼 확인
    const addButton = page.locator('button:has-text("업무 추가")');
    const addButtonCount = await addButton.count();
    console.log('📊 업무 추가 버튼 개수:', addButtonCount);
    
    if (addButtonCount > 0) {
      console.log('✅ 업무 추가 버튼 존재');
      
      // 업무 추가 버튼 클릭 시도
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // 모달이 열렸는지 확인
      const modal = page.locator('div[class*="fixed"]');
      const modalCount = await modal.count();
      console.log('📊 모달 개수:', modalCount);
      
      if (modalCount > 0) {
        console.log('✅ 업무 추가 모달이 열림');
        
        // 모달 내용 확인
        const modalContent = await modal.first().textContent();
        console.log('📋 모달 내용:', modalContent?.substring(0, 200));
        
        // 모달 닫기
        const closeButton = modal.locator('button:has-text("취소")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
      } else {
        console.log('❌ 업무 추가 모달이 열리지 않음');
      }
    } else {
      console.log('❌ 업무 추가 버튼이 없음');
    }
    
    // 2. OP8 카드 확인
    const op8Cards = page.locator('div').filter({ hasText: 'OP8' });
    const op8CardCount = await op8Cards.count();
    console.log('📊 OP8 카드 개수:', op8CardCount);
    
    if (op8CardCount === 0) {
      console.log('❌ OP8 카드가 없음 - 환불 설명이 없음');
    } else {
      console.log('✅ OP8 카드 존재');
    }
    
    // 3. 상태 변경 버튼 확인
    const statusButtons = page.locator('button:has-text("상태")');
    const statusButtonCount = await statusButtons.count();
    console.log('📊 상태 변경 버튼 개수:', statusButtonCount);
    
    if (statusButtonCount === 0) {
      console.log('❌ 상태 변경 버튼이 없음');
    } else {
      console.log('✅ 상태 변경 버튼 존재');
    }
    
    // 4. 업무 목록 확인
    const taskRows = page.locator('tbody tr');
    const taskRowCount = await taskRows.count();
    console.log('📊 업무 목록 행 개수:', taskRowCount);
    
    if (taskRowCount > 0) {
      console.log('✅ 업무 목록이 있음');
      
      // 첫 번째 업무의 액션 버튼 확인
      const firstTaskActions = taskRows.first().locator('td:last-child button');
      const actionButtonCount = await firstTaskActions.count();
      console.log('📊 첫 번째 업무 액션 버튼 개수:', actionButtonCount);
      
      // 액션 버튼들 확인
      for (let i = 0; i < actionButtonCount; i++) {
        const button = firstTaskActions.nth(i);
        const buttonText = await button.textContent();
        const buttonTitle = await button.getAttribute('title');
        console.log(`📋 액션 버튼 ${i+1}: "${buttonText}" (title: "${buttonTitle}")`);
      }
    } else {
      console.log('❌ 업무 목록이 없음');
    }
    
    // 5. OP 카드들 확인
    const opCards = page.locator('div').filter({ hasText: /^OP\d+/ });
    const opCardCount = await opCards.count();
    console.log('📊 OP 카드 총 개수:', opCardCount);
    
    // 각 OP 카드 확인
    for (let i = 0; i < Math.min(opCardCount, 10); i++) {
      const card = opCards.nth(i);
      const cardText = await card.textContent();
      console.log(`📋 OP 카드 ${i+1}: ${cardText?.substring(0, 100)}`);
    }
    
    console.log('🎉 현재 문제 진단 완료!');
  });
});
