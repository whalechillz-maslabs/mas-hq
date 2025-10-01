const { chromium } = require('playwright');

async function debugPayslipGeneration() {
    console.log('🔍 급여명세서 생성 디버깅');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 2000,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 확인 대화상자 자동 처리
    page.on('dialog', async dialog => {
        console.log(`대화상자: ${dialog.message()}`);
        await dialog.accept(); // 확인 버튼 클릭
    });
    
    // 콘솔 로그 캐치
    page.on('console', msg => {
        console.log('브라우저 콘솔:', msg.text());
    });
    
    // 네트워크 요청 캐치
    page.on('response', response => {
        if (response.url().includes('payslip') || response.url().includes('supabase')) {
            console.log(`네트워크 응답: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        // 1. 로그인
        console.log('1. 로그인...');
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="phone"]', '010-6669-9000');
        await page.fill('input[name="password"]', '66699000');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // 2. 급여명세서 생성기로 이동
        console.log('2. 급여명세서 생성기로 이동...');
        await page.goto('http://localhost:3000/admin/payslip-generator');
        await page.waitForLoadState('networkidle');
        
        // 3. 최형호 선택
        console.log('3. 최형호 선택...');
        await page.selectOption('select', { value: 'e998a540-51bf-4380-bcb1-86fb36ec7eb8' });
        await page.waitForTimeout(3000);
        
        // 4. 년도와 월 선택
        console.log('4. 년도와 월 선택...');
        await page.evaluate(() => {
            const yearSelect = document.querySelectorAll('select')[1];
            if (yearSelect) {
                yearSelect.value = '2025';
                yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const monthSelect = document.querySelectorAll('select')[2];
            if (monthSelect) {
                monthSelect.value = '8';
                monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        await page.waitForTimeout(3000);
        
        // 5. 급여명세서 생성 버튼 클릭
        console.log('5. 급여명세서 생성 버튼 클릭...');
        const generateButton = page.locator('button:has-text("2025년 8월 급여 명세서 생성")');
        await generateButton.click();
        
        // 6. 생성 완료까지 대기
        console.log('6. 생성 완료까지 대기...');
        await page.waitForTimeout(10000);
        
        // 7. 현재 URL 확인
        const currentUrl = page.url();
        console.log(`현재 URL: ${currentUrl}`);
        
        // 8. 페이지 제목 확인
        const title = await page.title();
        console.log(`페이지 제목: ${title}`);
        
        // 9. 에러 메시지 확인
        const errorMessages = await page.locator('text=/오류|에러|실패|error/i').all();
        if (errorMessages.length > 0) {
            console.log('에러 메시지 발견:');
            for (const error of errorMessages) {
                const text = await error.textContent();
                console.log(`  - ${text}`);
            }
        }
        
        // 10. 성공 메시지 확인
        const successMessages = await page.locator('text=/성공|완료|생성됨|success/i').all();
        if (successMessages.length > 0) {
            console.log('성공 메시지 발견:');
            for (const success of successMessages) {
                const text = await success.textContent();
                console.log(`  - ${text}`);
            }
        }
        
        // 11. 급여명세서 관련 텍스트 확인
        const payslipTexts = await page.locator('text=/급여|명세서|payslip/i').all();
        if (payslipTexts.length > 0) {
            console.log('급여명세서 관련 텍스트 발견:');
            for (const text of payslipTexts) {
                const content = await text.textContent();
                console.log(`  - ${content}`);
            }
        }
        
        // 12. 스크린샷 저장
        await page.screenshot({ path: 'payslip-debug-result.png', fullPage: true });
        console.log('📸 스크린샷 저장: payslip-debug-result.png');
        
        // 13. 15초 대기
        console.log('13. 15초 대기...');
        await page.waitForTimeout(15000);
        
        console.log('\n✅ 디버깅 완료');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        await page.screenshot({ path: 'payslip-debug-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

debugPayslipGeneration();
