import { test, expect } from '@playwright/test';

test.describe('Vercel 배포 빌드 에러 체크 테스트', () => {
  test('메인 페이지 및 주요 기능 빌드 에러 확인', async ({ page }) => {
    console.log('🚀 Vercel 배포 빌드 에러 체크 테스트 시작');
    
    // 콘솔 오류 수집
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ 콘솔 오류:', msg.text());
      }
    });
    
    // 네트워크 오류 수집
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        const url = response.url();
        const status = response.status();
        networkErrors.push(`${url} - ${status}`);
        console.log(`❌ 네트워크 오류: ${url} - ${status}`);
      }
    });
    
    // 1. 메인 페이지 접근
    console.log('🔍 메인 페이지 접근 중...');
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    console.log('✅ 메인 페이지 접근 완료');
    
    // 2. 로그인 페이지 접근
    console.log('🔍 로그인 페이지 접근 중...');
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 페이지 접근 완료');
    
    // 3. 김탁수 계정으로 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 4. 빠른 업무 입력 페이지 확인
    console.log('🔍 빠른 업무 입력 페이지 확인 중...');
    const quickTaskTitle = page.locator('h1');
    await expect(quickTaskTitle).toBeVisible();
    console.log('✅ 빠른 업무 입력 페이지 확인됨');
    
    // 5. 대시보드 페이지 접근
    console.log('🔍 대시보드 페이지 접근 중...');
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ 대시보드 페이지 접근 완료');
    
    // 6. 업무 관리 페이지 접근
    console.log('🔍 업무 관리 페이지 접근 중...');
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    console.log('✅ 업무 관리 페이지 접근 완료');
    
    // 7. 근무 스케줄 페이지 접근
    console.log('🔍 근무 스케줄 페이지 접근 중...');
    await page.goto('https://www.maslabs.kr/schedules');
    await page.waitForLoadState('networkidle');
    console.log('✅ 근무 스케줄 페이지 접근 완료');
    
    // 8. 관리자 페이지들 접근 테스트
    console.log('🔍 관리자 페이지들 접근 테스트 중...');
    
    // 직원 관리 페이지
    try {
      await page.goto('https://www.maslabs.kr/admin/employee-management');
      await page.waitForLoadState('networkidle');
      console.log('✅ 직원 관리 페이지 접근 완료');
    } catch (error) {
      console.log('❌ 직원 관리 페이지 접근 실패:', error);
    }
    
    // 직원별 스케줄 관리 페이지
    try {
      await page.goto('https://www.maslabs.kr/admin/employee-schedules');
      await page.waitForLoadState('networkidle');
      console.log('✅ 직원별 스케줄 관리 페이지 접근 완료');
    } catch (error) {
      console.log('❌ 직원별 스케줄 관리 페이지 접근 실패:', error);
    }
    
    // 출근 관리 페이지
    try {
      await page.goto('https://www.maslabs.kr/admin/attendance-management');
      await page.waitForLoadState('networkidle');
      console.log('✅ 출근 관리 페이지 접근 완료');
    } catch (error) {
      console.log('❌ 출근 관리 페이지 접근 실패:', error);
    }
    
    // 9. 콘솔 오류 확인
    console.log(`📊 총 콘솔 오류 수: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('콘솔 오류 목록:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 10. 네트워크 오류 확인
    console.log(`📊 총 네트워크 오류 수: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('네트워크 오류 목록:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 11. 스크린샷 저장
    await page.screenshot({ path: 'test-results/vercel-build-error-check.png' });
    console.log('📸 스크린샷 저장됨');
    
    // 12. 빌드 에러 여부 판단
    const hasBuildErrors = consoleErrors.length > 0 || networkErrors.length > 0;
    if (hasBuildErrors) {
      console.log('⚠️ 빌드 에러가 발견되었습니다!');
      expect(hasBuildErrors).toBe(false);
    } else {
      console.log('✅ 빌드 에러가 발견되지 않았습니다.');
    }
    
    console.log('🎉 Vercel 배포 빌드 에러 체크 테스트 완료!');
  });
});
