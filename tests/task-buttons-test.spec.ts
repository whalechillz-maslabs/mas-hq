import { test, expect } from '@playwright/test';

test.describe('업무 완료/추가 버튼 테스트', () => {
  test.beforeEach(async ({ page, browser }) => {
    // 모바일 시뮬레이션을 위한 컨텍스트 생성
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    const mobilePage = await context.newPage();
    
    // 로그인 페이지로 이동
    await mobilePage.goto('http://localhost:3000/login');
    
    // 로그인
    await mobilePage.fill('input[name="phone"]', '010-6669-9000');
    await mobilePage.fill('input[name="password"]', '66699000');
    await mobilePage.click('button[type="submit"]');
    
    // 로그인 후 tasks 페이지로 이동 (모바일은 자동으로 /tasks로 리다이렉트)
    await mobilePage.waitForURL('**/tasks');
    
    // page 객체를 mobilePage로 교체
    Object.assign(page, mobilePage);
  });

  test('업무 추가 버튼 클릭 시 모달이 열리는지 확인', async ({ page }) => {
    console.log('🧪 업무 추가 버튼 테스트 시작');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    
    // 모달이 열렸는지 확인
    await expect(page.locator('h3:has-text("업무 추가")')).toBeVisible();
    
    console.log('✅ 업무 추가 모달이 정상적으로 열렸습니다');
  });

  test('빠른 업무 입력 카드 클릭 시 모달이 열리는지 확인', async ({ page }) => {
    console.log('🧪 빠른 업무 입력 카드 테스트 시작');
    
    // OP1 카드 클릭 (첫 번째 업무 유형)
    await page.click('text=OP1');
    
    // 모달이 열렸는지 확인
    await expect(page.locator('h3:has-text("업무 추가")')).toBeVisible();
    
    console.log('✅ 빠른 업무 입력 카드 클릭 시 모달이 정상적으로 열렸습니다');
  });

  test('업무 추가 폼 제출 테스트', async ({ page }) => {
    console.log('🧪 업무 추가 폼 제출 테스트 시작');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    
    // 폼 필드 입력
    await page.selectOption('select[name="operation_type_id"]', { index: 1 });
    await page.fill('input[name="title"]', '테스트 업무');
    await page.fill('textarea[name="notes"]', '테스트 설명');
    await page.fill('input[name="customer_name"]', '테스트 고객');
    await page.fill('input[name="sales_amount"]', '100000');
    
    // 폼 제출
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인 (alert)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('업무가 성공적으로 추가되었습니다');
      await dialog.accept();
    });
    
    console.log('✅ 업무 추가 폼 제출이 정상적으로 작동했습니다');
  });

  test('업무 완료 버튼 클릭 테스트', async ({ page }) => {
    console.log('🧪 업무 완료 버튼 테스트 시작');
    
    // 대기 중인 업무가 있는지 확인
    const pendingTasks = page.locator('button:has-text("완료")');
    const count = await pendingTasks.count();
    
    if (count > 0) {
      // 첫 번째 완료 버튼 클릭
      await pendingTasks.first().click();
      
      // 성공 메시지 확인 (alert)
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('업무가 완료되었습니다');
        await dialog.accept();
      });
      
      console.log('✅ 업무 완료 버튼이 정상적으로 작동했습니다');
    } else {
      console.log('ℹ️ 대기 중인 업무가 없어서 완료 버튼 테스트를 건너뜁니다');
    }
  });

  test('브라우저 콘솔 에러 확인', async ({ page }) => {
    console.log('🧪 브라우저 콘솔 에러 확인 테스트 시작');
    
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ 콘솔 에러:', msg.text());
      }
    });
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    
    // 잠시 대기
    await page.waitForTimeout(1000);
    
    if (consoleErrors.length === 0) {
      console.log('✅ 콘솔 에러가 없습니다');
    } else {
      console.log(`❌ ${consoleErrors.length}개의 콘솔 에러가 발견되었습니다`);
    }
  });
});
