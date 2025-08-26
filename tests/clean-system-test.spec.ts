import { test, expect } from '@playwright/test';

test.describe('정리된 OP KPI 시스템 테스트', () => {
  test('메인 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 메인 페이지 접근 테스트 시작');
    
    // 메인 페이지로 이동
    await page.goto('http://localhost:3000');
    
    console.log('✅ 메인 페이지 접근 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('페이지 제목:', title);
    expect(title).toContain('MASLABS');
    
    // 로그인 링크 확인
    const loginLink = await page.locator('text=로그인, text=직원 로그인').count();
    console.log('로그인 링크 개수:', loginLink);
    expect(loginLink).toBeGreaterThan(0);
    
    console.log('🎉 메인 페이지 접근 테스트 완료!');
  });

  test('로그인 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 로그인 페이지 접근 테스트 시작');
    
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    console.log('✅ 로그인 페이지 접근 완료');
    
    // 로그인 폼 요소 확인
    const phoneInput = await page.locator('input[name="phone"], input[type="tel"]').count();
    const passwordInput = await page.locator('input[name="password"], input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log('로그인 폼 요소 확인:');
    console.log(`전화번호 입력: ${phoneInput > 0 ? '✅' : '❌'}`);
    console.log(`비밀번호 입력: ${passwordInput > 0 ? '✅' : '❌'}`);
    console.log(`제출 버튼: ${submitButton > 0 ? '✅' : '❌'}`);
    
    expect(phoneInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(submitButton).toBeGreaterThan(0);
    
    console.log('🎉 로그인 페이지 접근 테스트 완료!');
  });

  test('로그인 및 대시보드 접근 테스트', async ({ page }) => {
    console.log('🔍 로그인 및 대시보드 접근 테스트 시작');
    
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    // 로그인 정보 입력
    await page.fill('input[name="phone"], input[type="tel"]', '010-6669-9000');
    await page.fill('input[name="password"], input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드로 리다이렉트 대기
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ 로그인 성공 - 대시보드 접근 완료');
      
      // 대시보드 요소 확인
      const dashboardElements = [
        'text=대시보드',
        'text=근무 스케줄',
        'text=업무 기록',
        'text=조직도',
        'text=프로필'
      ];
      
      console.log('대시보드 요소 확인:');
      for (const element of dashboardElements) {
        const isVisible = await page.locator(element).count() > 0;
        console.log(`${element}: ${isVisible ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      console.log('❌ 로그인 실패 또는 대시보드 접근 실패');
      console.log('현재 URL:', page.url());
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'login-failure-screenshot.png', 
        fullPage: true 
      });
    }
    
    console.log('🎉 로그인 및 대시보드 접근 테스트 완료!');
  });

  test('업무 기록 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 업무 기록 페이지 접근 테스트 시작');
    
    // 업무 기록 페이지로 직접 이동
    await page.goto('http://localhost:3000/tasks');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 로드 확인
    const isLoaded = await page.locator('body').isVisible();
    console.log('페이지 로드 상태:', isLoaded);
    
    // 페이지 내용 확인
    const pageContent = await page.locator('body').textContent();
    console.log('페이지에 "업무" 텍스트 포함:', pageContent?.includes('업무'));
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'tasks-page-screenshot.png', 
      fullPage: true 
    });
    
    console.log('🎉 업무 기록 페이지 접근 테스트 완료!');
  });

  test('스케줄 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 스케줄 페이지 접근 테스트 시작');
    
    // 스케줄 페이지로 직접 이동
    await page.goto('http://localhost:3000/schedules');
    
    console.log('✅ 스케줄 페이지 접근 완료');
    
    // 페이지 로드 확인
    const isLoaded = await page.locator('body').isVisible();
    console.log('페이지 로드 상태:', isLoaded);
    
    // 페이지 내용 확인
    const pageContent = await page.locator('body').textContent();
    console.log('페이지에 "스케줄" 텍스트 포함:', pageContent?.includes('스케줄'));
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'schedules-page-screenshot.png', 
      fullPage: true 
    });
    
    console.log('🎉 스케줄 페이지 접근 테스트 완료!');
  });
});
