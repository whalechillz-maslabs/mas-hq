import { test, expect } from '@playwright/test';

test.describe('개인별 출근 관리 페이지 간단 테스트', () => {
  test('김탁수 계정으로 기본 페이지 상태 확인', async ({ page }) => {
    console.log('🚀 개인별 출근 관리 페이지 간단 테스트 시작');
    
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
    
    // 4. 페이지 제목 확인 (여러 방법 시도)
    let pageTitle = '';
    try {
      // 방법 1: h1 태그
      const h1Element = page.locator('h1').first();
      if (await h1Element.count() > 0) {
        pageTitle = await h1Element.textContent() || '';
        console.log('📌 H1 제목:', pageTitle);
      }
    } catch (error) {
      console.log('❌ H1 제목 찾기 실패:', error);
    }
    
    try {
      // 방법 2: title 태그
      const titleElement = page.locator('title');
      if (await titleElement.count() > 0) {
        const titleText = await titleElement.textContent() || '';
        console.log('📌 Title 태그:', titleText);
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
    
    console.log('🔍 "출근" 텍스트 포함:', hasAttendanceText);
    console.log('🔍 "스케줄" 텍스트 포함:', hasScheduleText);
    console.log('🔍 "로딩" 텍스트 포함:', hasLoadingText);
    
    // 8. 모든 텍스트 노드 확인
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
    await page.screenshot({ path: 'tests/screenshots/attendance-simple-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 개인별 출근 관리 페이지 간단 테스트 완료!');
  });
});
