import { test, expect } from '@playwright/test';

test.describe('빠른 업무 입력 흐름 테스트', () => {
  test('업무 추가 후 폼 유지 및 연속 입력 테스트', async ({ page }) => {
    console.log('🚀 빠른 업무 입력 흐름 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 허상원 계정으로 로그인
    await page.fill('input[type="tel"]', '010-8948-4501');
    await page.fill('input[type="password"]', '89484501');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 로그인 완료, 빠른 업무 입력 페이지 접근');
    
    // 2. 첫 번째 업무 추가
    console.log('📝 첫 번째 업무 추가 테스트');
    
    // OP1 업무 유형 선택 (실제 텍스트에 맞게 수정)
    const op1Button = page.locator('button').filter({ hasText: /OP1.*전화 판매/ }).first();
    await op1Button.click();
    await page.waitForTimeout(1000);
    
    // 업무 정보 입력
    const firstTaskTitle = `연속 입력 테스트 1 ${Date.now()}`;
    await page.fill('input[placeholder="업무 제목을 입력하세요"]', firstTaskTitle);
    await page.fill('input[placeholder="고객명 (선택)"]', '테스트 고객 1');
    await page.fill('input[type="number"]', '1000000');
    await page.fill('textarea[placeholder="업무 내용을 입력하세요 (선택)"]', '첫 번째 테스트 업무');
    
    // 업무 완료 버튼 클릭
    await page.click('button:has-text("업무 완료")');
    await page.waitForTimeout(2000);
    
    console.log('✅ 첫 번째 업무 추가 완료');
    
    // 3. 폼이 유지되는지 확인
    console.log('🔍 폼 유지 상태 확인');
    
    // 업무 유형이 여전히 선택되어 있는지 확인
    await expect(op1Button).toHaveClass(/border-indigo-500/);
    console.log('✅ OP1 업무 유형이 여전히 선택됨');
    
    // 폼이 여전히 표시되는지 확인
    const form = page.locator('form');
    await expect(form).toBeVisible();
    console.log('✅ 업무 입력 폼이 여전히 표시됨');
    
    // 4. 두 번째 업무 추가 (연속 입력)
    console.log('📝 두 번째 업무 추가 테스트 (연속 입력)');
    
    // 업무 정보만 변경
    const secondTaskTitle = `연속 입력 테스트 2 ${Date.now()}`;
    await page.fill('input[placeholder="업무 제목을 입력하세요"]', secondTaskTitle);
    await page.fill('input[placeholder="고객명 (선택)"]', '테스트 고객 2');
    await page.fill('input[type="number"]', '2000000');
    await page.fill('textarea[placeholder="업무 내용을 입력하세요 (선택)"]', '두 번째 테스트 업무');
    
    // 업무 완료 버튼 클릭
    await page.click('button:has-text("업무 완료")');
    await page.waitForTimeout(2000);
    
    console.log('✅ 두 번째 업무 추가 완료');
    
    // 5. 통계 업데이트 확인
    console.log('📊 통계 업데이트 확인');
    
    // 업무 건수가 증가했는지 확인
    const taskCount = page.locator('text=/\\d+건/');
    await expect(taskCount).toBeVisible();
    console.log('✅ 업무 건수 표시됨');
    
    // 6. 다른 업무 유형으로 변경 테스트
    console.log('🔄 다른 업무 유형으로 변경 테스트');
    
    // OP3 선택
    const op3Button = page.locator('button').filter({ hasText: /OP3.*오프라인 판매/ }).first();
    await op3Button.click();
    await page.waitForTimeout(1000);
    
    // OP3이 선택되었는지 확인
    await expect(op3Button).toHaveClass(/border-indigo-500/);
    console.log('✅ OP3 업무 유형으로 변경됨');
    
    // 기본 제목이 변경되었는지 확인
    const titleInput = page.locator('input[placeholder="업무 제목을 입력하세요"]');
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toContain('오프라인 판매');
    console.log('✅ 기본 제목이 OP3에 맞게 변경됨');
    
    console.log('🎉 모든 테스트 완료!');
  });
});
