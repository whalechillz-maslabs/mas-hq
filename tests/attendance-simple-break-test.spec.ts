import { test, expect } from '@playwright/test';

test('출근 관리 휴식 기능 간단 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 출근 관리 휴식 기능 간단 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 기본 정보 확인
  console.log('=== 1. 기본 정보 확인 ===');
  
  // 페이지 제목 확인
  const pageTitle = await page.locator('h1').textContent();
  console.log('페이지 제목:', pageTitle);
  
  // 현재 시간 확인
  const currentTime = await page.locator('text=현재 시간').locator('..').locator('p').last().textContent();
  console.log('현재 시간:', currentTime);
  
  // 2. 휴식 시작 버튼 확인
  console.log('=== 2. 휴식 시작 버튼 확인 ===');
  
  const breakStartButton = page.locator('button:has-text("휴식 시작")');
  const buttonExists = await breakStartButton.count() > 0;
  console.log('휴식 시작 버튼 존재:', buttonExists);
  
  if (buttonExists) {
    // 버튼 정보 확인
    const buttonText = await breakStartButton.textContent();
    const buttonClass = await breakStartButton.getAttribute('class');
    const hasCoffeeIcon = await breakStartButton.locator('svg').count() > 0;
    
    console.log('✅ 휴식 시작 버튼 정보:');
    console.log('  - 텍스트:', buttonText);
    console.log('  - 클래스:', buttonClass);
    console.log('  - 커피 아이콘:', hasCoffeeIcon);
    
    // 버튼 클릭 전 스크린샷
    await page.screenshot({ path: 'playwright-report/attendance-before-break-simple.png' });
    console.log('✅ 휴식 시작 전 스크린샷 저장');
    
    // 휴식 시작 버튼 클릭
    console.log('휴식 시작 버튼 클릭...');
    await breakStartButton.click();
    
    // 상태 변경 대기
    await page.waitForTimeout(3000);
    
    // 휴식 시작 후 스크린샷
    await page.screenshot({ path: 'playwright-report/attendance-after-break-simple.png' });
    console.log('✅ 휴식 시작 후 스크린샷 저장');
    
    // 휴식 종료 버튼 확인
    const breakEndButton = page.locator('button:has-text("휴식 종료")');
    const breakEndButtonExists = await breakEndButton.count() > 0;
    console.log('휴식 종료 버튼 존재:', breakEndButtonExists);
    
    if (breakEndButtonExists) {
      console.log('✅ 휴식 종료 버튼 발견 - 휴식 기능 정상 작동!');
      
      // 휴식 종료 버튼 클릭
      console.log('휴식 종료 버튼 클릭...');
      await breakEndButton.click();
      
      // 상태 변경 대기
      await page.waitForTimeout(3000);
      
      // 휴식 종료 후 스크린샷
      await page.screenshot({ path: 'playwright-report/attendance-after-break-end-simple.png' });
      console.log('✅ 휴식 종료 후 스크린샷 저장');
    }
  }
  
  // 3. 퇴근 체크 버튼 확인
  console.log('=== 3. 퇴근 체크 버튼 확인 ===');
  
  const clockOutButton = page.locator('button:has-text("퇴근 체크")');
  const clockOutButtonExists = await clockOutButton.count() > 0;
  console.log('퇴근 체크 버튼 존재:', clockOutButtonExists);
  
  if (clockOutButtonExists) {
    // 버튼 정보 확인
    const buttonText = await clockOutButton.textContent();
    const buttonClass = await clockOutButton.getAttribute('class');
    const hasXIcon = await clockOutButton.locator('svg').count() > 0;
    
    console.log('✅ 퇴근 체크 버튼 정보:');
    console.log('  - 텍스트:', buttonText);
    console.log('  - 클래스:', buttonClass);
    console.log('  - X 아이콘:', hasXIcon);
    
    // 퇴근 체크 버튼 클릭
    console.log('퇴근 체크 버튼 클릭...');
    await clockOutButton.click();
    
    // 상태 변경 대기
    await page.waitForTimeout(3000);
    
    // 퇴근 후 스크린샷
    await page.screenshot({ path: 'playwright-report/attendance-after-clockout-simple.png' });
    console.log('✅ 퇴근 후 스크린샷 저장');
  }
  
  // 4. UI 정렬 확인
  console.log('=== 4. UI 정렬 확인 ===');
  
  // 모든 버튼의 아이콘과 텍스트 정렬 확인
  const allButtons = page.locator('button');
  const buttonCount = await allButtons.count();
  console.log('총 버튼 수:', buttonCount);
  
  for (let i = 0; i < buttonCount; i++) {
    const button = allButtons.nth(i);
    const buttonText = await button.textContent();
    const hasIcon = await button.locator('svg').count() > 0;
    
    console.log(`버튼 ${i + 1}: "${buttonText}" - 아이콘: ${hasIcon}`);
    
    if (hasIcon) {
      // 아이콘과 텍스트의 위치 관계 확인
      const icon = button.locator('svg').first();
      const iconBox = await icon.boundingBox();
      
      if (iconBox) {
        console.log(`  - 아이콘 위치: x=${iconBox.x}, y=${iconBox.y}`);
        console.log(`  - 아이콘 크기: ${iconBox.width}x${iconBox.height}`);
      }
    }
  }
  
  // 5. 최종 스크린샷 저장
  console.log('=== 5. 최종 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/attendance-final-simple.png', fullPage: true });
  console.log('✅ 최종 상태 스크린샷 저장');
  
  console.log('=== 출근 관리 휴식 기능 간단 테스트 완료 ===');
});
