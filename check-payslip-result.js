const { chromium } = require('playwright');

async function checkPayslipResult() {
    console.log('🔍 급여명세서 결과 확인');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
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
        await page.waitForTimeout(2000);
        
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
        
        await page.waitForTimeout(2000);
        
        // 5. 급여명세서 생성
        console.log('5. 급여명세서 생성...');
        await page.click('button:has-text("2025년 8월 급여 명세서 생성")');
        await page.waitForLoadState('networkidle');
        
        // 6. 결과 확인 - 더 자세한 분석
        console.log('6. 결과 확인...');
        await page.waitForTimeout(5000);
        
        // 페이지의 모든 텍스트 확인
        const allText = await page.textContent('body');
        console.log('\n📊 페이지 전체 텍스트 분석:');
        
        // 급여 관련 키워드 검색
        const keywords = ['기본급', '주휴수당', '시간외', '식대', '총 지급액', '세금', '실수령액'];
        keywords.forEach(keyword => {
            if (allText.includes(keyword)) {
                console.log(`✅ "${keyword}" 발견`);
                
                // 해당 키워드 주변 텍스트 추출
                const index = allText.indexOf(keyword);
                const context = allText.substring(Math.max(0, index - 50), index + 100);
                console.log(`   주변 텍스트: "${context}"`);
            } else {
                console.log(`❌ "${keyword}" 없음`);
            }
        });
        
        // 숫자 패턴 검색 (₩로 시작하는 금액)
        const amountPattern = /₩[0-9,]+원/g;
        const amounts = allText.match(amountPattern);
        if (amounts) {
            console.log(`\n💰 발견된 금액들:`);
            amounts.forEach(amount => console.log(`   ${amount}`));
        }
        
        // 7. 스크린샷 저장
        await page.screenshot({ path: 'payslip-detailed-check.png', fullPage: true });
        console.log('📸 스크린샷 저장: payslip-detailed-check.png');
        
        // 8. 10초 대기
        console.log('8. 10초 대기...');
        await page.waitForTimeout(10000);
        
        console.log('\n✅ 확인 완료');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        await page.screenshot({ path: 'payslip-check-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

checkPayslipResult();
