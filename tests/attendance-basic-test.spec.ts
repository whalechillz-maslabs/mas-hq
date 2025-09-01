import { test, expect } from '@playwright/test';

test.describe('개인별 출근 관리 페이지 기본 테스트', () => {
  test('김탁수 계정으로 기본 접근 테스트', async ({ page }) => {
    console.log('🚀 개인별 출근 관리 페이지 기본 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 개인 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    console.log('🔍 개인 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 3. 현재 URL 확인
    const currentURL = page.url();
    console.log('🌐 현재 URL:', currentURL);
    
    // 4. 페이지 제목 확인
    let pageTitle = '';
    try {
      const titleElement = page.locator('title');
      if (await titleElement.count() > 0) {
        pageTitle = await titleElement.textContent() || '';
        console.log('📌 Title 태그:', pageTitle);
      }
    } catch (error) {
      console.log('❌ Title 태그 찾기 실패:', error);
    }
    
    // 5. 페이지 본문 확인
    const bodyText = await page.locator('body').textContent();
    console.log('📄 페이지 본문 길이:', bodyText?.length || 0);
    
    // 6. 로딩 상태 확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
    
    // 7. 특정 텍스트 검색
    const hasAttendanceText = bodyText?.includes('출근') || false;
    const hasScheduleText = bodyText?.includes('스케줄') || false;
    const hasLoadingText = bodyText?.includes('로딩') || false;
    const hasLoginText = bodyText?.includes('로그인') || false;
    
    console.log('🔍 "출근" 텍스트 포함:', hasAttendanceText);
    console.log('🔍 "스케줄" 텍스트 포함:', hasScheduleText);
    console.log('🔍 "로딩" 텍스트 포함:', hasLoadingText);
    console.log('🔍 "로그인" 텍스트 포함:', hasLoginText);
    
    // 8. 모든 텍스트 노드 확인 (처음 10개만)
    const allTextNodes = page.locator('*').filter({ hasText: /./ });
    const textNodeCount = await allTextNodes.count();
    console.log('📝 텍스트가 있는 요소 수:', textNodeCount);
    
    if (textNodeCount > 0) {
      for (let i = 0; i < Math.min(textNodeCount, 10); i++) {
        try {
          const text = await allTextNodes.nth(i).textContent();
          if (text && text.trim().length > 0) {
            console.log(`📝 텍스트 ${i + 1}:`, text.trim().substring(0, 100));
          }
        } catch (error) {
          // 무시
        }
      }
    }
    
    // 9. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-basic-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    // 10. 결과 분석
    if (currentURL.includes('/login')) {
      console.log('❌ 문제: 로그인 페이지로 리다이렉트됨');
      console.log('🔍 원인: 인증 실패 또는 권한 부족');
    } else if (currentURL.includes('/attendance')) {
      if (hasAttendanceText || hasScheduleText) {
        console.log('✅ 성공: 개인별 출근 관리 페이지 정상 접근');
      } else if (hasLoadingText) {
        console.log('⚠️ 주의: 페이지는 접근되었지만 무한 로딩 상태');
      } else {
        console.log('❌ 문제: 페이지는 접근되었지만 내용이 표시되지 않음');
      }
    } else {
      console.log('❌ 문제: 예상치 못한 페이지로 이동됨');
    }
    
    console.log('🎉 개인별 출근 관리 페이지 기본 테스트 완료!');
  });
});
