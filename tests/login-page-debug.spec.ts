import { test, expect } from '@playwright/test';

test.describe('로그인 페이지 디버깅', () => {
  test('로그인 페이지 구조 확인', async ({ page }) => {
    console.log('🚀 로그인 페이지 디버깅 시작');

    // 1. 로그인 페이지로 직접 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 페이지 로드 완료');

    // 2. 페이지 스크린샷
    await page.screenshot({ path: 'login-debug.png' });
    console.log('✅ 로그인 페이지 스크린샷 저장됨');

    // 3. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 4. 모든 input 요소 확인
    const inputs = await page.locator('input').all();
    console.log(`📝 발견된 input 요소 수: ${inputs.length}`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      console.log(`  Input ${i + 1}: placeholder="${placeholder}", type="${type}", name="${name}"`);
    }

    // 5. 모든 button 요소 확인
    const buttons = await page.locator('button').all();
    console.log(`🔘 발견된 button 요소 수: ${buttons.length}`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`  Button ${i + 1}: text="${text?.trim()}", type="${type}"`);
    }

    // 6. 전화번호 입력 필드 찾기 시도
    console.log('🔍 전화번호 입력 필드 찾기 시도...');
    
    // 다양한 선택자로 시도
    const selectors = [
      'input[placeholder="전화번호를 입력하세요"]',
      'input[placeholder*="전화번호"]',
      'input[placeholder*="phone"]',
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[name*="tel"]'
    ];

    for (const selector of selectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ 발견: ${selector}`);
        break;
      } else {
        console.log(`❌ 없음: ${selector}`);
      }
    }

    // 7. PIN 입력 필드 찾기 시도
    console.log('🔍 PIN 입력 필드 찾기 시도...');
    
    const pinSelectors = [
      'input[placeholder="PIN을 입력하세요"]',
      'input[placeholder*="PIN"]',
      'input[placeholder*="pin"]',
      'input[type="password"]',
      'input[name*="pin"]',
      'input[name*="password"]'
    ];

    for (const selector of pinSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ 발견: ${selector}`);
        break;
      } else {
        console.log(`❌ 없음: ${selector}`);
      }
    }

    // 8. 로그인 버튼 찾기 시도
    console.log('🔍 로그인 버튼 찾기 시도...');
    
    const loginButtonSelectors = [
      'button:has-text("로그인")',
      'button:has-text("Login")',
      'input[type="submit"]',
      'button[type="submit"]'
    ];

    for (const selector of loginButtonSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ 발견: ${selector}`);
        break;
      } else {
        console.log(`❌ 없음: ${selector}`);
      }
    }

    // 9. 페이지 HTML 구조 확인
    console.log('🔍 페이지 HTML 구조 확인...');
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📄 Body HTML 길이:', bodyHTML.length);
    
    // 로그인 관련 텍스트가 있는지 확인
    if (bodyHTML.includes('전화번호')) {
      console.log('✅ "전화번호" 텍스트 발견');
    } else {
      console.log('❌ "전화번호" 텍스트 없음');
    }
    
    if (bodyHTML.includes('PIN')) {
      console.log('✅ "PIN" 텍스트 발견');
    } else {
      console.log('❌ "PIN" 텍스트 없음');
    }
    
    if (bodyHTML.includes('로그인')) {
      console.log('✅ "로그인" 텍스트 발견');
    } else {
      console.log('❌ "로그인" 텍스트 없음');
    }

    console.log('🎉 로그인 페이지 디버깅 완료');
  });
});
