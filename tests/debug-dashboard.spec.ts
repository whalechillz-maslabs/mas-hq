import { test, expect } from '@playwright/test';

test('대시보드 디버깅 테스트', async ({ page }) => {
  console.log('🔍 대시보드 디버깅 시작');
  
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 로그인 성공');
  
  // 2. 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // 추가 대기
  
  // 3. 페이지 내용 확인
  console.log('🔍 페이지 내용 확인');
  
  // 페이지의 모든 텍스트 내용 가져오기
  const pageText = await page.textContent('body');
  console.log('페이지 텍스트:', pageText?.substring(0, 500) + '...');
  
  // 4. 특정 요소들 확인
  const elements = [
    '오늘의 미션',
    '근무 상태', 
    '관리자 기능',
    'OP 팀장 설정',
    '직원 관리',
    '시스템 설정'
  ];
  
  for (const element of elements) {
    const isVisible = await page.locator(`text=${element}`).isVisible();
    console.log(`${element}: ${isVisible ? '✅ 보임' : '❌ 안보임'}`);
  }
  
  // 5. 스크린샷 캡처
  await page.screenshot({ 
    path: 'dashboard-debug.png', 
    fullPage: true 
  });
  
  console.log('🎉 디버깅 완료!');
});
