import { test, expect } from '@playwright/test';

test.describe('허상원 계정 디버깅', () => {
  test('허상원 계정 데이터베이스 연결 및 권한 확인', async ({ page }) => {
    console.log('🚀 허상원 계정 디버깅 시작');

    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-8948-4501');
    await page.fill('input[type="password"]', '89484501');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ 로그인 성공');

    // 2. 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    console.log('✅ 업무 기록 페이지 로드 완료');

    // 3. 콘솔 로그 확인
    console.log('3️⃣ 콘솔 로그 확인');
    
    // 페이지 로드 후 잠시 대기
    await page.waitForTimeout(5000);
    
    // 콘솔 메시지 가져오기
    const consoleMessages = await page.evaluate(() => {
      return window.consoleMessages || [];
    });
    
    console.log('📝 콘솔 메시지:', consoleMessages);

    // 4. 네트워크 요청 확인
    console.log('4️⃣ 네트워크 요청 확인');
    
    // 네트워크 요청 로그
    page.on('request', request => {
      console.log(`🌐 요청: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      console.log(`📡 응답: ${response.status()} ${response.url()}`);
    });

    // 5. 업무 추가 시도
    console.log('5️⃣ 업무 추가 시도');
    await page.click('button:has-text("업무 추가")');
    
    // 모달이 나타날 때까지 대기
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    // 간단한 업무 추가
    await page.selectOption('select[name="operation_type_id"]', { index: 0 });
    await page.fill('input[name="title"]', '디버깅 테스트 업무');
    await page.fill('input[name="customer_name"]', '디버깅고객');
    await page.fill('input[name="sales_amount"]', '1000000');
    await page.fill('textarea[name="notes"]', '디버깅을 위한 테스트 업무입니다.');
    
    // 추가 버튼 클릭
    const modal = page.locator('div[class*="fixed"]').first();
    await modal.locator('button:has-text("추가")').click();
    
    // 모달이 닫힐 때까지 대기
    await page.waitForTimeout(3000);
    console.log('✅ 업무 추가 버튼 클릭 완료');

    // 6. 페이지 새로고침 후 확인
    console.log('6️⃣ 페이지 새로고침 후 확인');
    await page.reload();
    await page.waitForTimeout(5000);
    
    const taskRows = await page.locator('tbody tr').count();
    console.log(`📊 새로고침 후 업무 수: ${taskRows}개`);
    
    // 모든 업무 행의 텍스트 확인
    for (let i = 0; i < taskRows; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      console.log(`📋 업무 ${i + 1}: ${rowText?.trim()}`);
    }

    // 7. 브라우저 개발자 도구에서 직접 확인
    console.log('7️⃣ 브라우저 개발자 도구 확인');
    
    // localStorage 확인
    const localStorage = await page.evaluate(() => {
      return Object.keys(localStorage).reduce((obj, key) => {
        obj[key] = localStorage.getItem(key);
        return obj;
      }, {} as Record<string, string | null>);
    });
    
    console.log('💾 localStorage:', localStorage);

    // 8. 페이지 HTML 구조 확인
    console.log('8️⃣ 페이지 HTML 구조 확인');
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📄 Body HTML 길이:', bodyHTML.length);
    
    // 업무 관련 텍스트가 있는지 확인
    if (bodyHTML.includes('디버깅 테스트 업무')) {
      console.log('✅ "디버깅 테스트 업무" 텍스트 발견');
    } else {
      console.log('❌ "디버깅 테스트 업무" 텍스트 없음');
    }
    
    if (bodyHTML.includes('tbody')) {
      console.log('✅ "tbody" 태그 발견');
    } else {
      console.log('❌ "tbody" 태그 없음');
    }

    console.log('🎉 허상원 계정 디버깅 완료');
  });
});
