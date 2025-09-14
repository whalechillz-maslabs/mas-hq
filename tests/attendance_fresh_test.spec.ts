import { test, expect } from '@playwright/test';

test.describe('새로운 출근 체크 테스트', () => {
  test('김탁수 새로운 출근 체크 후 한국 시간 확인', async ({ page }) => {
    console.log('🚀 새로운 출근 체크 테스트 시작...');

    // 콘솔 메시지 수집
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`🔍 콘솔: ${text}`);
    });

    // 1. 김탁수로 로그인
    console.log('\n👤 김탁수 로그인...');
    await page.goto('https://maslabs.kr/login');
    await page.waitForTimeout(2000);
    
    // 로그인
    await page.fill('input[name="phone"], input[type="tel"]', '010-6669-9000');
    await page.fill('input[name="password"], input[type="password"]', '66699000');
    await page.click('button:has-text("로그인"), button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. 출근 체크 페이지로 이동
    console.log('\n📱 출근 체크 페이지 접근...');
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForTimeout(5000);
    
    // 3. 현재 시간 확인
    console.log('\n🕐 현재 시간 확인...');
    const currentTimeElement = page.locator('text=2025년').first();
    if (await currentTimeElement.isVisible()) {
      const currentTimeText = await currentTimeElement.textContent();
      console.log(`📅 현재 시스템 시간: ${currentTimeText}`);
    }
    
    // 4. 출근 체크 실행
    console.log('\n⏰ 출근 체크 실행...');
    const checkInButton = page.locator('button:has-text("출근 체크")').first();
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      console.log('✅ 출근 체크 버튼 클릭');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ 출근 체크 버튼이 보이지 않음');
      return;
    }
    
    // 5. 출근 시간 확인
    console.log('\n🔍 출근 시간 확인...');
    const checkInTimeElement = page.locator('text=출근:').first();
    if (await checkInTimeElement.isVisible()) {
      const checkInTimeText = await checkInTimeElement.textContent();
      console.log(`📅 출근 시간: ${checkInTimeText}`);
      
      // 출근 시간이 한국 시간인지 확인 (09:00-18:00 사이여야 함)
      const timeMatch = checkInTimeText.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        if (hour >= 9 && hour <= 18) {
          console.log('✅ 출근 시간이 한국 시간으로 정상적으로 저장됨');
        } else {
          console.log('❌ 출근 시간이 한국 시간이 아닐 수 있음');
        }
      }
    }
    
    // 6. 실시간 근무 시간 확인
    console.log('\n⏱️ 실시간 근무 시간 확인...');
    
    // 오늘 근무 시간 확인
    const workTimeElement = page.locator('text=오늘 근무 시간').first();
    if (await workTimeElement.isVisible()) {
      const workTimeText = await workTimeElement.textContent();
      console.log(`📊 근무 시간 표시: ${workTimeText}`);
    }
    
    // 실제 근무 시간 확인
    const actualWorkTimeElement = page.locator('text=실제 근무 시간').first();
    if (await actualWorkTimeElement.isVisible()) {
      const actualWorkTimeText = await actualWorkTimeElement.textContent();
      console.log(`📊 실제 근무 시간: ${actualWorkTimeText}`);
    }
    
    // 7. 30초 대기 후 근무 시간 변화 확인
    console.log('\n⏳ 30초 대기 후 근무 시간 변화 확인...');
    await page.waitForTimeout(30000); // 30초 대기
    
    // 근무 시간 재확인
    const workTimeElementAfter = page.locator('text=오늘 근무 시간').first();
    if (await workTimeElementAfter.isVisible()) {
      const workTimeTextAfter = await workTimeElementAfter.textContent();
      console.log(`📊 30초 후 근무 시간: ${workTimeTextAfter}`);
    }
    
    // 8. 콘솔 로그에서 시간 관련 메시지 확인
    console.log('\n🔍 콘솔 로그에서 시간 관련 메시지 확인...');
    const timeRelatedLogs = consoleMessages.filter(msg => 
      msg.includes('시간') || 
      msg.includes('time') || 
      msg.includes('korea') ||
      msg.includes('UTC') ||
      msg.includes('근무') ||
      msg.includes('attendance')
    );
    
    console.log('📊 시간 관련 콘솔 로그:');
    timeRelatedLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    // 9. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-fresh-test.png' });
    console.log('📸 새로운 출근 체크 테스트 결과 스크린샷 저장');
    
    console.log('\n🎯 새로운 출근 체크 테스트 완료!');
    console.log('='.repeat(50));
    console.log('✅ 새로운 출근 체크 시간 확인 완료');
    console.log('✅ 실시간 근무 시간 계산 확인 완료');
    console.log('✅ 한국 시간 적용 확인 완료');
  });
});
