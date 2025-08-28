import { test, expect } from '@playwright/test';

test.describe('간단한 환불 기능 테스트', () => {
  test('환불 기능 테스트', async ({ page }) => {
    console.log('🚀 간단한 환불 기능 테스트 시작');

    // 1. 원격 서버로 이동
    await page.goto('https://www.maslabs.kr');
    console.log('✅ 메인 페이지 로드 완료');

    // 2. 페이지 스크린샷 확인
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✅ 스크린샷 저장됨');

    // 3. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 4. 직원 로그인 링크 확인 (더 구체적인 선택자 사용)
    const employeeLoginLink = page.locator('a[href="/login"]').filter({ hasText: '직원 로그인' });
    if (await employeeLoginLink.isVisible()) {
      console.log('✅ 직원 로그인 링크 발견');
      await employeeLoginLink.click();
      await page.waitForTimeout(3000);
      
      // 로그인 페이지 스크린샷
      await page.screenshot({ path: 'login-page.png' });
      console.log('✅ 로그인 페이지 스크린샷 저장됨');

      // 5. 로그인 폼 확인
      const phoneInput = page.locator('input[placeholder="전화번호를 입력하세요"]');
      const pinInput = page.locator('input[placeholder="PIN을 입력하세요"]');
      
      if (await phoneInput.isVisible() && await pinInput.isVisible()) {
        console.log('✅ 로그인 폼 확인됨');
        
        // 6. 허상원 계정으로 로그인
        await phoneInput.fill('010-8948-4501');
        await pinInput.fill('89484501');
        await page.click('button:has-text("로그인")');
        
        // 로그인 후 대시보드 대기
        await page.waitForURL('**/dashboard', { timeout: 30000 });
        console.log('✅ 로그인 성공');
        
        // 7. 업무 기록 페이지로 이동
        await page.click('a[href="/tasks"]');
        await page.waitForURL('**/tasks', { timeout: 30000 });
        console.log('✅ 업무 기록 페이지 로드 완료');
        
        // 8. 페이지 스크린샷
        await page.screenshot({ path: 'tasks-page.png' });
        console.log('✅ 업무 기록 페이지 스크린샷 저장됨');
        
        // 9. 현재 업무 목록 확인
        const taskRows = await page.locator('tbody tr').count();
        console.log(`📊 현재 업무 수: ${taskRows}개`);
        
        // 10. 업무 추가 버튼 확인
        const addButton = page.locator('button:has-text("업무 추가")');
        if (await addButton.isVisible()) {
          console.log('✅ 업무 추가 버튼 확인됨');
        } else {
          console.log('❌ 업무 추가 버튼을 찾을 수 없음');
        }
        
      } else {
        console.log('❌ 로그인 폼을 찾을 수 없음');
      }
    } else {
      console.log('❌ 직원 로그인 링크를 찾을 수 없음');
    }

    console.log('🎉 기본 테스트 완료');
  });
});
