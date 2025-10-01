const { chromium } = require('playwright');

async function debugLoginPage() {
    console.log('🔍 로그인 페이지 구조 확인');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 2000,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 로그인 페이지로 이동
        console.log('로그인 페이지로 이동...');
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');
        
        // 페이지 제목 확인
        const title = await page.title();
        console.log('페이지 제목:', title);
        
        // 모든 input 요소 확인
        const inputs = await page.locator('input').all();
        console.log(`\n입력 필드 ${inputs.length}개 발견:`);
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const type = await input.getAttribute('type');
            const name = await input.getAttribute('name');
            const placeholder = await input.getAttribute('placeholder');
            const id = await input.getAttribute('id');
            console.log(`  ${i + 1}. type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`);
        }
        
        // 모든 button 요소 확인
        const buttons = await page.locator('button').all();
        console.log(`\n버튼 ${buttons.length}개 발견:`);
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const type = await button.getAttribute('type');
            const text = await button.textContent();
            console.log(`  ${i + 1}. type="${type}", text="${text?.trim()}"`);
        }
        
        // 페이지 HTML 일부 확인
        const bodyHTML = await page.locator('body').innerHTML();
        console.log('\n페이지 HTML (처음 1000자):');
        console.log(bodyHTML.substring(0, 1000));
        
        // 5초 대기
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

debugLoginPage();
