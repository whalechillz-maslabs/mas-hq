import { test, expect } from '@playwright/test';

test.describe('로그인 페이지 구조 확인 테스트', () => {
  test('로그인 페이지 요소 확인', async ({ page }) => {
    console.log('🚀 로그인 페이지 구조 확인 테스트 시작');
    
    // 1. 로그인 페이지 접근
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 2. 페이지 제목 확인
    const pageTitle = await page.title();
    console.log('📌 페이지 제목:', pageTitle);
    
    // 3. 모든 입력 필드 찾기
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    console.log('📝 총 입력 필드 수:', inputCount);
    
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const className = await input.getAttribute('class');
      
      console.log(`📝 입력 필드 ${i + 1}:`, {
        type,
        placeholder,
        name,
        id,
        class: className
      });
    }
    
    // 4. 모든 버튼 찾기
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log('🔘 총 버튼 수:', buttonCount);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      const className = await button.getAttribute('class');
      
      console.log(`🔘 버튼 ${i + 1}:`, {
        text: text?.trim(),
        type,
        class: className
      });
    }
    
    // 5. 페이지 HTML 구조 확인
    const bodyText = await page.locator('body').textContent();
    console.log('📄 페이지 본문 길이:', bodyText?.length || 0);
    
    // 6. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/login-page-structure.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 로그인 페이지 구조 확인 테스트 완료!');
  });
});
