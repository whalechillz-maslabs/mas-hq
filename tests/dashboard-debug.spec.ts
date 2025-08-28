import { test, expect } from '@playwright/test';

test.describe('대시보드 페이지 디버깅', () => {
  test('대시보드 페이지 구조 확인', async ({ page }) => {
    console.log('🚀 대시보드 페이지 디버깅 시작');

    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-8948-4501');
    await page.fill('input[type="password"]', '89484501');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ 로그인 성공');

    // 2. 대시보드 페이지 스크린샷
    await page.screenshot({ path: 'dashboard-debug.png' });
    console.log('✅ 대시보드 페이지 스크린샷 저장됨');

    // 3. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 4. 모든 링크 확인
    const links = await page.locator('a').all();
    console.log(`🔗 발견된 링크 수: ${links.length}`);
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`  Link ${i + 1}: href="${href}", text="${text?.trim()}"`);
    }

    // 5. 업무 기록 관련 링크 찾기
    console.log('🔍 업무 기록 관련 링크 찾기...');
    
    const taskLinks = [
      'a[href="/tasks"]',
      'a[href*="task"]',
      'a:has-text("업무")',
      'a:has-text("기록")',
      'a:has-text("Task")'
    ];

    for (const selector of taskLinks) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ 발견: ${selector}`);
        const text = await element.textContent();
        console.log(`  텍스트: "${text?.trim()}"`);
      } else {
        console.log(`❌ 없음: ${selector}`);
      }
    }

    // 6. 네비게이션 메뉴 확인
    console.log('🔍 네비게이션 메뉴 확인...');
    
    const navSelectors = [
      'nav',
      'header',
      '.navbar',
      '.navigation',
      '[role="navigation"]'
    ];

    for (const selector of navSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ 발견: ${selector}`);
        const text = await element.textContent();
        console.log(`  내용: "${text?.trim().substring(0, 100)}..."`);
      } else {
        console.log(`❌ 없음: ${selector}`);
      }
    }

    // 7. 페이지 HTML 구조 확인
    console.log('🔍 페이지 HTML 구조 확인...');
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📄 Body HTML 길이:', bodyHTML.length);
    
    // 업무 관련 텍스트가 있는지 확인
    if (bodyHTML.includes('업무')) {
      console.log('✅ "업무" 텍스트 발견');
    } else {
      console.log('❌ "업무" 텍스트 없음');
    }
    
    if (bodyHTML.includes('기록')) {
      console.log('✅ "기록" 텍스트 발견');
    } else {
      console.log('❌ "기록" 텍스트 없음');
    }
    
    if (bodyHTML.includes('tasks')) {
      console.log('✅ "tasks" 텍스트 발견');
    } else {
      console.log('❌ "tasks" 텍스트 없음');
    }

    console.log('🎉 대시보드 페이지 디버깅 완료');
  });
});
