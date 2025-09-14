import { test, expect } from '@playwright/test';

test.describe('출근 체크 디버그 테스트', () => {
  test('김탁수 출근 체크 후 콘솔 로그 확인', async ({ page }) => {
    console.log('🚀 김탁수 출근 체크 디버그 테스트 시작...');

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
    await page.waitForTimeout(5000); // 더 긴 대기 시간
    
    // 3. 콘솔 로그에서 attendance 관련 메시지 찾기
    console.log('\n🔍 콘솔 로그 분석...');
    const attendanceLogs = consoleMessages.filter(msg => 
      msg.includes('attendance') || 
      msg.includes('출근') || 
      msg.includes('체크') ||
      msg.includes('데이터') ||
      msg.includes('조회')
    );
    
    console.log('📊 attendance 관련 콘솔 로그:');
    attendanceLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    // 4. 현재 출근 상태 확인
    console.log('\n🔍 현재 출근 상태 확인...');
    
    // 출근 체크 버튼 상태 확인
    const checkInButton = page.locator('button:has-text("출근 체크")').first();
    const checkOutButton = page.locator('button:has-text("퇴근 체크")').first();
    
    if (await checkInButton.isVisible()) {
      console.log('❌ 출근 체크 버튼이 보입니다 (상태가 리셋됨)');
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 퇴근 체크 버튼이 보입니다 (상태 유지됨)');
    } else {
      console.log('❌ 출근/퇴근 버튼을 찾을 수 없습니다');
    }
    
    // 5. 페이지 소스에서 출근 시간 정보 찾기
    console.log('\n🔍 페이지 소스에서 출근 시간 정보 찾기...');
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('01:25') || pageContent.includes('출근')) {
      console.log('✅ 페이지에 출근 시간 정보가 있습니다');
    } else {
      console.log('❌ 페이지에 출근 시간 정보가 없습니다');
    }
    
    // 6. 네트워크 요청 확인
    console.log('\n🔍 네트워크 요청 확인...');
    const requests = await page.evaluate(() => {
      return (window as any).__networkRequests || [];
    });
    
    console.log(`📊 네트워크 요청 수: ${requests.length}`);
    
    // 7. localStorage 확인
    console.log('\n🔍 localStorage 확인...');
    const localStorage = await page.evaluate(() => {
      return {
        isLoggedIn: window.localStorage.getItem('isLoggedIn'),
        currentEmployee: window.localStorage.getItem('currentEmployee')
      };
    });
    
    console.log('📊 localStorage 상태:');
    console.log(`   isLoggedIn: ${localStorage.isLoggedIn}`);
    console.log(`   currentEmployee: ${localStorage.currentEmployee ? '있음' : '없음'}`);
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-debug-test.png' });
    console.log('📸 디버그 테스트 결과 스크린샷 저장');
    
    console.log('\n🎯 디버그 테스트 완료!');
    console.log('='.repeat(50));
    console.log('✅ 콘솔 로그 수집 완료');
    console.log('✅ 출근 상태 확인 완료');
    console.log('✅ 네트워크 요청 확인 완료');
    console.log('✅ localStorage 확인 완료');
  });
});
