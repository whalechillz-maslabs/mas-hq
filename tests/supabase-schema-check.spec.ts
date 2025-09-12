import { test, expect } from '@playwright/test';

test('슈파베이스 hourly_wages 테이블 스키마 확인', async ({ page }) => {
  console.log('🔍 슈파베이스 hourly_wages 테이블 스키마 확인 시작');
  
  // 슈파베이스 대시보드로 이동
  await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/editor/43617');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  console.log('✅ 슈파베이스 대시보드 접근 완료');
  
  // hourly_wages 테이블 클릭
  await page.click('text=hourly_wages');
  await page.waitForTimeout(2000);
  
  console.log('✅ hourly_wages 테이블 선택 완료');
  
  // Definition 탭 클릭하여 스키마 확인
  await page.click('button:has-text("Definition")');
  await page.waitForTimeout(2000);
  
  console.log('✅ Definition 탭 클릭 완료');
  
  // 테이블 스키마 정보 수집
  const schemaInfo = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tr');
    const columns = [];
    
    for (let i = 1; i < rows.length; i++) { // 헤더 제외
      const cells = rows[i].querySelectorAll('td');
      if (cells.length >= 4) {
        columns.push({
          name: cells[0]?.textContent?.trim(),
          type: cells[1]?.textContent?.trim(),
          nullable: cells[2]?.textContent?.trim(),
          default: cells[3]?.textContent?.trim()
        });
      }
    }
    
    return columns;
  });
  
  console.log('📊 hourly_wages 테이블 스키마:');
  schemaInfo.forEach((col, index) => {
    console.log(`  ${index + 1}. ${col.name} (${col.type}) - nullable: ${col.nullable}, default: ${col.default}`);
  });
  
  // Data 탭으로 이동하여 기존 데이터 확인
  await page.click('button:has-text("Data")');
  await page.waitForTimeout(2000);
  
  console.log('✅ Data 탭으로 이동 완료');
  
  // 기존 데이터 확인
  const existingData = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const data = [];
    
    for (let i = 0; i < Math.min(rows.length, 5); i++) { // 최대 5개 행만
      const cells = rows[i].querySelectorAll('td');
      if (cells.length > 0) {
        const rowData = Array.from(cells).map(cell => cell.textContent?.trim());
        data.push(rowData);
      }
    }
    
    return data;
  });
  
  console.log('📋 기존 hourly_wages 데이터 (최대 5개):');
  existingData.forEach((row, index) => {
    console.log(`  행 ${index + 1}:`, row);
  });
  
  // Insert 버튼 클릭하여 새 데이터 추가 테스트
  await page.click('button:has-text("Insert")');
  await page.waitForTimeout(2000);
  
  console.log('✅ Insert 버튼 클릭 완료');
  
  // 입력 폼 필드들 확인
  const formFields = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, select, textarea');
    const fields = [];
    
    inputs.forEach((input, index) => {
      const label = input.closest('tr')?.querySelector('td:first-child')?.textContent?.trim();
      const type = input.tagName.toLowerCase();
      const name = input.getAttribute('name') || input.getAttribute('id') || `field_${index}`;
      const required = input.hasAttribute('required');
      
      fields.push({
        label,
        name,
        type,
        required
      });
    });
    
    return fields;
  });
  
  console.log('📝 Insert 폼 필드들:');
  formFields.forEach((field, index) => {
    console.log(`  ${index + 1}. ${field.label || field.name} (${field.type}) - required: ${field.required}`);
  });
  
  // 테스트 데이터 입력 시도
  try {
    // employee_id 필드 찾기 및 입력
    const employeeIdField = page.locator('input[name="employee_id"], select[name="employee_id"]').first();
    if (await employeeIdField.count() > 0) {
      await employeeIdField.fill('허상원 UUID'); // 실제 UUID로 교체 필요
      console.log('✅ employee_id 필드 입력 시도');
    }
    
    // base_wage 필드 찾기 및 입력
    const baseWageField = page.locator('input[name="base_wage"]').first();
    if (await baseWageField.count() > 0) {
      await baseWageField.fill('13000');
      console.log('✅ base_wage 필드 입력 시도');
    }
    
    // effective_date 필드 찾기 및 입력
    const effectiveDateField = page.locator('input[name="effective_date"]').first();
    if (await effectiveDateField.count() > 0) {
      await effectiveDateField.fill('2025-01-30');
      console.log('✅ effective_date 필드 입력 시도');
    }
    
    // Save 버튼 클릭
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Insert")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Save 버튼 클릭 시도');
    }
    
  } catch (error) {
    console.log('⚠️ 테스트 데이터 입력 중 에러:', error);
  }
  
  // 에러 메시지 확인
  const errorMessages = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('.error, .alert-error, [class*="error"]');
    return Array.from(errorElements).map(el => el.textContent?.trim()).filter(text => text);
  });
  
  if (errorMessages.length > 0) {
    console.log('❌ 발견된 에러 메시지들:');
    errorMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
  } else {
    console.log('✅ 에러 메시지 없음');
  }
  
  console.log('🔍 슈파베이스 스키마 확인 완료');
});
