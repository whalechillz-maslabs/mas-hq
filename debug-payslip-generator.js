const { chromium } = require('playwright');

async function debugPayslipGenerator() {
    console.log('🔍 급여명세서 생성기 페이지 구조 확인');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 2000,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 로그인
        console.log('로그인...');
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');
        
        const phoneInput = page.locator('input[name="phone"]');
        const passwordInput = page.locator('input[name="password"]');
        const submitButton = page.locator('button[type="submit"]');
        
        await phoneInput.fill('010-6669-9000');
        await passwordInput.fill('66699000');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        
        // 급여명세서 생성기로 이동
        console.log('급여명세서 생성기로 이동...');
        await page.goto('http://localhost:3000/admin/payslip-generator');
        await page.waitForLoadState('networkidle');
        
        // 페이지 제목 확인
        const title = await page.title();
        console.log('페이지 제목:', title);
        
        // 모든 select 요소 확인
        const selects = await page.locator('select').all();
        console.log(`\nselect 요소 ${selects.length}개 발견:`);
        for (let i = 0; i < selects.length; i++) {
            const select = selects[i];
            const name = await select.getAttribute('name');
            const id = await select.getAttribute('id');
            const options = await select.locator('option').all();
            console.log(`  ${i + 1}. name="${name}", id="${id}", options=${options.length}개`);
            
            // 첫 번째 select의 옵션들 확인
            if (i === 0) {
                console.log('    옵션들:');
                for (let j = 0; j < Math.min(options.length, 5); j++) {
                    const option = options[j];
                    const value = await option.getAttribute('value');
                    const text = await option.textContent();
                    console.log(`      - value="${value}", text="${text?.trim()}"`);
                }
            }
        }
        
        // 모든 button 요소 확인
        const buttons = await page.locator('button').all();
        console.log(`\nbutton 요소 ${buttons.length}개 발견:`);
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = await button.textContent();
            const type = await button.getAttribute('type');
            console.log(`  ${i + 1}. type="${type}", text="${text?.trim()}"`);
        }
        
        // 5초 대기
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

debugPayslipGenerator();
