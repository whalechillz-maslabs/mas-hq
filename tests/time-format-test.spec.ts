import { test, expect } from '@playwright/test';

test('시간 형식 및 인사말 수정 확인 테스트', async ({ page }) => {
  console.log('🔍 시간 형식 및 인사말 수정 확인 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인 방법 선택 (전화번호)
  await page.click('text=전화번호');
  console.log('✅ 전화번호 로그인 방법 선택');
  
  // 3. 전화번호 입력 (관리자 계정)
  await page.fill('input[type="tel"]', '010-6669-9000');
  console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
  
  // 4. 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  console.log('✅ 관리자 비밀번호 입력: 66699000');
  
  // 5. 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 버튼 클릭');
  
  // 6. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 페이지 로딩 완료');
  
  // 7. 페이지 로딩 대기
  await page.waitForTimeout(3000);
  
  // 8. 시간 형식 확인 (YYYY년 MM월 DD일(요일) 형식)
  const timeElement = await page.locator('.text-sm.text-gray-600').first();
  const timeText = await timeElement.textContent();
  console.log('🕐 시간 형식:', timeText);
  
  // 시간 형식 검증 (YYYY년 MM월 DD일(요일) 형식)
  expect(timeText).toMatch(/^\d{4}년 \d{1,2}월 \d{1,2}일\([월화수목금토일]\)/);
  
  // 9. 인사말 확인 (Hi, 형식)
  const greetingElement = await page.locator('text=Hi,').first();
  await expect(greetingElement).toBeVisible();
  console.log('✅ 인사말 "Hi," 확인');
  
  // 10. AM/PM 형식 확인
  expect(timeText).toMatch(/[AP]M\d{2}:\d{2}:\d{2}/);
  console.log('✅ AM/PM 시간 형식 확인');
  
  // 11. 스크린샷 캡처
  await page.screenshot({ path: 'time-format-test.png', fullPage: true });
  console.log('✅ 시간 형식 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 시간 형식 및 인사말 수정 확인 테스트 완료!');
});
