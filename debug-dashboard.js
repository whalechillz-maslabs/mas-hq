const { chromium } = require('playwright');

async function debugDashboard() {
    console.log('🔍 대시보드 페이지 구조 확인');
    
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
        
        // 대시보드 페이지 확인
        console.log('대시보드 페이지 확인...');
        await page.waitForTimeout(3000);
        
        // 페이지 제목 확인
        const title = await page.title();
        console.log('페이지 제목:', title);
        
        // URL 확인
        const url = page.url();
        console.log('현재 URL:', url);
        
        // 모든 h3 요소 확인
        const h3Elements = await page.locator('h3').all();
        console.log(`\nh3 요소 ${h3Elements.length}개 발견:`);
        for (let i = 0; i < h3Elements.length; i++) {
            const h3 = h3Elements[i];
            const text = await h3.textContent();
            console.log(`  ${i + 1}. "${text?.trim()}"`);
        }
        
        // 관리자 관련 텍스트 검색
        const adminTexts = await page.locator('text=관리자').all();
        console.log(`\n관리자 관련 텍스트 ${adminTexts.length}개 발견:`);
        for (let i = 0; i < adminTexts.length; i++) {
            const text = await adminTexts[i];
            const content = await text.textContent();
            console.log(`  ${i + 1}. "${content?.trim()}"`);
        }
        
        // 급여명세서 관련 텍스트 검색
        const payslipTexts = await page.locator('text=급여').all();
        console.log(`\n급여 관련 텍스트 ${payslipTexts.length}개 발견:`);
        for (let i = 0; i < payslipTexts.length; i++) {
            const text = await payslipTexts[i];
            const content = await text.textContent();
            console.log(`  ${i + 1}. "${content?.trim()}"`);
        }
        
        // 5초 대기
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

debugDashboard();
