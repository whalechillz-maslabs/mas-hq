import { test, expect } from '@playwright/test';

test.describe('KPI 업무 유형 시스템 종합 검증', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('1. KPI 업무 유형 목록 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 업무 추가 버튼 클릭
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await addButton.first().click();
    
    // 업무 유형 드롭다운 확인
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await expect(operationTypeSelect).toBeVisible();
    
    // 업무 유형 개수 확인 (기본 "선택하세요" + 32개 KPI 업무 유형)
    const options = await operationTypeSelect.locator('option').all();
    expect(options.length).toBe(33); // 1 + 32
    
    // 옵션 텍스트 확인
    const optionTexts = await operationTypeSelect.locator('option').allTextContents();
    console.log('총 업무 유형 개수:', options.length);
    
    // KPI 업무 유형 검증
    const expectedKpiTypes = [
      'TL_SALES', 'TL_YOY', 'TL_SCHEDULE', 'TL_CS', 'TL_TRAINING',
      'TM_PHONE_SALE', 'TM_OFFLINE_SALE', 'TM_OFFLINE_ASSIST', 
      'TM_SITA_SATISFACTION', 'TM_RETURN', 'TM_RETURN_DEFENSE',
      'MGMT_HIRING', 'MGMT_FUNNEL', 'MGMT_AD_CONVERSION', 
      'MGMT_CONTENT_VIEWS', 'MGMT_AUTOMATION'
    ];
    
    let foundKpiTypes = 0;
    expectedKpiTypes.forEach(kpiType => {
      if (optionTexts.some(text => text.includes(kpiType))) {
        foundKpiTypes++;
        console.log(`✅ ${kpiType} 발견`);
      } else {
        console.log(`❌ ${kpiType} 없음`);
      }
    });
    
    expect(foundKpiTypes).toBe(expectedKpiTypes.length);
    console.log(`✅ 모든 KPI 업무 유형 발견: ${foundKpiTypes}/${expectedKpiTypes.length}`);
    
    // 모달 닫기
    const closeButton = page.locator('button').filter({ hasText: '취소' });
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
    }
  });

  test('2. 팀장 KPI 업무 추가 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 업무 추가 버튼 클릭
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await addButton.first().click();
    
    // 팀장 KPI 업무 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    
    // 팀장 리드 판매 선택 (100점)
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await operationTypeSelect.selectOption({ index: 16 }); // SALE_LEAD
    
    await page.fill('input[name="task_name"]', '팀장 리드 판매 테스트');
    await page.fill('textarea[name="description"]', '팀장이 리드한 판매 성사');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', 'KPI 테스트용 팀장 리드 판매');
    
    // 업무 추가
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 모달 닫힘 확인
    await expect(page.locator('h3:has-text("업무 추가")')).not.toBeVisible();
    
    // 추가된 업무 확인
    await expect(page.locator('text=팀장 리드 판매 테스트')).toBeVisible({ timeout: 5000 });
    
    // 포인트 확인 (100점)
    await expect(page.locator('text=100')).toBeVisible();
    
    console.log('✅ 팀장 KPI 업무 추가 성공');
  });

  test('3. 팀원 KPI 업무 추가 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 업무 추가 버튼 클릭
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await addButton.first().click();
    
    // 팀원 KPI 업무 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    
    // 오프라인 단독 성사 선택 (40점)
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await operationTypeSelect.selectOption({ index: 26 }); // TM_OFFLINE_SALE
    
    await page.fill('input[name="task_name"]', '오프라인 단독 판매 테스트');
    await page.fill('textarea[name="description"]', '오프라인에서 단독으로 판매 성사');
    await page.fill('input[name="quantity"]', '2');
    await page.fill('textarea[name="employee_memo"]', 'KPI 테스트용 오프라인 판매');
    
    // 업무 추가
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 모달 닫힘 확인
    await expect(page.locator('h3:has-text("업무 추가")')).not.toBeVisible();
    
    // 추가된 업무 확인
    await expect(page.locator('text=오프라인 단독 판매 테스트')).toBeVisible({ timeout: 5000 });
    
    // 포인트 확인 (40점 × 2 = 80점)
    await expect(page.locator('text=80')).toBeVisible();
    
    console.log('✅ 팀원 KPI 업무 추가 성공');
  });

  test('4. 반품 업무 (음수 포인트) 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 업무 추가 버튼 클릭
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await addButton.first().click();
    
    // 반품 업무 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    
    // 반품 발생 선택 (-20점)
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await operationTypeSelect.selectOption({ index: 28 }); // TM_RETURN
    
    await page.fill('input[name="task_name"]', '반품 발생 테스트');
    await page.fill('textarea[name="description"]', '고객 반품 발생');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', 'KPI 테스트용 반품');
    
    // 업무 추가
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 모달 닫힘 확인
    await expect(page.locator('h3:has-text("업무 추가")')).not.toBeVisible();
    
    // 추가된 업무 확인
    await expect(page.locator('text=반품 발생 테스트')).toBeVisible({ timeout: 5000 });
    
    // 음수 포인트 확인 (-20점)
    await expect(page.locator('text=-20')).toBeVisible();
    
    console.log('✅ 반품 업무 (음수 포인트) 추가 성공');
  });

  test('5. 통계 카드 업데이트 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 초기 통계 확인
    const initialStats = await page.locator('.bg-white.rounded-lg.shadow p-6').all();
    const initialTotalPoints = await initialStats[2].locator('.text-2xl').textContent();
    console.log('초기 총 포인트:', initialTotalPoints);
    
    // 업무 추가
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await addButton.first().click();
    
    await page.fill('input[name="task_date"]', '2025-01-17');
    
    // 전화/온라인 성사 선택 (20점)
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await operationTypeSelect.selectOption({ index: 27 }); // TM_PHONE_SALE
    
    await page.fill('input[name="task_name"]', '통계 테스트 업무');
    await page.fill('textarea[name="description"]', '통계 업데이트 확인용');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', '통계 테스트');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 업데이트된 통계 확인
    const updatedStats = await page.locator('.bg-white.rounded-lg.shadow p-6').all();
    const updatedTotalPoints = await updatedStats[2].locator('.text-2xl').textContent();
    console.log('업데이트된 총 포인트:', updatedTotalPoints);
    
    // 포인트가 증가했는지 확인
    const initialPoints = parseInt(initialTotalPoints || '0');
    const updatedPoints = parseInt(updatedTotalPoints || '0');
    expect(updatedPoints).toBeGreaterThanOrEqual(initialPoints);
    
    console.log('✅ 통계 카드 업데이트 확인 성공');
  });

  test('6. 업무 유형별 포인트 계산 검증', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 업무 추가 버튼 클릭
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await addButton.first().click();
    
    // 테스트할 업무 유형들
    const testCases = [
      { index: 16, name: 'SALE_LEAD', points: 100, quantity: 1, expected: 100 },
      { index: 26, name: 'TM_OFFLINE_SALE', points: 40, quantity: 2, expected: 80 },
      { index: 28, name: 'TM_RETURN', points: -20, quantity: 1, expected: -20 },
      { index: 29, name: 'TM_RETURN_DEFENSE', points: 10, quantity: 3, expected: 30 }
    ];
    
    for (const testCase of testCases) {
      console.log(`테스트: ${testCase.name} (${testCase.points}점 × ${testCase.quantity})`);
      
      await page.fill('input[name="task_date"]', '2025-01-17');
      
      const operationTypeSelect = page.locator('select[name="operation_type_id"]');
      await operationTypeSelect.selectOption({ index: testCase.index });
      
      await page.fill('input[name="task_name"]', `${testCase.name} 포인트 테스트`);
      await page.fill('textarea[name="description"]', `${testCase.name} 포인트 계산 검증`);
      await page.fill('input[name="quantity"]', testCase.quantity.toString());
      await page.fill('textarea[name="employee_memo"]', `예상 포인트: ${testCase.expected}`);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // 모달 닫힘 확인
      await expect(page.locator('h3:has-text("업무 추가")')).not.toBeVisible();
      
      // 추가된 업무 확인
      await expect(page.locator(`text=${testCase.name} 포인트 테스트`)).toBeVisible({ timeout: 5000 });
      
      // 포인트 확인
      await expect(page.locator(`text=${testCase.expected}`)).toBeVisible();
      
      console.log(`✅ ${testCase.name} 포인트 계산 성공: ${testCase.expected}점`);
      
      // 다음 테스트를 위해 모달 다시 열기
      await addButton.first().click();
    }
  });
});
