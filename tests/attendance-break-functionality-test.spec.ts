import { test, expect } from '@playwright/test';

test('출근 관리 휴식 기능 및 UI 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 출근 관리 휴식 기능 및 UI 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 초기 상태 확인
  console.log('=== 1. 초기 상태 확인 ===');
  
  // 현재 상태 확인 (더 정확한 선택자 사용)
  const statusContainer = page.locator('text=현재 상태:').locator('..');
  const currentStatus = await statusContainer.locator('span.bg-green-100').textContent();
  console.log('현재 상태:', currentStatus);
  
  // 출근 시간 확인 (첫 번째 요소만 선택)
  const clockInTime = await page.locator('text=출근:').first().textContent();
  console.log('출근 시간:', clockInTime);
  
  // 2. 휴식 시작 버튼 테스트
  console.log('=== 2. 휴식 시작 버튼 테스트 ===');
  
  // 휴식 시작 버튼 찾기
  const breakStartButton = page.locator('button:has-text("휴식 시작")');
  const buttonExists = await breakStartButton.count() > 0;
  console.log('휴식 시작 버튼 존재:', buttonExists);
  
  if (buttonExists) {
    // 버튼 스타일 및 아이콘 확인
    const buttonText = await breakStartButton.textContent();
    const buttonClass = await breakStartButton.getAttribute('class');
    const hasCoffeeIcon = await breakStartButton.locator('svg').count() > 0;
    
    console.log('버튼 텍스트:', buttonText);
    console.log('버튼 클래스:', buttonClass);
    console.log('커피 아이콘 존재:', hasCoffeeIcon);
    
    // 버튼 클릭 전 스크린샷
    await page.screenshot({ path: 'playwright-report/attendance-before-break.png' });
    console.log('✅ 휴식 시작 전 스크린샷 저장');
    
    // 휴식 시작 버튼 클릭
    console.log('휴식 시작 버튼 클릭...');
    await breakStartButton.click();
    
    // 상태 변경 대기
    await page.waitForTimeout(2000);
    
    // 휴식 시작 후 상태 확인
    const afterBreakStatus = await statusContainer.locator('span').last().textContent();
    console.log('휴식 시작 후 상태:', afterBreakStatus);
    
    // 휴식 시작 후 스크린샷
    await page.screenshot({ path: 'playwright-report/attendance-after-break-start.png' });
    console.log('✅ 휴식 시작 후 스크린샷 저장');
    
    // 휴식 시작 시간 확인 (옵셔널)
    try {
      const breakStartTime = await page.locator('text=휴식 시작:').first().textContent();
      console.log('휴식 시작 시간:', breakStartTime);
    } catch (error) {
      console.log('휴식 시작 시간 텍스트가 표시되지 않음 (정상)');
    }
    
    // 휴식 종료 버튼 확인
    const breakEndButton = page.locator('button:has-text("휴식 종료")');
    const breakEndButtonExists = await breakEndButton.count() > 0;
    console.log('휴식 종료 버튼 존재:', breakEndButtonExists);
    
    if (breakEndButtonExists) {
      // 휴식 종료 버튼 클릭
      console.log('휴식 종료 버튼 클릭...');
      await breakEndButton.click();
      
      // 상태 변경 대기
      await page.waitForTimeout(2000);
      
      // 휴식 종료 후 상태 확인
      const afterBreakEndStatus = await statusContainer.locator('span').last().textContent();
      console.log('휴식 종료 후 상태:', afterBreakEndStatus);
      
      // 휴식 종료 후 스크린샷
      await page.screenshot({ path: 'playwright-report/attendance-after-break-end.png' });
      console.log('✅ 휴식 종료 후 스크린샷 저장');
    }
  }
  
  // 3. 퇴근 체크 버튼 테스트
  console.log('=== 3. 퇴근 체크 버튼 테스트 ===');
  
  const clockOutButton = page.locator('button:has-text("퇴근 체크")');
  const clockOutButtonExists = await clockOutButton.count() > 0;
  console.log('퇴근 체크 버튼 존재:', clockOutButtonExists);
  
  if (clockOutButtonExists) {
    // 버튼 스타일 및 아이콘 확인
    const buttonText = await clockOutButton.textContent();
    const buttonClass = await clockOutButton.getAttribute('class');
    const hasXIcon = await clockOutButton.locator('svg').count() > 0;
    
    console.log('퇴근 버튼 텍스트:', buttonText);
    console.log('퇴근 버튼 클래스:', buttonClass);
    console.log('X 아이콘 존재:', hasXIcon);
    
    // 퇴근 체크 버튼 클릭
    console.log('퇴근 체크 버튼 클릭...');
    await clockOutButton.click();
    
    // 상태 변경 대기
    await page.waitForTimeout(2000);
    
    // 퇴근 후 상태 확인
    const afterClockOutStatus = await statusContainer.locator('span').last().textContent();
    console.log('퇴근 후 상태:', afterClockOutStatus);
    
    // 퇴근 후 스크린샷
    await page.screenshot({ path: 'playwright-report/attendance-after-clockout.png' });
    console.log('✅ 퇴근 후 스크린샷 저장');
  }
  
  // 4. UI 요소 정렬 및 스타일 테스트
  console.log('=== 4. UI 요소 정렬 및 스타일 테스트 ===');
  
  // 모든 버튼의 아이콘과 텍스트 정렬 확인
  const allButtons = page.locator('button');
  const buttonCount = await allButtons.count();
  console.log('총 버튼 수:', buttonCount);
  
  for (let i = 0; i < buttonCount; i++) {
    const button = allButtons.nth(i);
    const buttonText = await button.textContent();
    const buttonClass = await button.getAttribute('class');
    
    // 아이콘과 텍스트의 정렬 상태 확인
    const icon = button.locator('svg');
    const hasIcon = await icon.count() > 0;
    
    if (hasIcon) {
      // 아이콘과 텍스트의 위치 관계 확인
      const iconBox = await icon.boundingBox();
      const textBox = await button.locator('text=' + buttonText?.replace(/[^a-zA-Z가-힣0-9]/g, '')).boundingBox();
      
      if (iconBox && textBox) {
        console.log(`버튼 ${i + 1} (${buttonText}):`);
        console.log(`  - 아이콘 위치: x=${iconBox.x}, y=${iconBox.y}`);
        console.log(`  - 텍스트 위치: x=${textBox.x}, y=${textBox.y}`);
        console.log(`  - 아이콘-텍스트 간격: ${textBox.x - (iconBox.x + iconBox.width)}px`);
      }
    }
    
    console.log(`버튼 ${i + 1}: "${buttonText}" - 클래스: ${buttonClass} - 아이콘: ${hasIcon}`);
  }
  
  // 5. 근무 요약 카드 정렬 확인
  console.log('=== 5. 근무 요약 카드 정렬 확인 ===');
  
  const summaryCards = page.locator('text=오늘 근무 요약').locator('..').locator('.grid > div');
  const cardCount = await summaryCards.count();
  console.log('근무 요약 카드 수:', cardCount);
  
  for (let i = 0; i < cardCount; i++) {
    const card = summaryCards.nth(i);
    const cardText = await card.textContent();
    console.log(`카드 ${i + 1}: ${cardText}`);
    
    // 카드 내부 요소들의 정렬 확인
    const valueElement = card.locator('.text-2xl');
    const labelElement = card.locator('.text-sm');
    
    if (await valueElement.count() > 0 && await labelElement.count() > 0) {
      const valueText = await valueElement.textContent();
      const labelText = await labelElement.textContent();
      console.log(`  - 값: ${valueText}`);
      console.log(`  - 라벨: ${labelText}`);
    }
  }
  
  // 6. 최종 상태 확인
  console.log('=== 6. 최종 상태 확인 ===');
  
  // 현재 시간 확인
  const currentTime = await page.locator('text=현재 시간').locator('..').locator('p').last().textContent();
  console.log('최종 현재 시간:', currentTime);
  
  // 디버깅 정보 확인
  const debugInfo = await page.locator('text=디버깅 정보').locator('..').textContent();
  console.log('디버깅 정보:', debugInfo);
  
  // 7. 최종 스크린샷 저장
  console.log('=== 7. 최종 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/attendance-final-state.png', fullPage: true });
  console.log('✅ 최종 상태 스크린샷 저장');
  
  console.log('=== 출근 관리 휴식 기능 및 UI 테스트 완료 ===');
});
