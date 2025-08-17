import { test, expect } from '@playwright/test';

test.describe('업무 추가 기능 최종 테스트', () => {
  test('업무 추가 기능 완전 테스트', async ({ page }) => {
    // 1. 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 2. 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    
    // 3. 페이지 기본 요소 확인
    await expect(page.locator('h1')).toContainText('업무 기록');
    
    // 4. 업무 추가 버튼 클릭
    const addButton = page.locator('button').filter({ hasText: '업무 추가' });
    await expect(addButton.first()).toBeVisible();
    await addButton.first().click();
    
    // 5. 모달 확인
    await expect(page.locator('h3:has-text("업무 추가")')).toBeVisible();
    
    // 6. 업무 정보 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    
    // 업무 유형 선택
    const operationTypeSelect = page.locator('select[name="operation_type_id"]');
    await operationTypeSelect.selectOption({ index: 1 });
    
    await page.fill('input[name="task_name"]', 'Playwright 테스트 업무');
    await page.fill('textarea[name="description"]', '자동화 테스트를 위한 업무입니다.');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', '테스트 메모입니다.');
    
    // 7. 업무 추가 버튼 클릭
    const submitButton = page.locator('button').filter({ hasText: '추가' });
    await submitButton.click();
    
    // 8. 성공 확인
    await page.waitForTimeout(2000);
    
    // 모달이 닫혔는지 확인
    await expect(page.locator('h3:has-text("업무 추가")')).not.toBeVisible();
    
    // 9. 추가된 업무가 목록에 나타나는지 확인
    await expect(page.locator('text=Playwright 테스트 업무')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 업무 추가 기능 테스트 성공!');
  });
  
  test('업무 통계 확인', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 통계 카드 확인
    await expect(page.locator('text=총 업무')).toBeVisible();
    await expect(page.locator('text=완료 업무')).toBeVisible();
    await expect(page.locator('text=획득 포인트')).toBeVisible();
    await expect(page.locator('text=대기 중')).toBeVisible();
    
    // 테이블 헤더 확인
    await expect(page.locator('th:has-text("날짜")')).toBeVisible();
    await expect(page.locator('th:has-text("업무 유형")')).toBeVisible();
    await expect(page.locator('th:has-text("업무명")')).toBeVisible();
    await expect(page.locator('th:has-text("상태")')).toBeVisible();
    
    console.log('✅ 업무 통계 및 테이블 구조 확인 성공!');
  });
});
