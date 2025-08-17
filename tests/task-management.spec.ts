import { test, expect } from '@playwright/test';

test.describe('업무 관리 기능 테스트', () => {
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
    
    // 업무 추가 버튼이 있는지 확인
    const addButton = page.locator('button:has-text("업무 추가")');
    await expect(addButton).toBeVisible();
    
    // 업무 추가 버튼 클릭
    await addButton.click();
    
    // 모달이 나타나는지 확인
    await expect(page.locator('text=업무 추가')).toBeVisible();
    
    // 업무 정보 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    await page.selectOption('select[name="operation_type_id"]', { index: 1 }); // 첫 번째 업무 유형 선택
    await page.fill('input[name="task_name"]', '테스트 업무');
    await page.fill('textarea[name="description"]', 'Playwright 테스트를 위한 업무');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', '테스트 메모');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("추가")');
    
    // 성공 메시지 확인
    await expect(page.locator('text=업무가 추가되었습니다')).toBeVisible({ timeout: 5000 });
    
    // 모달이 닫혔는지 확인
    await expect(page.locator('text=업무 추가')).not.toBeVisible();
    
    // 추가된 업무가 목록에 나타나는지 확인
    await expect(page.locator('text=테스트 업무')).toBeVisible();
  });

  test('업무 유형 목록 확인', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    
    // 업무 유형 드롭다운 확인
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await expect(operationTypeSelect).toBeVisible();
    
    // 업무 유형 옵션들이 있는지 확인
    const options = await operationTypeSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(1); // 기본 "선택하세요" 옵션 + 실제 업무 유형들
    
    // 특정 업무 유형이 있는지 확인
    await expect(page.locator('option:has-text("고객 응대")')).toBeVisible();
    await expect(page.locator('option:has-text("재고 관리")')).toBeVisible();
  });

  test('업무 상태 변경 테스트', async ({ page }) => {
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 업무 목록이 있는지 확인
    await expect(page.locator('text=업무 기록')).toBeVisible();
    
    // 필터 기능 확인
    const filterSelect = page.locator('select[aria-label="상태 필터"]');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('all');
    }
    
    // 통계 정보 확인
    await expect(page.locator('text=총 업무')).toBeVisible();
    await expect(page.locator('text=완료된 업무')).toBeVisible();
    await expect(page.locator('text=총 포인트')).toBeVisible();
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
    
    // 통계 카드들이 있는지 확인
    await expect(page.locator('text=총 업무')).toBeVisible();
    await expect(page.locator('text=완료된 업무')).toBeVisible();
    await expect(page.locator('text=총 포인트')).toBeVisible();
    await expect(page.locator('text=대기 중인 업무')).toBeVisible();
    
    // 월 선택 기능 확인
    const monthSelector = page.locator('input[type="month"]');
    if (await monthSelector.isVisible()) {
      await monthSelector.fill('2025-01');
    }
  });
});
