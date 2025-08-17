import { test, expect } from '@playwright/test';

test('KPI 업무 유형 간단 검증', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // 2. 업무 기록 페이지로 이동
  await page.goto('http://localhost:3000/tasks');
  await page.waitForLoadState('networkidle');
  
  // 3. 페이지 스크린샷
  await page.screenshot({ 
    path: 'kpi-verification-page.png', 
    fullPage: true 
  });
  
  // 4. 업무 추가 버튼 클릭
  const addButton = page.locator('button').filter({ hasText: '업무 추가' });
  await addButton.first().click();
  
  // 5. 모달 스크린샷
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'kpi-verification-modal.png', 
    fullPage: true 
  });
  
  // 6. 업무 유형 드롭다운 확인
  const operationTypeSelect = page.locator('select[name="operation_type_id"]');
  await expect(operationTypeSelect).toBeVisible();
  
  // 7. 업무 유형 개수 확인
  const options = await operationTypeSelect.locator('option').all();
  console.log('총 업무 유형 개수:', options.length);
  expect(options.length).toBe(33); // 1 + 32
  
  // 8. 옵션 텍스트 확인
  const optionTexts = await operationTypeSelect.locator('option').allTextContents();
  
  // 9. 주요 KPI 업무 유형 확인
  const keyKpiTypes = [
    'TL_SALES', 'TL_YOY', 'TL_SCHEDULE', 'TL_CS', 'TL_TRAINING',
    'TM_PHONE_SALE', 'TM_OFFLINE_SALE', 'TM_OFFLINE_ASSIST', 
    'TM_SITA_SATISFACTION', 'TM_RETURN', 'TM_RETURN_DEFENSE',
    'MGMT_HIRING', 'MGMT_FUNNEL', 'MGMT_AD_CONVERSION', 
    'MGMT_CONTENT_VIEWS', 'MGMT_AUTOMATION'
  ];
  
  let foundKpiTypes = 0;
  keyKpiTypes.forEach(kpiType => {
    if (optionTexts.some(text => text.includes(kpiType))) {
      foundKpiTypes++;
      console.log(`✅ ${kpiType} 발견`);
    } else {
      console.log(`❌ ${kpiType} 없음`);
    }
  });
  
  console.log(`\n총 ${foundKpiTypes}/${keyKpiTypes.length} 개의 KPI 업무 유형 발견`);
  expect(foundKpiTypes).toBe(keyKpiTypes.length);
  
  // 10. 음수 포인트 업무 유형 확인
  const negativePointTypes = optionTexts.filter(text => text.includes('-'));
  console.log('음수 포인트 업무 유형:', negativePointTypes);
  expect(negativePointTypes.length).toBeGreaterThan(0);
  
  // 11. 카테고리별 업무 유형 확인
  const categories = ['team_lead', 'team_member', 'management', 'sales', 'returns', 'defense'];
  categories.forEach(category => {
    const categoryTypes = optionTexts.filter(text => 
      text.toLowerCase().includes(category.replace('_', ''))
    );
    console.log(`${category} 카테고리: ${categoryTypes.length}개`);
  });
  
  // 12. 모달 닫기
  const closeButton = page.locator('button').filter({ hasText: '취소' });
  if (await closeButton.count() > 0) {
    await closeButton.first().click();
  }
  
  // 13. 통계 카드 확인
  const statsCards = page.locator('.bg-white.rounded-lg.shadow');
  await expect(statsCards).toHaveCount(4);
  
  const statsTexts = await statsCards.allTextContents();
  console.log('통계 카드 내용:', statsTexts);
  
  // 14. 테이블 헤더 확인
  const tableHeaders = page.locator('table thead th');
  await expect(tableHeaders).toHaveCount(4);
  
  const headerTexts = await tableHeaders.allTextContents();
  console.log('테이블 헤더:', headerTexts);
  
  console.log('✅ KPI 업무 유형 검증 완료!');
});
