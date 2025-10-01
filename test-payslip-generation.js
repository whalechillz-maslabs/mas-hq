const { chromium } = require('playwright');

async function testPayslipGeneration() {
    console.log('🧪 최형호 급여명세서 생성 테스트 시작');
    
    const browser = await chromium.launch({ 
        headless: false, // 브라우저 창을 보이게 함
        slowMo: 1000, // 각 액션 사이에 1초 대기
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // 시스템 Chrome 사용
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 1. 로그인 페이지로 이동
        console.log('1. 로그인 페이지로 이동...');
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');
        
        // 2. 김탁수로 로그인
        console.log('2. 김탁수로 로그인...');
        
        // 로그인 폼 요소 찾기 (전화번호와 비밀번호)
        const phoneInput = page.locator('input[name="phone"]');
        const passwordInput = page.locator('input[name="password"]');
        const submitButton = page.locator('button[type="submit"]');
        
        await phoneInput.fill('010-6669-9000');
        await passwordInput.fill('66699000');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        
        // 3. 대시보드로 이동
        console.log('3. 대시보드로 이동...');
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        
        // 4. 관리자 메뉴 확인
        console.log('4. 관리자 메뉴 확인...');
        try {
            await page.waitForSelector('h3:has-text("관리자 전용 기능")', { timeout: 5000 });
            console.log('✅ 관리자 메뉴가 표시됨');
        } catch (error) {
            console.log('⚠️ 관리자 메뉴가 표시되지 않음, 스크롤하여 확인...');
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
        }
        
        // 5. 급여명세서 생성기로 직접 이동
        console.log('5. 급여명세서 생성기로 직접 이동...');
        await page.goto('http://localhost:3000/admin/payslip-generator');
        await page.waitForLoadState('networkidle');
        
        // 6. 최형호 선택
        console.log('6. 최형호 선택...');
        await page.selectOption('select', { value: 'e998a540-51bf-4380-bcb1-86fb36ec7eb8' }); // 최형호의 ID
        await page.waitForTimeout(1000);
        
        // 7. 월 단위 생성 테스트 (8월)
        console.log('7. 월 단위 생성 테스트 (8월)...');
        
        // 년도와 월 선택 (더 안전한 방법)
        const yearSelect = page.locator('select').nth(1);
        const monthSelect = page.locator('select').nth(2);
        
        await yearSelect.selectOption('2025');
        await monthSelect.selectOption('8');
        await page.waitForTimeout(1000);
        
        // 포인트 보너스 옵션 확인
        const pointBonusCheckbox = page.locator('input[id="include-point-bonus"]');
        if (await pointBonusCheckbox.isChecked()) {
            await pointBonusCheckbox.uncheck();
        }
        
        // 급여명세서 생성 버튼 클릭
        await page.click('button:has-text("2025년 8월 급여 명세서 생성")');
        await page.waitForLoadState('networkidle');
        
        // 7. 생성된 급여명세서 확인
        console.log('7. 생성된 급여명세서 확인...');
        await page.waitForSelector('h2:has-text("급여 명세서")', { timeout: 10000 });
        
        // 급여 내역 확인
        const basicSalary = await page.textContent('text=기본급');
        const overtimeWork = await page.textContent('text=시간외 근무');
        const mealAllowance = await page.textContent('text=식대');
        const totalPayment = await page.textContent('text=총 지급액');
        
        console.log('📊 월 단위 생성 결과:');
        console.log(`   기본급: ${basicSalary}`);
        console.log(`   시간외 근무: ${overtimeWork}`);
        console.log(`   식대: ${mealAllowance}`);
        console.log(`   총 지급액: ${totalPayment}`);
        
        // 8. 분할 생성 테스트 (8월 1일-15일)
        console.log('8. 분할 생성 테스트 (8월 1일-15일)...');
        
        // 분할 생성 모드로 전환
        await page.click('button:has-text("분할 생성 (기간 지정)")');
        await page.waitForTimeout(1000);
        
        // 시작일과 종료일 설정
        await page.fill('input[name="startDate"]', '2025-08-01');
        await page.fill('input[name="endDate"]', '2025-08-15');
        
        // 분할 생성 버튼 클릭
        await page.click('button:has-text("분할 급여 명세서 생성")');
        await page.waitForLoadState('networkidle');
        
        // 9. 분할 생성 결과 확인
        console.log('9. 분할 생성 결과 확인...');
        await page.waitForSelector('h2:has-text("급여 명세서")', { timeout: 10000 });
        
        // 분할 생성된 급여 내역 확인
        const splitBasicSalary = await page.textContent('text=기본급');
        const splitOvertimeWork = await page.textContent('text=시간외 근무');
        const splitMealAllowance = await page.textContent('text=식대');
        const splitTotalPayment = await page.textContent('text=총 지급액');
        
        console.log('📊 분할 생성 결과 (8월 1일-15일):');
        console.log(`   기본급: ${splitBasicSalary}`);
        console.log(`   시간외 근무: ${splitOvertimeWork}`);
        console.log(`   식대: ${splitMealAllowance}`);
        console.log(`   총 지급액: ${splitTotalPayment}`);
        
        // 10. 일별 상세 내역 확인
        console.log('10. 일별 상세 내역 확인...');
        const dailyDetails = await page.locator('table tbody tr').count();
        console.log(`   일별 상세 내역 행 수: ${dailyDetails}`);
        
        // 11. 문제점 분석
        console.log('\n🔍 문제점 분석:');
        
        // 시간외 근무가 주휴수당으로 표시되어야 하는지 확인
        if (overtimeWork && overtimeWork.includes('84,000')) {
            console.log('   ❌ 문제: "시간외 근무"가 84,000원으로 표시됨 (주휴수당이어야 함)');
        }
        
        // 식대 계산 확인
        if (mealAllowance && mealAllowance.includes('7,000')) {
            console.log('   ❌ 문제: "식대"가 7,000원으로 표시됨 (12일 × 7,000원 = 84,000원이어야 함)');
        }
        
        // 12. 스크린샷 저장
        await page.screenshot({ path: 'payslip-test-result.png', fullPage: true });
        console.log('📸 스크린샷 저장: payslip-test-result.png');
        
        console.log('\n✅ 테스트 완료');
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error);
        await page.screenshot({ path: 'payslip-test-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testPayslipGeneration();
