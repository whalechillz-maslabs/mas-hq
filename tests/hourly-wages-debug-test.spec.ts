import { test, expect } from '@playwright/test';

test.describe('시급관리 오류 진단 테스트', () => {
  test('시급 수정 오류 진단 및 수정', async ({ page }) => {
    console.log('🔍 시급관리 오류 진단 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 김탁수 계정으로 로그인 (관리자)
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/tasks');
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 관리자 로그인 완료');
    
    // 2. 시급관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 시급관리 페이지 접근');
    
    // 3. 콘솔 로그 수집 시작
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 4. 네트워크 요청 모니터링
    const networkRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('hourly_wages')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('hourly_wages')) {
        networkRequests.push({
          method: response.request().method(),
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 5. 허상원의 시급 수정 시도
    console.log('🔧 허상원 시급 수정 시도');
    
    // 허상원 행 찾기
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    await expect(heoSangWonRow).toBeVisible();
    console.log('✅ 허상원 행 확인');
    
    // 수정 버튼 클릭
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ 수정 버튼 클릭');
    
    // 모달이 열렸는지 확인
    const modal = page.locator('text=시급 수정').locator('..');
    await expect(modal).toBeVisible();
    console.log('✅ 수정 모달 열림');
    
    // 기본 시급을 13000에서 14000으로 변경
    const baseWageInput = modal.locator('input[type="number"]').first();
    await baseWageInput.clear();
    await baseWageInput.fill('14000');
    console.log('✅ 기본 시급 변경: 13000 → 14000');
    
    // 저장 버튼 클릭
    const saveButton = modal.locator('button:has-text("저장")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ 저장 버튼 클릭');
    
    // 6. 오류 분석
    console.log('\n=== 콘솔 로그 분석 ===');
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    console.log('\n=== 네트워크 요청 분석 ===');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url} - ${req.status || 'N/A'}`);
    });
    
    // 7. 오류 메시지 확인
    const errorMessages = consoleLogs.filter(log => 
      log.includes('오류') || 
      log.includes('error') || 
      log.includes('Error') ||
      log.includes('PGRST204') ||
      log.includes('Could not find')
    );
    
    if (errorMessages.length > 0) {
      console.log('\n=== 발견된 오류 메시지 ===');
      errorMessages.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/hourly-wages-debug.png', fullPage: true });
    console.log('✅ 디버그 스크린샷 저장');
    
    // 9. 데이터베이스 스키마 확인을 위한 추가 테스트
    console.log('\n=== 데이터베이스 스키마 확인 ===');
    
    // 페이지에서 JavaScript 실행하여 데이터베이스 스키마 확인
    const schemaInfo = await page.evaluate(async () => {
      try {
        // Supabase 클라이언트가 있는지 확인
        if (typeof window !== 'undefined' && (window as any).supabase) {
          const supabase = (window as any).supabase;
          
          // hourly_wages 테이블의 첫 번째 레코드 조회
          const { data, error } = await supabase
            .from('hourly_wages')
            .select('*')
            .limit(1);
            
          if (error) {
            return { error: error.message, code: error.code };
          }
          
          if (data && data.length > 0) {
            return { 
              success: true, 
              columns: Object.keys(data[0]),
              sampleData: data[0]
            };
          }
          
          return { success: true, message: 'No data found' };
        }
        
        return { error: 'Supabase client not found' };
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('데이터베이스 스키마 정보:', JSON.stringify(schemaInfo, null, 2));
    
    console.log('\n🎯 시급관리 오류 진단 테스트 완료');
  });
});
