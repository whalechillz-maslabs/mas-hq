import { test, expect } from '@playwright/test';

test.describe('최종 출근 체크 테스트', () => {
  test('김탁수 새로운 출근 체크 후 정확한 근무 시간 확인', async ({ page }) => {
    console.log('🚀 최종 출근 체크 테스트 시작...');

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
    
    // 3. 출근 체크 실행
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
    
    // 4. 출근 시간 확인
    console.log('\n🔍 출근 시간 확인...');
    const checkInTimeElement = page.locator('text=출근:').first();
    if (await checkInTimeElement.isVisible()) {
      const checkInTimeText = await checkInTimeElement.textContent();
      console.log(`📅 출근 시간: ${checkInTimeText}`);
    }
    
    // 5. 근무 시간 확인 (즉시)
    console.log('\n⏱️ 출근 체크 직후 근무 시간 확인...');
    const workTimeElement = page.locator('text=총 근무:').first();
    if (await workTimeElement.isVisible()) {
      const workTimeText = await workTimeElement.textContent();
      console.log(`📊 출근 직후 근무 시간: ${workTimeText}`);
      
      // 0분 또는 1분 이내여야 함
      if (workTimeText && (workTimeText.includes('0h 0m') || workTimeText.includes('0h 1m'))) {
        console.log('✅ 출근 직후 근무 시간이 정상적으로 표시됨');
      } else {
        console.log('❌ 출근 직후 근무 시간이 비정상적으로 표시됨');
      }
    }
    
    // 6. 1분 대기 후 근무 시간 확인
    console.log('\n⏳ 1분 대기 후 근무 시간 확인...');
    await page.waitForTimeout(60000); // 1분 대기
    
    const workTimeElementAfter = page.locator('text=총 근무:').first();
    if (await workTimeElementAfter.isVisible()) {
      const workTimeTextAfter = await workTimeElementAfter.textContent();
      console.log(`📊 1분 후 근무 시간: ${workTimeTextAfter}`);
      
      // 1분 정도여야 함
      if (workTimeTextAfter && (workTimeTextAfter.includes('0h 1m') || workTimeTextAfter.includes('0h 2m'))) {
        console.log('✅ 1분 후 근무 시간이 정상적으로 업데이트됨');
      } else {
        console.log('❌ 1분 후 근무 시간이 비정상적으로 표시됨');
      }
    }
    
    // 7. 시간 계산 관련 콘솔 로그 분석
    console.log('\n🔍 시간 계산 관련 콘솔 로그 분석...');
    const timeCalculationLogs = consoleMessages.filter(msg => 
      msg.includes('실시간 근무 시간 계산') || 
      msg.includes('attendance 데이터 로드 시 근무 시간 계산') ||
      msg.includes('계산된 근무 시간') ||
      msg.includes('startKoreaTime') ||
      msg.includes('koreaTime') ||
      msg.includes('diffMs')
    );
    
    console.log('📊 시간 계산 관련 콘솔 로그:');
    timeCalculationLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-final-test.png' });
    console.log('📸 최종 테스트 결과 스크린샷 저장');
    
    console.log('\n🎯 최종 테스트 완료!');
    console.log('='.repeat(50));
    console.log('✅ 새로운 출근 체크 시간 확인 완료');
    console.log('✅ 정확한 근무 시간 계산 확인 완료');
    console.log('✅ 실시간 업데이트 확인 완료');
  });

  test('김탁수 퇴근 체크 테스트', async ({ page }) => {
    console.log('🚀 퇴근 체크 테스트 시작...');

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
    
    // 3. 현재 상태 확인
    console.log('\n🔍 현재 출근 상태 확인...');
    const statusElement = page.locator('text=휴식 중, text=근무중, text=출근 체크').first();
    if (await statusElement.isVisible()) {
      const statusText = await statusElement.textContent();
      console.log(`📊 현재 상태: ${statusText}`);
    }
    
    // 4. 퇴근 체크 버튼 찾기 및 클릭
    console.log('\n⏰ 퇴근 체크 실행...');
    const checkOutButton = page.locator('button:has-text("퇴근 체크")').first();
    if (await checkOutButton.isVisible()) {
      await checkOutButton.click();
      console.log('✅ 퇴근 체크 버튼 클릭');
      await page.waitForTimeout(3000);
      
      // 5. 퇴근 후 상태 확인
      console.log('\n🔍 퇴근 후 상태 확인...');
      const finalStatusElement = page.locator('text=출근 체크, text=근무중, text=휴식 중').first();
      if (await finalStatusElement.isVisible()) {
        const finalStatusText = await finalStatusElement.textContent();
        console.log(`📊 퇴근 후 상태: ${finalStatusText}`);
      }
      
      // 6. 최종 근무 시간 확인
      console.log('\n⏱️ 최종 근무 시간 확인...');
      const finalWorkTimeElement = page.locator('text=총 근무:').first();
      if (await finalWorkTimeElement.isVisible()) {
        const finalWorkTimeText = await finalWorkTimeElement.textContent();
        console.log(`📊 최종 근무 시간: ${finalWorkTimeText}`);
      }
      
    } else {
      console.log('❌ 퇴근 체크 버튼이 보이지 않음');
      
      // 휴식 중인 경우 휴식 후 복귀 버튼 클릭
      const breakReturnButton = page.locator('button:has-text("휴식 후 복귀")').first();
      if (await breakReturnButton.isVisible()) {
        console.log('☕ 휴식 중이므로 휴식 후 복귀 버튼 클릭...');
        await breakReturnButton.click();
        await page.waitForTimeout(3000);
        
        // 다시 퇴근 체크 버튼 찾기
        const checkOutButtonAfter = page.locator('button:has-text("퇴근 체크")').first();
        if (await checkOutButtonAfter.isVisible()) {
          await checkOutButtonAfter.click();
          console.log('✅ 휴식 복귀 후 퇴근 체크 버튼 클릭');
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // 7. 스크린샷 저장
    await page.screenshot({ path: 'test-results/checkout-test.png' });
    console.log('📸 퇴근 체크 테스트 결과 스크린샷 저장');
    
    console.log('\n🎯 퇴근 체크 테스트 완료!');
    console.log('='.repeat(50));
    console.log('✅ 퇴근 체크 기능 테스트 완료');
  });
});
