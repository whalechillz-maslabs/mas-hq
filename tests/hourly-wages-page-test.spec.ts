import { test, expect } from '@playwright/test';

test.describe('시급 관리 페이지 테스트', () => {
  test('시급 관리 페이지 접근 및 데이터 로딩 확인', async ({ page }) => {
    console.log('=== 시급 관리 페이지 테스트 시작 ===');
    
    // 1. 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 2. 김탁수 계정으로 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 3. 로그인 후 리다이렉트 대기
    await page.waitForURL('**/tasks');
    console.log('로그인 성공, 현재 URL:', page.url());
    
    // 4. 시급 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 5. 페이지 제목 확인
    const pageTitle = await page.title();
    console.log('시급 관리 페이지 제목:', pageTitle);
    
    // 6. 로딩 상태 확인
    const loadingText = page.locator('text=시급 정보를 불러오는 중');
    const loadingCount = await loadingText.count();
    console.log('로딩 텍스트 표시 개수:', loadingCount);
    
    if (loadingCount > 0) {
      console.log('⚠️ 페이지가 아직 로딩 중입니다.');
      // 로딩 완료까지 대기
      await page.waitForSelector('text=시급 정보를 불러오는 중', { state: 'hidden', timeout: 10000 });
    }
    
    // 7. 직원 선택 드롭다운 확인
    const employeeSelect = page.locator('select, [role="combobox"]').first();
    const employeeSelectCount = await employeeSelect.count();
    console.log('직원 선택 드롭다운 개수:', employeeSelectCount);
    
    if (employeeSelectCount > 0) {
      // 드롭다운 옵션 확인
      const options = await employeeSelect.locator('option').count();
      console.log('직원 선택 옵션 개수:', options);
      
      if (options > 1) { // 첫 번째는 "직원을 선택하세요" 같은 플레이스홀더
        console.log('✅ 직원 목록이 정상적으로 로드되었습니다.');
        
        // 옵션 텍스트 확인
        const optionTexts = await employeeSelect.locator('option').allTextContents();
        console.log('직원 목록:', optionTexts.slice(1)); // 첫 번째 제외
      } else {
        console.log('❌ 직원 목록이 로드되지 않았습니다.');
      }
    } else {
      console.log('❌ 직원 선택 드롭다운을 찾을 수 없습니다.');
    }
    
    // 8. 시급 등록 폼 확인
    const baseWageInput = page.locator('input[type="number"], input[placeholder*="시급"]').first();
    const baseWageCount = await baseWageInput.count();
    console.log('기본 시급 입력 필드 개수:', baseWageCount);
    
    if (baseWageCount > 0) {
      const baseWageValue = await baseWageInput.inputValue();
      console.log('기본 시급 값:', baseWageValue);
    }
    
    // 9. 등록된 시급 목록 확인
    const wagesTable = page.locator('table, [role="table"]');
    const wagesTableCount = await wagesTable.count();
    console.log('시급 목록 테이블 개수:', wagesTableCount);
    
    if (wagesTableCount > 0) {
      // 테이블 헤더 확인
      const headers = page.locator('th, [role="columnheader"]');
      const headerCount = await headers.count();
      console.log('테이블 헤더 개수:', headerCount);
      
      if (headerCount > 0) {
        const headerTexts = await headers.allTextContents();
        console.log('테이블 헤더:', headerTexts);
      }
      
      // 테이블 데이터 행 확인
      const dataRows = page.locator('tbody tr, [role="row"]:not([role="columnheader"])');
      const dataRowCount = await dataRows.count();
      console.log('데이터 행 개수:', dataRowCount);
      
      if (dataRowCount > 0) {
        console.log('✅ 등록된 시급 데이터가 있습니다.');
        
        // 첫 번째 행 데이터 확인
        const firstRow = dataRows.first();
        const firstRowText = await firstRow.textContent();
        console.log('첫 번째 행 데이터:', firstRowText);
      } else {
        console.log('❌ 등록된 시급 데이터가 없습니다.');
      }
    } else {
      console.log('❌ 시급 목록 테이블을 찾을 수 없습니다.');
    }
    
    // 10. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/hourly-wages-page-test.png',
      fullPage: true 
    });
    
    console.log('=== 시급 관리 페이지 테스트 완료 ===');
  });
  
  test('시급 등록 기능 테스트', async ({ page }) => {
    console.log('=== 시급 등록 기능 테스트 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 2. 로딩 완료 대기
    await page.waitForSelector('text=시급 정보를 불러오는 중', { state: 'hidden', timeout: 10000 });
    
    // 3. 직원 선택
    const employeeSelect = page.locator('select, [role="combobox"]').first();
    const employeeSelectCount = await employeeSelect.count();
    
    if (employeeSelectCount > 0) {
      const options = await employeeSelect.locator('option').count();
      if (options > 1) {
        // 두 번째 옵션 선택 (첫 번째는 플레이스홀더)
        await employeeSelect.selectOption({ index: 1 });
        console.log('✅ 직원을 선택했습니다.');
        
        // 4. 시급 입력
        const baseWageInput = page.locator('input[type="number"], input[placeholder*="시급"]').first();
        await baseWageInput.fill('13000');
        console.log('✅ 시급을 13,000원으로 입력했습니다.');
        
        // 5. 등록 버튼 클릭
        const registerButton = page.locator('button:has-text("시급 등록"), button:has-text("등록")');
        const registerButtonCount = await registerButton.count();
        
        if (registerButtonCount > 0) {
          await registerButton.click();
          console.log('✅ 시급 등록 버튼을 클릭했습니다.');
          
          // 6. 성공 메시지 확인
          await page.waitForTimeout(2000); // 등록 처리 대기
          
          // 7. 등록된 데이터 확인
          const dataRows = page.locator('tbody tr, [role="row"]:not([role="columnheader"])');
          const dataRowCount = await dataRows.count();
          console.log('등록 후 데이터 행 개수:', dataRowCount);
          
          if (dataRowCount > 0) {
            console.log('✅ 시급이 성공적으로 등록되었습니다.');
          } else {
            console.log('❌ 시급 등록이 실패했거나 데이터가 표시되지 않습니다.');
          }
        } else {
          console.log('❌ 시급 등록 버튼을 찾을 수 없습니다.');
        }
      } else {
        console.log('❌ 선택할 수 있는 직원이 없습니다.');
      }
    } else {
      console.log('❌ 직원 선택 드롭다운을 찾을 수 없습니다.');
    }
    
    // 8. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/hourly-wages-register-test.png',
      fullPage: true 
    });
    
    console.log('=== 시급 등록 기능 테스트 완료 ===');
  });
});
