import { test, expect } from '@playwright/test';

test('로컬 서버 상태 확인', async ({ page }) => {
  console.log('🔍 로컬 서버 상태 확인 시작');
  
  // 로컬 서버로 이동
  await page.goto('http://localhost:3000');
  console.log('✅ 페이지 로드 완료');
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('📄 페이지 제목:', title);
  
  // 스크린샷 캡처
  await page.screenshot({ path: 'local-server-status.png', fullPage: true });
  console.log('📸 스크린샷 캡처 완료');
  
  // 페이지 내용 확인
  const content = await page.content();
  console.log('📝 페이지 내용 길이:', content.length);
  
  // 로그인 폼 요소 확인
  const inputs = await page.locator('input').count();
  console.log('🔢 입력 필드 개수:', inputs);
  
  if (inputs > 0) {
    const inputTypes = await page.locator('input').all();
    for (let i = 0; i < inputTypes.length; i++) {
      const type = await inputTypes[i].getAttribute('type');
      const placeholder = await inputTypes[i].getAttribute('placeholder');
      console.log(`📥 입력 필드 ${i + 1}: type=${type}, placeholder=${placeholder}`);
    }
  }
  
  console.log('🎉 로컬 서버 상태 확인 완료!');
});
