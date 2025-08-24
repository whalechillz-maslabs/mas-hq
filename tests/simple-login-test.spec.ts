import { test, expect } from '@playwright/test';

test('간단한 로그인 테스트', async ({ page }) => {
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  
  // 2. 페이지가 로드되었는지 확인
  await expect(page.locator('text=직원 로그인')).toBeVisible();
  
  // 3. 전화번호 탭 클릭 (버튼으로 구체적으로 선택)
  await page.click('button:has-text("전화번호")');
  
  // 4. 로그인 정보 입력 (관리자 계정)
  await page.fill('input[placeholder="010-1234-5678"]', '010-6669-9000');
  await page.fill('input[placeholder="비밀번호"]', '66699000');
  
  // 5. 로그인 버튼 클릭
  await page.click('button:has-text("로그인")');
  
  // 6. 대시보드로 이동했는지 확인
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  console.log('✅ 로그인 테스트 성공');
});
