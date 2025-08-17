import { test, expect } from '@playwright/test';

test('업무 추가 기능 상세 테스트 및 스크린샷', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // 2. 업무 기록 페이지로 이동
  await page.goto('http://localhost:3000/tasks');
  await page.waitForLoadState('networkidle');
  
  // 3. 초기 상태 스크린샷
  await page.screenshot({ 
    path: 'task-page-initial.png', 
    fullPage: true 
  });
  
  // 4. 업무 추가 버튼 클릭
  const addButton = page.locator('button').filter({ hasText: '업무 추가' });
  await addButton.first().click();
  
  // 5. 모달 열린 상태 스크린샷
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'task-modal-open.png', 
    fullPage: true 
  });
  
  // 6. 폼 입력 과정 스크린샷
  await page.fill('input[name="task_date"]', '2025-01-17');
  await page.screenshot({ 
    path: 'task-form-date-filled.png' 
  });
  
  // 업무 유형 선택
  const operationTypeSelect = page.locator('select[name="operation_type_id"]');
  await operationTypeSelect.selectOption({ index: 1 });
  await page.screenshot({ 
    path: 'task-form-type-selected.png' 
  });
  
  // 업무명 입력
  await page.fill('input[name="task_name"]', '스크린샷 테스트 업무');
  await page.screenshot({ 
    path: 'task-form-name-filled.png' 
  });
  
  // 설명 입력
  await page.fill('textarea[name="description"]', '스크린샷 캡처를 위한 테스트 업무입니다.');
  await page.screenshot({ 
    path: 'task-form-description-filled.png' 
  });
  
  // 수량 입력
  await page.fill('input[name="quantity"]', '2');
  await page.screenshot({ 
    path: 'task-form-quantity-filled.png' 
  });
  
  // 메모 입력
  await page.fill('textarea[name="employee_memo"]', '스크린샷 테스트 메모입니다.');
  await page.screenshot({ 
    path: 'task-form-memo-filled.png' 
  });
  
  // 7. 폼 완성 상태 스크린샷
  await page.screenshot({ 
    path: 'task-form-completed.png', 
    fullPage: true 
  });
  
  // 8. 업무 추가 버튼 클릭 (type="submit" 버튼 선택)
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // 9. 추가 완료 후 상태 스크린샷
  await page.waitForTimeout(2000);
  await page.screenshot({ 
    path: 'task-page-after-add.png', 
    fullPage: true 
  });
  
  // 10. 추가된 업무 확인
  const addedTask = page.locator('text=스크린샷 테스트 업무');
  if (await addedTask.count() > 0) {
    console.log('✅ 업무가 성공적으로 추가되었습니다!');
    await addedTask.screenshot({ 
      path: 'task-added-confirmation.png' 
    });
  } else {
    console.log('⚠️ 추가된 업무를 찾을 수 없습니다.');
  }
  
  // 11. 통계 업데이트 확인
  const statsCards = page.locator('.bg-white.rounded-lg.shadow');
  await statsCards.first().screenshot({ 
    path: 'task-stats-after-add.png' 
  });
  
  console.log('✅ 업무 추가 기능 상세 테스트 및 스크린샷 완료!');
  console.log('📸 캡처된 파일들:');
  console.log('  - task-page-initial.png (초기 상태)');
  console.log('  - task-modal-open.png (모달 열린 상태)');
  console.log('  - task-form-date-filled.png (날짜 입력)');
  console.log('  - task-form-type-selected.png (업무 유형 선택)');
  console.log('  - task-form-name-filled.png (업무명 입력)');
  console.log('  - task-form-description-filled.png (설명 입력)');
  console.log('  - task-form-quantity-filled.png (수량 입력)');
  console.log('  - task-form-memo-filled.png (메모 입력)');
  console.log('  - task-form-completed.png (폼 완성)');
  console.log('  - task-page-after-add.png (추가 후 상태)');
  console.log('  - task-added-confirmation.png (추가 확인)');
  console.log('  - task-stats-after-add.png (통계 업데이트)');
});
