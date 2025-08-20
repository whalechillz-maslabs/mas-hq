import { test, expect } from '@playwright/test';

test.describe('업무 기록 페이지 직접 접근 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 계정으로 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('업무 기록 페이지 직접 접근 및 OP1~10 확인', async ({ page }) => {
    console.log('🔍 업무 기록 페이지 직접 접근 테스트 시작');
    
    // 업무 기록 페이지로 직접 이동
    await page.goto('http://localhost:3000/tasks');
    
    console.log('✅ 업무 기록 페이지 직접 접근 완료');
    
    // 페이지 제목 확인
    const pageTitle = await page.title();
    console.log('페이지 제목:', pageTitle);
    
    // 페이지 내용 확인
    const pageContent = await page.locator('body').textContent();
    console.log('페이지에 "업무 기록" 텍스트 포함:', pageContent?.includes('업무 기록'));
    
    // 업무 추가 버튼 찾기
    const addButton = await page.locator('text=업무 추가, text=+ 업무 추가, text=Add Task, button:has-text("추가")').count();
    console.log('업무 추가 버튼 개수:', addButton);
    
    if (addButton > 0) {
      // 업무 추가 버튼 클릭
      await page.click('text=업무 추가, text=+ 업무 추가, text=Add Task, button:has-text("추가")');
      
      // 모달 대기
      await page.waitForTimeout(2000);
      
      // 업무 유형 드롭다운 확인
      const operationTypeSelect = await page.locator('select, [role="combobox"], .operation-type-select').count();
      console.log('업무 유형 선택 요소 개수:', operationTypeSelect);
      
      if (operationTypeSelect > 0) {
        // OP1~10 업무 유형 확인
        const opTypes = ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10'];
        
        console.log('📋 OP1~10 업무 유형 확인:');
        for (const op of opTypes) {
          const isVisible = await page.locator(`text=${op}`).count() > 0;
          console.log(`${op}: ${isVisible ? '✅' : '❌'}`);
        }
      }
    }
    
    // 업무 유형별 분포 섹션에서 OP1~10 확인
    const opDistribution = ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10'];
    
    console.log('📊 업무 유형별 분포 확인:');
    for (const op of opDistribution) {
      const isVisible = await page.locator(`text=${op}`).count() > 0;
      console.log(`${op}: ${isVisible ? '✅' : '❌'}`);
    }
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'task-record-direct-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 업무 기록 페이지 직접 접근 테스트 완료!');
  });

  test('업무 기록 페이지 URL 접근 테스트', async ({ page }) => {
    console.log('🔍 업무 기록 페이지 URL 접근 테스트 시작');
    
    // 로그인 후 업무 기록 페이지로 직접 이동
    await page.goto('http://localhost:3000/tasks');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 페이지 로드 상태 확인
    const isLoaded = await page.locator('body').isVisible();
    console.log('페이지 로드 상태:', isLoaded);
    
    // 페이지 내용 스크린샷
    await page.screenshot({ 
      path: 'task-record-url-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 업무 기록 페이지 URL 접근 테스트 완료!');
  });
});
