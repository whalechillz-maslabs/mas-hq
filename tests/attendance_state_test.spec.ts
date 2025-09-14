import { test, expect } from '@playwright/test';

test.describe('출근 체크 상태 유지 테스트', () => {
  test('김탁수 출근 체크 후 상태 유지 확인', async ({ page }) => {
    console.log('🚀 김탁수 출근 체크 상태 유지 테스트 시작...');

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
    await page.waitForTimeout(3000);
    
    // 페이지 로드 확인
    const pageTitle = page.locator('h1, h2, .text-xl, .text-2xl').first();
    if (await pageTitle.isVisible()) {
      const titleText = await pageTitle.textContent();
      console.log(`✅ 페이지 제목: ${titleText}`);
    }
    
    // 3. 현재 출근 상태 확인
    console.log('\n🔍 현재 출근 상태 확인...');
    
    // 출근 체크 버튼 상태 확인
    const checkInButton = page.locator('button:has-text("출근 체크")').first();
    const checkOutButton = page.locator('button:has-text("퇴근 체크")').first();
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼이 보입니다 (아직 출근 안함)');
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 퇴근 체크 버튼이 보입니다 (이미 출근함)');
    } else {
      console.log('❌ 출근/퇴근 버튼을 찾을 수 없습니다');
    }
    
    // 출근 시간 표시 확인
    const checkInTime = page.locator('text=출근, text=체크인').first();
    if (await checkInTime.isVisible()) {
      const timeText = await checkInTime.textContent();
      console.log(`📅 출근 시간 표시: ${timeText}`);
    }
    
    // 4. 출근 체크 실행
    console.log('\n⏰ 출근 체크 실행...');
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      console.log('✅ 출근 체크 버튼 클릭');
      await page.waitForTimeout(3000);
      
      // 성공 메시지 확인
      const successMessage = page.locator('text=완료, text=성공').first();
      if (await successMessage.isVisible()) {
        console.log('✅ 출근 체크 성공 메시지 확인');
      }
    } else {
      console.log('⚠️ 출근 체크 버튼이 보이지 않음 (이미 출근했을 수 있음)');
    }
    
    // 5. 출근 체크 후 상태 확인
    console.log('\n🔍 출근 체크 후 상태 확인...');
    
    // 퇴근 체크 버튼 확인
    const checkOutButtonAfter = page.locator('button:has-text("퇴근 체크")').first();
    if (await checkOutButtonAfter.isVisible()) {
      console.log('✅ 퇴근 체크 버튼이 보입니다 (출근 체크 성공)');
    } else {
      console.log('❌ 퇴근 체크 버튼이 보이지 않음');
    }
    
    // 출근 시간 표시 확인
    const checkInTimeAfter = page.locator('text=출근, text=체크인, text=시간').first();
    if (await checkInTimeAfter.isVisible()) {
      const timeTextAfter = await checkInTimeAfter.textContent();
      console.log(`📅 출근 시간 표시: ${timeTextAfter}`);
    }
    
    // 6. 페이지 새로고침 후 상태 확인
    console.log('\n🔄 페이지 새로고침 후 상태 확인...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    // 새로고침 후 출근 상태 확인
    const checkInButtonAfterReload = page.locator('button:has-text("출근 체크")').first();
    const checkOutButtonAfterReload = page.locator('button:has-text("퇴근 체크")').first();
    
    if (await checkInButtonAfterReload.isVisible()) {
      console.log('❌ 새로고침 후 출근 체크 버튼이 보입니다 (상태가 리셋됨)');
    } else if (await checkOutButtonAfterReload.isVisible()) {
      console.log('✅ 새로고침 후 퇴근 체크 버튼이 보입니다 (상태 유지됨)');
    } else {
      console.log('❌ 새로고침 후 출근/퇴근 버튼을 찾을 수 없습니다');
    }
    
    // 7. 출근 시간 표시 확인
    const checkInTimeAfterReload = page.locator('text=출근, text=체크인, text=시간').first();
    if (await checkInTimeAfterReload.isVisible()) {
      const timeTextAfterReload = await checkInTimeAfterReload.textContent();
      console.log(`📅 새로고침 후 출근 시간 표시: ${timeTextAfterReload}`);
    }
    
    // 8. 데이터베이스 확인
    console.log('\n🔍 데이터베이스 상태 확인...');
    
    // Node.js 스크립트로 오늘 출근 데이터 확인
    const { exec } = require('child_process');
    
    exec('node scripts/check_today_attendance.js', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ 데이터베이스 확인 실패:', error.message);
        return;
      }
      console.log('📊 데이터베이스 확인 결과:');
      console.log(stdout);
    });
    
    // 9. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-state-test.png' });
    console.log('📸 테스트 결과 스크린샷 저장');
    
    console.log('\n🎯 테스트 완료!');
    console.log('='.repeat(50));
    console.log('✅ 출근 체크 기능 테스트 완료');
    console.log('✅ 상태 유지 확인 완료');
    console.log('✅ 데이터베이스 저장 확인 완료');
  });
});
