import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 상세 디버그', () => {
  test('상세 디버그 및 에러 분석', async ({ page }) => {
    console.log('🔍 상세 디버그 시작');
    
    // 모든 콘솔 메시지 수집
    const consoleMessages: { type: string, text: string }[] = [];
    page.on('console', msg => {
      const message = { type: msg.type(), text: msg.text() };
      consoleMessages.push(message);
      console.log(`📝 [${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // 네트워크 요청 실패 모니터링
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      const failedUrl = request.url();
      failedRequests.push(failedUrl);
      console.log(`❌ 네트워크 요청 실패: ${failedUrl}`);
    });
    
    // 페이지 에러 모니터링
    page.on('pageerror', error => {
      console.log(`💥 페이지 에러: ${error.message}`);
    });
    
    // 페이지로 이동
    console.log('🌐 페이지 로딩 중...');
    await page.goto('https://maslabs.kr/admin/insert-attendance');
    
    // 페이지 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    console.log('✅ 페이지 로딩 완료');
    
    // DOM 상태 확인
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    if (bodyContent.includes('Application error')) {
      console.log('💥 Application error 발견!');
      
      // 에러 메시지 추출
      const errorMessage = await page.textContent('.error-message, [class*="error"]');
      if (errorMessage) {
        console.log(`🔍 에러 내용: ${errorMessage}`);
      }
    }
    
    // React 컴포넌트 마운트 확인
    const hasReactRoot = await page.evaluate(() => {
      return document.querySelector('[data-reactroot], #__next') !== null;
    });
    console.log(`⚛️ React 루트 요소 존재: ${hasReactRoot}`);
    
    // 스케줄 데이터 로딩 함수 실행 확인
    await page.waitForTimeout(2000);
    
    // 조회 버튼 클릭 시도
    try {
      const searchButton = page.locator('button:has-text("조회")');
      if (await searchButton.isVisible()) {
        console.log('🔍 조회 버튼 클릭');
        await searchButton.click();
        
        // 로딩 상태 확인
        await page.waitForTimeout(5000);
        
        // 테이블 또는 데이터 확인
        const tableExists = await page.locator('table').isVisible();
        const noDataMessage = await page.locator(':has-text("데이터가 없습니다"), :has-text("스케줄이 없습니다")').isVisible();
        
        console.log(`📊 테이블 존재: ${tableExists}`);
        console.log(`📋 데이터 없음 메시지: ${noDataMessage}`);
        
        if (!tableExists && !noDataMessage) {
          console.log('❌ 테이블도 없고 "데이터 없음" 메시지도 없음 - 로딩 실패 추정');
        }
      }
    } catch (error) {
      console.log(`❌ 조회 버튼 클릭 실패: ${error}`);
    }
    
    // 최종 결과 요약
    console.log('\n📊 디버그 요약:');
    console.log(`   - 콘솔 메시지 수: ${consoleMessages.length}`);
    console.log(`   - 실패한 네트워크 요청 수: ${failedRequests.length}`);
    
    if (consoleMessages.length > 0) {
      console.log('\n📝 모든 콘솔 메시지:');
      consoleMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.type}] ${msg.text}`);
      });
    }
    
    if (failedRequests.length > 0) {
      console.log('\n❌ 실패한 요청들:');
      failedRequests.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    }
    
    console.log('\n🏁 상세 디버그 완료');
  });
});
