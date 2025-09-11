import { test, expect } from '@playwright/test';

test.describe('시급관리 오류 수정 테스트', () => {
  test('시급 수정 오류 진단 및 수정', async ({ page }) => {
    console.log('🔧 시급 수정 오류 진단 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 김탁수 계정으로 로그인 (관리자)
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/tasks');
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 관리자 로그인 및 시급관리 페이지 접근 완료');
    
    // 2. 페이지 내용 확인
    console.log('🔍 페이지 내용 확인');
    
    // 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    console.log('📄 페이지 제목:', pageTitle);
    
    // 테이블 내용 확인
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    console.log('📊 테이블 행 수:', rowCount);
    
    // 모든 행의 내용 출력
    for (let i = 0; i < rowCount; i++) {
      const row = tableRows.nth(i);
      const rowText = await row.textContent();
      console.log(`📋 행 ${i + 1}:`, rowText);
    }
    
    // 3. 콘솔 로그 수집 시작
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 4. 허상원의 시급 수정 시도
    console.log('🔍 허상원 시급 수정 시도');
    
    // 허상원 행 찾기 (다양한 방법으로 시도)
    let heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    let rowFound = await heoSangWonRow.count() > 0;
    
    if (!rowFound) {
      // 다른 방법으로 시도
      heoSangWonRow = page.locator('tr').filter({ hasText: '상원' });
      rowFound = await heoSangWonRow.count() > 0;
    }
    
    if (!rowFound) {
      // 모든 행에서 허상원 찾기
      for (let i = 0; i < rowCount; i++) {
        const row = tableRows.nth(i);
        const rowText = await row.textContent();
        if (rowText && rowText.includes('허상원')) {
          heoSangWonRow = row;
          rowFound = true;
          break;
        }
      }
    }
    
    if (!rowFound) {
      console.log('❌ 허상원 행을 찾을 수 없음');
      await page.screenshot({ path: 'playwright-report/hourly-wages-no-heo.png', fullPage: true });
      return;
    }
    
    console.log('✅ 허상원 행 확인');
    
    // 수정 버튼 클릭
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ 수정 버튼 클릭');
    
    // 모달이 열렸는지 확인
    const modal = page.locator('text=시급 수정');
    await expect(modal).toBeVisible();
    console.log('✅ 수정 모달 열림');
    
    // 4. 시급 수정 시도
    console.log('📝 시급 수정 시도');
    
    // 기본 시급 변경
    const baseWageInput = page.locator('input[type="number"]').first();
    await baseWageInput.clear();
    await baseWageInput.fill('14000');
    console.log('✅ 기본 시급 14000원으로 변경');
    
    // 저장 버튼 클릭
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ 저장 버튼 클릭');
    
    // 5. 콘솔 오류 확인
    console.log('🔍 콘솔 오류 확인');
    
    const errorLogs = consoleLogs.filter(log => 
      log.includes('error') || 
      log.includes('Error') || 
      log.includes('PGRST204') ||
      log.includes('Could not find')
    );
    
    if (errorLogs.length > 0) {
      console.log('❌ 발견된 오류:');
      errorLogs.forEach(log => console.log(`  - ${log}`));
      
      // 특정 오류 패턴 확인
      const columnError = errorLogs.find(log => 
        log.includes('Could not find') && 
        (log.includes('effective_date') || log.includes('night_shift_multiplier'))
      );
      
      if (columnError) {
        console.log('🎯 컬럼 오류 발견:', columnError);
        
        // 데이터베이스 스키마 확인을 위한 정보 수집
        console.log('📊 데이터베이스 스키마 정보 수집');
        
        // 네트워크 요청 확인
        const networkRequests: any[] = [];
        page.on('request', request => {
          if (request.url().includes('supabase') && request.method() === 'PATCH') {
            networkRequests.push({
              url: request.url(),
              method: request.method(),
              postData: request.postData()
            });
          }
        });
        
        // 스크린샷 저장
        await page.screenshot({ path: 'playwright-report/hourly-wages-error.png', fullPage: true });
        console.log('✅ 오류 상태 스크린샷 저장');
        
        // 오류 정보를 파일로 저장
        const errorInfo = {
          timestamp: new Date().toISOString(),
          errorLogs,
          columnError,
          networkRequests,
          pageUrl: page.url()
        };
        
        console.log('📝 오류 정보:', JSON.stringify(errorInfo, null, 2));
        
        // 테스트 실패로 처리하여 오류 정보를 보고서에 포함
        expect(errorLogs.length).toBe(0);
      }
    } else {
      console.log('✅ 콘솔 오류 없음');
    }
    
    // 6. 최종 상태 확인
    console.log('🔍 최종 상태 확인');
    
    // 모달이 닫혔는지 확인
    const modalStillOpen = await modal.isVisible();
    if (modalStillOpen) {
      console.log('❌ 모달이 여전히 열려있음 - 수정 실패');
    } else {
      console.log('✅ 모달이 닫힘 - 수정 성공 가능성');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/hourly-wages-final.png', fullPage: true });
    console.log('✅ 최종 상태 스크린샷 저장');
    
    console.log('🎉 시급 수정 오류 진단 테스트 완료');
  });
});
