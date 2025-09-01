import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 디버그 테스트', () => {
  test('페이지 구조 확인', async ({ page }) => {
    console.log('🚀 출근 관리 페이지 디버그 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 김탁수 계정으로 로그인 (관리자)
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    console.log('✅ 출근 관리 페이지 접근');
    
    // 3. 페이지 전체 HTML 구조 확인
    const pageContent = await page.content();
    console.log('📄 페이지 HTML 길이:', pageContent.length);
    
    // 4. 모든 input 요소 찾기
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    console.log(`📝 총 input 요소 수: ${inputCount}`);
    
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input ${i}: type=${type}, placeholder=${placeholder}`);
    }
    
    // 5. 모든 select 요소 찾기
    const allSelects = page.locator('select');
    const selectCount = await allSelects.count();
    console.log(`📋 총 select 요소 수: ${selectCount}`);
    
    // 6. 페이지 제목 확인
    const pageTitle = page.locator('h1');
    const titleText = await pageTitle.textContent();
    console.log('📌 페이지 제목:', titleText);
    
    // 7. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-debug-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('�� 디버그 테스트 완료!');
  });
});
