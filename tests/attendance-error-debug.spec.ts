import { test, expect } from '@playwright/test';

test.describe('출근 페이지 에러 진단 테스트', () => {
  test('출근 페이지 로딩 및 에러 확인', async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/attendance');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(5000);
    
    // 콘솔 에러 확인
    const consoleMessages = await page.evaluate(() => {
      return window.console.error ? '콘솔 에러가 발생했습니다' : '콘솔 에러 없음';
    });
    
    console.log('콘솔 상태:', consoleMessages);
    
    // 네트워크 에러 확인
    const networkErrors = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('attendance'))
        .map((entry: any) => ({
          name: entry.name,
          duration: entry.duration,
          failed: entry.duration === 0
        }));
    });
    
    console.log('네트워크 요청 상태:', networkErrors);
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    console.log('페이지 내용 길이:', pageContent.length);
    
    // 에러 메시지가 있는지 확인
    if (pageContent.includes('Application error')) {
      console.log('❌ Application error 발생');
      
      // 더 자세한 에러 정보 수집
      const errorDetails = await page.evaluate(() => {
        return {
          hasError: document.body.textContent?.includes('Application error') || false,
          errorText: document.body.textContent || '내용 없음',
          scripts: Array.from(document.scripts).map(s => s.src).filter(Boolean),
          styles: Array.from(document.styleSheets).map(s => s.href).filter(Boolean)
        };
      });
      
      console.log('에러 상세 정보:', errorDetails);
    } else {
      console.log('✅ Application error 없음');
    }
    
    // 페이지가 정상적으로 로드되었는지 확인
    try {
      await expect(page.locator('body')).not.toContainText('Application error');
      console.log('✅ 페이지가 정상적으로 로드됨');
    } catch (error) {
      console.log('❌ 페이지 로드 실패:', error);
    }
  });

  test('출근 페이지 콘솔 에러 수집', async ({ page }) => {
    // 콘솔 에러 수집을 위한 리스너 설정
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
    
    // 페이지 로딩
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForTimeout(5000);
    
    // 수집된 에러 출력
    console.log('수집된 콘솔 에러들:');
    consoleErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    // 에러가 있으면 실패로 처리
    if (consoleErrors.length > 0) {
      throw new Error(`콘솔 에러 발생: ${consoleErrors.join(', ')}`);
    }
  });

  test('출근 페이지 네트워크 요청 상태 확인', async ({ page }) => {
    const failedRequests: any[] = [];
    
    // 네트워크 요청 실패 감지
    page.on('response', response => {
      if (!response.ok()) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForTimeout(5000);
    
    console.log('실패한 네트워크 요청들:');
    failedRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.url} - ${req.status} ${req.statusText}`);
    });
    
    // 실패한 요청이 있으면 경고
    if (failedRequests.length > 0) {
      console.warn(`⚠️ ${failedRequests.length}개의 네트워크 요청이 실패했습니다.`);
    }
  });
});
