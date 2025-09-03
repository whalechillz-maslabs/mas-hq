import { test, expect } from '@playwright/test';

test('로그인 폼 구조 상세 확인', async ({ page }) => {
  // 로그인 페이지로 이동
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'login-page.png', fullPage: true });
  
  // 모든 입력 필드 확인
  const allInputs = await page.locator('input').all();
  console.log('전체 입력 필드 개수:', allInputs.length);
  
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const name = await input.getAttribute('name');
    const id = await input.getAttribute('id');
    
    console.log(`입력 필드 ${i + 1}:`);
    console.log(`  - type: ${type}`);
    console.log(`  - placeholder: ${placeholder}`);
    console.log(`  - name: ${name}`);
    console.log(`  - id: ${id}`);
  }
  
  // 모든 버튼 확인
  const allButtons = await page.locator('button').all();
  console.log('전체 버튼 개수:', allButtons.length);
  
  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];
    const text = await button.textContent();
    const type = await button.getAttribute('type');
    
    console.log(`버튼 ${i + 1}:`);
    console.log(`  - text: ${text}`);
    console.log(`  - type: ${type}`);
  }
  
  // 폼 요소 확인
  const forms = await page.locator('form').all();
  console.log('폼 개수:', forms.length);
  
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    const action = await form.getAttribute('action');
    const method = await form.getAttribute('method');
    
    console.log(`폼 ${i + 1}:`);
    console.log(`  - action: ${action}`);
    console.log(`  - method: ${method}`);
  }
  
  // 페이지 전체 텍스트 확인
  const bodyText = await page.locator('body').textContent();
  console.log('페이지 전체 텍스트 (처음 1000자):', bodyText?.substring(0, 1000));
  
  // 로그인 관련 텍스트 확인
  const loginTexts = ['로그인', 'Login', '이메일', 'Email', '비밀번호', 'Password', '로그인하기', 'Sign In'];
  for (const text of loginTexts) {
    const count = await page.locator(`text=${text}`).count();
    console.log(`"${text}" 텍스트 개수:`, count);
  }
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  console.log('=== 로그인 폼 구조 확인 완료 ===');
});
