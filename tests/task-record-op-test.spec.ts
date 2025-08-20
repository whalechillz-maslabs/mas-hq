import { test, expect } from '@playwright/test';

test.describe('업무 기록 페이지 OP1~10 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 계정으로 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('업무 기록 페이지 접근 및 OP1~10 업무 유형 확인', async ({ page }) => {
    console.log('🔍 업무 기록 페이지 OP1~10 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.click('text=업무 기록');
    await page.waitForURL('**/tasks');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 제목 확인
    await expect(page.locator('text=업무 기록')).toBeVisible();
    
    // 업무 추가 버튼 확인
    await expect(page.locator('text=업무 추가')).toBeVisible();
    
    console.log('✅ 업무 추가 버튼 확인 완료');
    
    // 업무 추가 버튼 클릭
    await page.click('text=업무 추가');
    
    // 모달이 나타날 때까지 대기
    await page.waitForSelector('text=업무 추가', { state: 'visible' });
    
    console.log('✅ 업무 추가 모달 열림');
    
    // 업무 유형 드롭다운 클릭
    await page.click('select[name="operationType"], [role="combobox"], .operation-type-select');
    
    // OP1~10 업무 유형들이 표시되는지 확인
    const opTypes = [
      'OP1: 쇼핑몰 단순 판매',
      'OP2: 전화 판매',
      'OP3: 오프라인 판매 보조',
      'OP4: 오프라인 판매 단독',
      'OP5: 반품 방어 성공',
      'OP6: 재반품 발생',
      'OP7: 제품 입고 관리',
      'OP8: 택배 업무',
      'OP9: 콘텐츠 작성',
      'OP10: 기타 업무'
    ];
    
    for (const opType of opTypes) {
      const isVisible = await page.locator(`text=${opType}`).count() > 0;
      console.log(`${opType}: ${isVisible ? '✅' : '❌'}`);
    }
    
    // 업무 유형별 분포 섹션에서 OP1~10 확인
    await page.click('button:has-text("취소"), .modal-close, [aria-label="Close"]');
    
    // 페이지에서 OP1~10이 표시되는지 확인
    const opDistribution = [
      'OP1',
      'OP2', 
      'OP3',
      'OP4',
      'OP5',
      'OP6',
      'OP7',
      'OP8',
      'OP9',
      'OP10'
    ];
    
    console.log('📊 업무 유형별 분포 확인:');
    for (const op of opDistribution) {
      const isVisible = await page.locator(`text=${op}`).count() > 0;
      console.log(`${op}: ${isVisible ? '✅' : '❌'}`);
    }
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'task-record-op-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 업무 기록 페이지 OP1~10 테스트 완료!');
  });

  test('업무 추가 모달에서 OP1~10 선택 테스트', async ({ page }) => {
    console.log('🔍 업무 추가 모달 OP1~10 선택 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.click('text=업무 기록');
    await page.waitForURL('**/tasks');
    
    // 업무 추가 버튼 클릭
    await page.click('text=업무 추가');
    
    // 모달 대기
    await page.waitForSelector('text=업무 추가', { state: 'visible' });
    
    // 날짜 입력
    await page.fill('input[type="date"], input[name="taskDate"]', '2025-08-19');
    
    // 업무 유형 선택 (OP1)
    await page.selectOption('select[name="operationType"], .operation-type-select', 'OP1');
    
    // 업무명 입력
    await page.fill('input[name="taskName"], input[placeholder*="업무명"]', '테스트 업무');
    
    // 수량 입력
    await page.fill('input[name="quantity"], input[placeholder*="수량"]', '1');
    
    // 저장 버튼 클릭
    await page.click('button:has-text("저장"), button:has-text("추가")');
    
    // 성공 메시지 확인
    await page.waitForTimeout(2000);
    
    const successMessage = await page.locator('text=성공, text=추가됨, text=저장됨').count();
    console.log(`업무 추가 결과: ${successMessage > 0 ? '✅ 성공' : '❌ 실패'}`);
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'task-add-op-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 업무 추가 모달 OP1~10 선택 테스트 완료!');
  });
});
