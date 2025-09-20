import { test, expect } from '@playwright/test';

test.describe('콘솔 메시지 캡처 디버그', () => {
  test('모든 콘솔 메시지 상세 캡처', async ({ page }) => {
    console.log('🔍 콘솔 메시지 캡처 시작');
    
    // 모든 콘솔 메시지를 상세하게 캡처
    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      console.log(`📝 [${type.toUpperCase()}] ${text}`);
      if (location.url) {
        console.log(`   위치: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
      
      // 스택 트레이스가 있는 경우
      if (type === 'error') {
        try {
          const args = msg.args();
          for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const value = await arg.jsonValue().catch(() => '[복잡한 객체]');
            console.log(`   인수 ${i}: ${JSON.stringify(value)}`);
          }
        } catch (e) {
          console.log(`   인수 파싱 실패: ${e}`);
        }
      }
    });
    
    // 페이지 에러 캐치
    page.on('pageerror', error => {
      console.log(`💥 페이지 에러: ${error.name}: ${error.message}`);
      console.log(`   스택: ${error.stack}`);
    });
    
    // 네트워크 에러 캐치
    page.on('requestfailed', request => {
      console.log(`❌ 네트워크 실패: ${request.method()} ${request.url()}`);
      console.log(`   실패 사유: ${request.failure()?.errorText}`);
    });
    
    // 응답 모니터링
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`⚠️ HTTP 에러: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('🌐 페이지로 이동...');
    await page.goto('https://maslabs.kr/admin/insert-attendance', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ 페이지 로딩 완료, 5초 대기...');
    await page.waitForTimeout(5000);
    
    // JavaScript 실행 여부 확인
    const jsWorking = await page.evaluate(() => {
      console.log('🧪 JavaScript 테스트 실행됨');
      return true;
    });
    console.log(`⚡ JavaScript 실행 가능: ${jsWorking}`);
    
    // React 관련 전역 객체 확인
    const reactInfo = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasNextRouter: typeof window.next !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasWindow: typeof window !== 'undefined',
        userAgent: navigator.userAgent,
        url: window.location.href
      };
    });
    console.log('⚛️ React/Next.js 정보:', JSON.stringify(reactInfo, null, 2));
    
    // DOM 상태 확인
    const domInfo = await page.evaluate(() => {
      const body = document.body;
      const scripts = document.querySelectorAll('script');
      const hasNextApp = document.querySelector('#__next') !== null;
      const hasErrorMessage = document.body.innerHTML.includes('Application error');
      
      return {
        bodyClasses: body.className,
        scriptCount: scripts.length,
        hasNextApp,
        hasErrorMessage,
        bodyTextLength: body.innerText.length
      };
    });
    console.log('🏗️ DOM 정보:', JSON.stringify(domInfo, null, 2));
    
    // 수동으로 콘솔 로그 트리거
    await page.evaluate(() => {
      console.log('🔧 수동 콘솔 로그 테스트');
      console.warn('⚠️ 수동 경고 테스트');
      console.error('❌ 수동 에러 테스트');
    });
    
    console.log('⏳ 추가로 3초 대기...');
    await page.waitForTimeout(3000);
    
    console.log('🏁 콘솔 메시지 캡처 완료');
  });
});
