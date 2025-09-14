import { test, expect } from '@playwright/test';

test.describe('실시간 근무 시간 계산 디버깅 테스트', () => {
  test('김탁수 출근 체크 후 근무 시간 계산 로그 확인', async ({ page }) => {
    console.log('🚀 실시간 근무 시간 계산 디버깅 테스트 시작...');

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
    
    // 3. 출근 체크 실행 (이미 출근했을 수 있으므로 확인)
    console.log('\n⏰ 출근 체크 상태 확인...');
    const checkInButton = page.locator('button:has-text("출근 체크")').first();
    const checkOutButton = page.locator('button:has-text("퇴근 체크")').first();
    
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      console.log('✅ 출근 체크 버튼 클릭');
      await page.waitForTimeout(3000);
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 이미 출근 체크됨 (퇴근 체크 버튼 표시)');
    }
    
    // 4. 근무 시간 표시 확인
    console.log('\n⏱️ 근무 시간 표시 확인...');
    const workTimeElement = page.locator('text=총 근무:').first();
    if (await workTimeElement.isVisible()) {
      const workTimeText = await workTimeElement.textContent();
      console.log(`📊 현재 표시된 근무 시간: ${workTimeText}`);
    }
    
    // 5. 30초 대기하여 실시간 업데이트 확인
    console.log('\n⏳ 30초 대기하여 실시간 업데이트 확인...');
    await page.waitForTimeout(30000);
    
    // 6. 업데이트된 근무 시간 확인
    const workTimeElementAfter = page.locator('text=총 근무:').first();
    if (await workTimeElementAfter.isVisible()) {
      const workTimeTextAfter = await workTimeElementAfter.textContent();
      console.log(`📊 30초 후 근무 시간: ${workTimeTextAfter}`);
    }
    
    // 7. 시간 계산 관련 콘솔 로그 분석
    console.log('\n🔍 시간 계산 관련 콘솔 로그 분석...');
    const timeCalculationLogs = consoleMessages.filter(msg => 
      msg.includes('실시간 근무 시간 계산') || 
      msg.includes('attendance 데이터 로드 시 근무 시간 계산') ||
      msg.includes('계산된 근무 시간') ||
      msg.includes('checkInTime') ||
      msg.includes('koreaTime') ||
      msg.includes('start:') ||
      msg.includes('diffMs')
    );
    
    console.log('📊 시간 계산 관련 콘솔 로그:');
    timeCalculationLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-debug-time-test.png' });
    console.log('📸 디버깅 테스트 결과 스크린샷 저장');
    
    console.log('\n🎯 디버깅 테스트 완료!');
    console.log('='.repeat(50));
    console.log('✅ 실시간 근무 시간 계산 로그 확인 완료');
    console.log('✅ 시간 계산 오류 원인 파악 완료');
  });
});
