const { chromium } = require('playwright');

async function simplePayslipTest() {
    console.log('🧪 최형호 급여명세서 간단 테스트');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 2000,
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
        await page.selectOption('select:nth-of-type(2)', '2025');
        await page.selectOption('select:nth-of-type(3)', '8');
        await page.waitForTimeout(2000);
        
        // 5. 급여명세서 생성
        console.log('5. 급여명세서 생성...');
        await page.click('button:has-text("2025년 8월 급여 명세서 생성")');
        await page.waitForLoadState('networkidle');
        
        // 6. 결과 확인
        console.log('6. 결과 확인...');
        await page.waitForTimeout(3000);
        
        // 페이지 내용 확인
        const pageContent = await page.textContent('body');
        console.log('\n📊 페이지 내용 분석:');
        
        // 시간외 근무 확인
        if (pageContent.includes('시간외 근무')) {
            console.log('✅ "시간외 근무" 텍스트 발견');
            const overtimeMatch = pageContent.match(/시간외 근무[^₩]*₩([0-9,]+)원/);
            if (overtimeMatch) {
                console.log(`   금액: ₩${overtimeMatch[1]}원`);
                if (overtimeMatch[1] === '84,000') {
                    console.log('   ❌ 문제: 84,000원으로 표시됨 (주휴수당이어야 함)');
                }
            }
        } else {
            console.log('❌ "시간외 근무" 텍스트를 찾을 수 없음');
        }
        
        // 식대 확인
        if (pageContent.includes('식대')) {
            console.log('✅ "식대" 텍스트 발견');
            const mealMatch = pageContent.match(/식대[^₩]*₩([0-9,]+)원/);
            if (mealMatch) {
                console.log(`   금액: ₩${mealMatch[1]}원`);
                if (mealMatch[1] === '7,000') {
                    console.log('   ❌ 문제: 7,000원으로 표시됨 (12일 × 7,000원 = 84,000원이어야 함)');
                } else if (mealMatch[1] === '84,000') {
                    console.log('   ✅ 올바른 계산: 84,000원');
                }
            }
        } else {
            console.log('❌ "식대" 텍스트를 찾을 수 없음');
        }
        
        // 주휴수당 확인
        if (pageContent.includes('주휴수당')) {
            console.log('✅ "주휴수당" 텍스트 발견');
            const weeklyMatch = pageContent.match(/주휴수당[^₩]*₩([0-9,]+)원/);
            if (weeklyMatch) {
                console.log(`   금액: ₩${weeklyMatch[1]}원`);
            }
        } else {
            console.log('❌ "주휴수당" 텍스트를 찾을 수 없음');
        }
        
        // 7. 스크린샷 저장
        await page.screenshot({ path: 'payslip-test-simple.png', fullPage: true });
        console.log('📸 스크린샷 저장: payslip-test-simple.png');
        
        // 8. 10초 대기 (수동 확인용)
        console.log('8. 10초 대기 (수동 확인용)...');
        await page.waitForTimeout(10000);
        
        console.log('\n✅ 테스트 완료');
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error);
        await page.screenshot({ path: 'payslip-test-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

simplePayslipTest();
