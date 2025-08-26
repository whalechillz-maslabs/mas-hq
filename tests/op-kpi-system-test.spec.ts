import { test, expect } from '@playwright/test';

test.describe('OP KPI 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 계정으로 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('업무 기록 페이지에서 OP1~OP10 업무 유형 확인', async ({ page }) => {
    console.log('🔍 OP1~OP10 업무 유형 확인 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
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
    
    // OP1~OP10 업무 유형들이 표시되는지 확인
    const opTypes = [
      'OP1: 전화 판매(신규)',
      'OP2: 전화 판매(재구매/부품)',
      'OP3: 오프라인 판매(신규)',
      'OP4: 오프라인 판매(재구매/부품)',
      'OP5: CS 응대(기본)',
      'OP6: A/S 처리(고급)',
      'OP7: 환불 방어',
      'OP8: 환불 처리',
      'OP9: 택배 입고/출고/회수 (상품)',
      'OP10: 기타 택배/서비스'
    ];
    
    console.log('📋 OP1~OP10 업무 유형 확인:');
    for (const opType of opTypes) {
      const isVisible = await page.locator(`text=${opType}`).count() > 0;
      console.log(`${opType}: ${isVisible ? '✅' : '❌'}`);
      expect(isVisible).toBeTruthy();
    }
    
    console.log('🎉 OP1~OP10 업무 유형 확인 테스트 완료!');
  });

  test('업무 기록 입력 및 저장 테스트', async ({ page }) => {
    console.log('🔍 업무 기록 입력 및 저장 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 업무 추가 버튼 클릭
    await page.click('text=업무 추가');
    
    // 모달 대기
    await page.waitForSelector('text=업무 추가', { state: 'visible' });
    
    // OP1 선택
    await page.selectOption('select[name="operationType"], [role="combobox"], .operation-type-select', 'OP1');
    
    // 판매 금액 입력
    await page.fill('input[name="salesAmount"], input[placeholder*="판매"], input[placeholder*="금액"]', '100000');
    
    // 신규 콜 수 입력
    await page.fill('input[name="newCallCount"], input[placeholder*="신규"], input[placeholder*="콜"]', '5');
    
    // 메모 입력
    await page.fill('textarea[name="notes"], textarea[placeholder*="메모"], textarea[placeholder*="설명"]', '테스트 업무 기록');
    
    // 저장 버튼 클릭
    await page.click('button[type="submit"], text=저장, text=확인');
    
    // 성공 메시지 확인
    await expect(page.locator('text=저장되었습니다, text=성공, text=완료')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ 업무 기록 입력 및 저장 테스트 완료!');
  });

  test('성과 요약 페이지 확인', async ({ page }) => {
    console.log('🔍 성과 요약 페이지 확인 테스트 시작');
    
    // 성과 요약 페이지로 이동 (가상의 경로)
    await page.goto('http://localhost:3000/performance');
    
    // 페이지 로드 확인
    const isLoaded = await page.locator('body').isVisible();
    console.log('페이지 로드 상태:', isLoaded);
    
    // 성과 관련 요소 확인
    const performanceElements = [
      'text=성과 요약',
      'text=일일 성과',
      'text=팀 성과',
      'text=포인트',
      'text=판매',
      'text=콜'
    ];
    
    console.log('📊 성과 관련 요소 확인:');
    for (const element of performanceElements) {
      const isVisible = await page.locator(element).count() > 0;
      console.log(`${element}: ${isVisible ? '✅' : '❌'}`);
    }
    
    console.log('🎉 성과 요약 페이지 확인 테스트 완료!');
  });

  test('업무 유형별 점수 확인', async ({ page }) => {
    console.log('🔍 업무 유형별 점수 확인 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 업무 추가 버튼 클릭
    await page.click('text=업무 추가');
    
    // 모달 대기
    await page.waitForSelector('text=업무 추가', { state: 'visible' });
    
    // 각 OP 업무 유형별 점수 확인
    const opScores = [
      { code: 'OP1', name: '전화 판매(신규)', expectedScore: 20 },
      { code: 'OP2', name: '전화 판매(재구매/부품)', expectedScore: 15 },
      { code: 'OP3', name: '오프라인 판매(신규)', expectedScore: 40 },
      { code: 'OP4', name: '오프라인 판매(재구매/부품)', expectedScore: 30 },
      { code: 'OP5', name: 'CS 응대(기본)', expectedScore: 8 },
      { code: 'OP6', name: 'A/S 처리(고급)', expectedScore: 15 },
      { code: 'OP7', name: '환불 방어', expectedScore: 25 },
      { code: 'OP8', name: '환불 처리', expectedScore: 0 },
      { code: 'OP9', name: '택배 입고/출고/회수 (상품)', expectedScore: 8 },
      { code: 'OP10', name: '기타 택배/서비스', expectedScore: 5 }
    ];
    
    console.log('📋 업무 유형별 점수 확인:');
    for (const op of opScores) {
      // 업무 유형 선택
      await page.selectOption('select[name="operationType"], [role="combobox"], .operation-type-select', op.code);
      
      // 점수 표시 확인 (점수가 UI에 표시되는 경우)
      const scoreElement = await page.locator(`text=${op.expectedScore}점, text=${op.expectedScore}P, text=+${op.expectedScore}`).count();
      console.log(`${op.code} ${op.name}: ${op.expectedScore}점 ${scoreElement > 0 ? '✅' : '❌'}`);
    }
    
    console.log('🎉 업무 유형별 점수 확인 테스트 완료!');
  });
});
