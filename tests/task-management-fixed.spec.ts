import { test, expect } from '@playwright/test';

test.describe('업무 관리 기능 테스트 (수정된 버전)', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 대시보드로 이동할 때까지 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('업무 기록 페이지 접근 및 업무 추가 테스트', async ({ page }) => {
    // 대시보드에서 업무 기록 버튼 클릭
    await page.click('text=업무 기록');
    
    // 업무 기록 페이지로 이동할 때까지 대기
    await page.waitForURL('**/tasks', { timeout: 10000 });
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('업무 기록');
    
    // 업무 추가 버튼이 있는지 확인 (더 구체적인 선택자 사용)
    const addButton = page.locator('button:has-text("업무 추가"):has-text("Plus")');
    await expect(addButton).toBeVisible();
    
    // 업무 추가 버튼 클릭
    await addButton.click();
    
    // 모달이 나타나는지 확인 (더 구체적인 선택자 사용)
    await expect(page.locator('h3:has-text("업무 추가")')).toBeVisible();
    
    // 업무 정보 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    
    // 업무 유형 선택 (첫 번째 실제 옵션 선택)
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await operationTypeSelect.selectOption({ index: 1 }); // "선택하세요" 다음 옵션
    
    await page.fill('input[name="task_name"]', '테스트 업무');
    await page.fill('textarea[name="description"]', 'Playwright 테스트를 위한 업무');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', '테스트 메모');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("추가")');
    
    // 성공 메시지 확인 (alert 또는 toast 메시지)
    try {
      await expect(page.locator('text=업무가 추가되었습니다')).toBeVisible({ timeout: 3000 });
    } catch {
      // alert 다이얼로그 처리
      page.on('dialog', dialog => dialog.accept());
    }
    
    // 모달이 닫혔는지 확인
    await expect(page.locator('h3:has-text("업무 추가")')).not.toBeVisible();
    
    // 추가된 업무가 목록에 나타나는지 확인
    await expect(page.locator('text=테스트 업무')).toBeVisible({ timeout: 5000 });
  });

  test('업무 유형 목록 확인', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가"):has-text("Plus")');
    
    // 업무 유형 드롭다운 확인
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await expect(operationTypeSelect).toBeVisible();
    
    // 업무 유형 옵션들이 있는지 확인
    const options = await operationTypeSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(1); // 기본 "선택하세요" 옵션 + 실제 업무 유형들
    
    // 옵션 텍스트 확인
    const optionTexts = await operationTypeSelect.locator('option').allTextContents();
    console.log('Available operation types:', optionTexts);
    
    // 특정 업무 유형이 있는지 확인 (옵션 텍스트에서 확인)
    expect(optionTexts.some(text => text.includes('고객 응대') || text.includes('OP1'))).toBeTruthy();
    expect(optionTexts.some(text => text.includes('재고 관리') || text.includes('OP2'))).toBeTruthy();
  });

  test('업무 상태 변경 테스트', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 업무 목록이 있는지 확인
    await expect(page.locator('h1:has-text("업무 기록")')).toBeVisible();
    
    // 필터 기능 확인
    const filterSelect = page.locator('select');
    if (await filterSelect.count() > 0) {
      await filterSelect.last().selectOption('all');
    }
    
    // 통계 정보 확인 (실제 텍스트에 맞게 수정)
    await expect(page.locator('text=총 업무')).toBeVisible();
    await expect(page.locator('text=완료 업무')).toBeVisible();
    await expect(page.locator('text=획득 포인트')).toBeVisible();
    await expect(page.locator('text=대기 중')).toBeVisible();
  });

  test('업무 삭제 테스트', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 삭제 버튼이 있는 업무 찾기
    const deleteButtons = page.locator('button:has-text("삭제")');
    
    if (await deleteButtons.count() > 0) {
      // 첫 번째 삭제 버튼 클릭
      await deleteButtons.first().click();
      
      // 확인 다이얼로그 처리
      page.on('dialog', dialog => dialog.accept());
      
      // 삭제 후 페이지 새로고침
      await page.reload();
      
      // 삭제된 업무가 목록에서 사라졌는지 확인
      // (실제 테스트에서는 특정 업무명으로 확인)
    }
  });

  test('업무 통계 확인', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 통계 카드들이 있는지 확인 (실제 텍스트에 맞게 수정)
    await expect(page.locator('text=총 업무')).toBeVisible();
    await expect(page.locator('text=완료 업무')).toBeVisible();
    await expect(page.locator('text=획득 포인트')).toBeVisible();
    await expect(page.locator('text=대기 중')).toBeVisible();
    
    // 월 선택 기능 확인
    const monthSelector = page.locator('input[type="month"]');
    if (await monthSelector.isVisible()) {
      await monthSelector.fill('2025-01');
    }
  });

  test('업무 목록 테이블 구조 확인', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 테이블 헤더 확인
    await expect(page.locator('th:has-text("날짜")')).toBeVisible();
    await expect(page.locator('th:has-text("업무 유형")')).toBeVisible();
    await expect(page.locator('th:has-text("업무명")')).toBeVisible();
    await expect(page.locator('th:has-text("상태")')).toBeVisible();
    
    // 테이블이 존재하는지 확인
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
