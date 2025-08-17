import { test, expect } from '@playwright/test';

test('KPI 업무 유형 확인 테스트', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // 2. 업무 기록 페이지로 이동
  await page.goto('http://localhost:3000/tasks');
  await page.waitForLoadState('networkidle');
  
  // 3. 업무 추가 버튼 클릭
  const addButton = page.locator('button').filter({ hasText: '업무 추가' });
  await addButton.first().click();
  
  // 4. 업무 유형 드롭다운 확인
  const operationTypeSelect = page.locator('select[name="operation_type_id"]');
  await expect(operationTypeSelect).toBeVisible();
  
  // 5. 업무 유형 옵션들 확인
  const options = await operationTypeSelect.locator('option').all();
  console.log('총 업무 유형 개수:', options.length);
  
  // 6. 옵션 텍스트 확인
  const optionTexts = await operationTypeSelect.locator('option').allTextContents();
  console.log('업무 유형 목록:');
  optionTexts.forEach((text, index) => {
    if (text && text !== '선택하세요') {
      console.log(`  ${index}: ${text}`);
    }
  });
  
  // 7. KPI 업무 유형이 있는지 확인
  const kpiTypes = [
    'TL_SALES', 'TL_YOY', 'TL_SCHEDULE', 'TL_CS', 'TL_TRAINING',
    'TM_PHONE_SALE', 'TM_OFFLINE_SALE', 'TM_OFFLINE_ASSIST', 
    'TM_SITA_SATISFACTION', 'TM_RETURN', 'TM_RETURN_DEFENSE',
    'MGMT_HIRING', 'MGMT_FUNNEL', 'MGMT_AD_CONVERSION', 
    'MGMT_CONTENT_VIEWS', 'MGMT_AUTOMATION'
  ];
  
  let foundKpiTypes = 0;
  kpiTypes.forEach(kpiType => {
    if (optionTexts.some(text => text.includes(kpiType))) {
      foundKpiTypes++;
      console.log(`✅ ${kpiType} 발견`);
    } else {
      console.log(`❌ ${kpiType} 없음`);
    }
  });
  
  console.log(`\n총 ${foundKpiTypes}/${kpiTypes.length} 개의 KPI 업무 유형 발견`);
  
  // 8. 스크린샷 캡처
  await page.screenshot({ 
    path: 'kpi-operation-types-check.png', 
    fullPage: true 
  });
  
  // 9. 모달 닫기
  const closeButton = page.locator('button').filter({ hasText: '취소' });
  if (await closeButton.count() > 0) {
    await closeButton.first().click();
  }
  
  // 10. 결과 요약
  if (foundKpiTypes >= kpiTypes.length * 0.8) {
    console.log('✅ KPI 업무 유형이 성공적으로 업데이트되었습니다!');
  } else {
    console.log('⚠️ KPI 업무 유형 업데이트가 완료되지 않았습니다.');
  }
});
