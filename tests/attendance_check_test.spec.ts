import { test, expect } from '@playwright/test';

test.describe('출근 체크 문제 해결 테스트', () => {
  test('김탁수 출근 체크 - 스케줄 없을 때 시간 계산 문제 테스트', async ({ page }) => {
    console.log('🔍 김탁수 출근 체크 테스트 시작...');
    
    // 1. 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    await page.waitForLoadState('networkidle');

    // 2. 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForTimeout(5000);
    
    const loginUrl = page.url();
    console.log('📍 로그인 후 URL:', loginUrl);
    
    if (loginUrl.includes('/login')) {
      console.log('❌ 로그인 실패');
      return;
    }

    // 3. 출근 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');

    // 4. 현재 상태 확인
    const pageContent = await page.textContent('body');
    console.log('📄 출근 페이지 내용 확인:', pageContent?.includes('출근'));

    // 5. 오늘 근무 요약 확인
    const workSummary = page.locator('text=오늘 근무 요약');
    if (await workSummary.isVisible()) {
      console.log('✅ 오늘 근무 요약 섹션 발견');
      
      // 스케줄 시간 확인
      const scheduleTime = page.locator('text=스케줄 시간').locator('..').locator('text=0h 0m');
      if (await scheduleTime.isVisible()) {
        console.log('✅ 스케줄 시간이 0h 0m으로 표시됨 (예상됨)');
      }
      
      // 실제 근무 시간 확인
      const actualWorkTime = page.locator('text=실제 근무 시간').locator('..');
      const actualWorkTimeText = await actualWorkTime.textContent();
      console.log('📍 실제 근무 시간:', actualWorkTimeText);
      
      // 음수 시간 확인
      if (actualWorkTimeText && actualWorkTimeText.includes('-')) {
        console.log('❌ 음수 시간 발견:', actualWorkTimeText);
      } else {
        console.log('✅ 음수 시간 없음');
      }
    }

    // 6. 출근 체크 버튼 상태 확인
    const checkInButton = page.locator('button:has-text("출근 체크")');
    const checkOutButton = page.locator('button:has-text("퇴근 체크")');
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼 사용 가능');
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 이미 출근한 상태 - 퇴근 체크 버튼 사용 가능');
    } else {
      console.log('⚠️ 출근/퇴근 버튼을 찾을 수 없음');
    }

    console.log('✅ 김탁수 출근 체크 테스트 완료!');
  });

  test('허상원 출근 체크 - 스케줄 있을 때 테스트', async ({ page }) => {
    console.log('🔍 허상원 출근 체크 테스트 시작...');
    
    // 1. 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    await page.waitForLoadState('networkidle');

    // 2. 허상원 계정으로 로그인 (전화번호 확인 필요)
    await page.fill('input[name="phone"]', '010-8948-4501');
    await page.fill('input[name="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForTimeout(5000);
    
    const loginUrl = page.url();
    console.log('📍 로그인 후 URL:', loginUrl);
    
    if (loginUrl.includes('/login')) {
      console.log('❌ 로그인 실패');
      return;
    }

    // 3. 출근 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');

    // 4. 현재 상태 확인
    const pageContent = await page.textContent('body');
    console.log('📄 출근 페이지 내용 확인:', pageContent?.includes('출근'));

    // 5. 오늘 근무 요약 확인
    const workSummary = page.locator('text=오늘 근무 요약');
    if (await workSummary.isVisible()) {
      console.log('✅ 오늘 근무 요약 섹션 발견');
      
      // 스케줄 시간 확인
      const scheduleTime = page.locator('text=스케줄 시간').locator('..');
      const scheduleTimeText = await scheduleTime.textContent();
      console.log('📍 스케줄 시간:', scheduleTimeText);
      
      // 실제 근무 시간 확인
      const actualWorkTime = page.locator('text=실제 근무 시간').locator('..');
      const actualWorkTimeText = await actualWorkTime.textContent();
      console.log('📍 실제 근무 시간:', actualWorkTimeText);
    }

    // 6. 출근 체크 버튼 상태 확인
    const checkInButton = page.locator('button:has-text("출근 체크")');
    const checkOutButton = page.locator('button:has-text("퇴근 체크")');
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼 사용 가능');
      
      // 출근 체크 실행
      await checkInButton.click();
      await page.waitForTimeout(2000);
      
      // 출근 체크 완료 확인
      const successMessage = page.locator('text=출근 체크가 완료되었습니다!');
      if (await successMessage.isVisible()) {
        console.log('✅ 출근 체크 성공');
        await page.keyboard.press('Escape'); // 알림 창 닫기
      }
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 이미 출근한 상태 - 퇴근 체크 버튼 사용 가능');
    } else {
      console.log('⚠️ 출근/퇴근 버튼을 찾을 수 없음');
    }

    console.log('✅ 허상원 출근 체크 테스트 완료!');
  });

  test('최형호 출근 체크 - 스케줄 있을 때 테스트', async ({ page }) => {
    console.log('🔍 최형호 출근 체크 테스트 시작...');
    
    // 1. 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    await page.waitForLoadState('networkidle');

    // 2. 최형호 계정으로 로그인
    await page.fill('input[name="phone"]', '010-7128-4590');
    await page.fill('input[name="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForTimeout(5000);
    
    const loginUrl = page.url();
    console.log('📍 로그인 후 URL:', loginUrl);
    
    if (loginUrl.includes('/login')) {
      console.log('❌ 로그인 실패');
      return;
    }

    // 3. 출근 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');

    // 4. 현재 상태 확인
    const pageContent = await page.textContent('body');
    console.log('📄 출근 페이지 내용 확인:', pageContent?.includes('출근'));

    // 5. 오늘 근무 요약 확인
    const workSummary = page.locator('text=오늘 근무 요약');
    if (await workSummary.isVisible()) {
      console.log('✅ 오늘 근무 요약 섹션 발견');
      
      // 스케줄 시간 확인
      const scheduleTime = page.locator('text=스케줄 시간').locator('..');
      const scheduleTimeText = await scheduleTime.textContent();
      console.log('📍 스케줄 시간:', scheduleTimeText);
      
      // 실제 근무 시간 확인
      const actualWorkTime = page.locator('text=실제 근무 시간').locator('..');
      const actualWorkTimeText = await actualWorkTime.textContent();
      console.log('📍 실제 근무 시간:', actualWorkTimeText);
    }

    // 6. 출근 체크 버튼 상태 확인
    const checkInButton = page.locator('button:has-text("출근 체크")');
    const checkOutButton = page.locator('button:has-text("퇴근 체크")');
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼 사용 가능');
      
      // 출근 체크 실행
      await checkInButton.click();
      await page.waitForTimeout(2000);
      
      // 출근 체크 완료 확인
      const successMessage = page.locator('text=출근 체크가 완료되었습니다!');
      if (await successMessage.isVisible()) {
        console.log('✅ 출근 체크 성공');
        await page.keyboard.press('Escape'); // 알림 창 닫기
      }
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 이미 출근한 상태 - 퇴근 체크 버튼 사용 가능');
    } else {
      console.log('⚠️ 출근/퇴근 버튼을 찾을 수 없음');
    }

    console.log('✅ 최형호 출근 체크 테스트 완료!');
  });

  test('관리자 페이지에서 출근 기록 확인 테스트', async ({ page }) => {
    console.log('🔍 관리자 페이지 출근 기록 확인 테스트 시작...');
    
    // 1. 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    await page.waitForLoadState('networkidle');

    // 2. 관리자 계정으로 로그인 (김탁수)
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForTimeout(5000);
    
    const loginUrl = page.url();
    console.log('📍 로그인 후 URL:', loginUrl);
    
    if (loginUrl.includes('/login')) {
      console.log('❌ 로그인 실패');
      return;
    }

    // 3. 관리자 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');

    // 4. 김탁수 데이터 확인
    const kimRow = page.locator('tr:has-text("김탁수")');
    if (await kimRow.isVisible()) {
      console.log('✅ 김탁수 데이터 발견');
      
      // 스케줄 컬럼 확인
      const scheduleColumn = kimRow.locator('td:nth-child(2)');
      const scheduleText = await scheduleColumn.textContent();
      console.log('📍 김탁수 스케줄:', scheduleText);
      
      // 실제 출근 컬럼 확인
      const checkInColumn = kimRow.locator('td:nth-child(3)');
      const checkInText = await checkInColumn.textContent();
      console.log('📍 김탁수 실제 출근:', checkInText);
      
      // 근무 시간 컬럼 확인
      const workTimeColumn = kimRow.locator('td:nth-child(6)');
      const workTimeText = await workTimeColumn.textContent();
      console.log('📍 김탁수 근무 시간:', workTimeText);
    } else {
      console.log('⚠️ 김탁수 데이터를 찾을 수 없음');
    }

    // 5. 허상원 데이터 확인
    const heoRow = page.locator('tr:has-text("허상원")');
    if (await heoRow.isVisible()) {
      console.log('✅ 허상원 데이터 발견');
      
      // 스케줄 컬럼 확인
      const scheduleColumn = heoRow.locator('td:nth-child(2)');
      const scheduleText = await scheduleColumn.textContent();
      console.log('📍 허상원 스케줄:', scheduleText);
      
      // 실제 출근 컬럼 확인
      const checkInColumn = heoRow.locator('td:nth-child(3)');
      const checkInText = await checkInColumn.textContent();
      console.log('📍 허상원 실제 출근:', checkInText);
    } else {
      console.log('⚠️ 허상원 데이터를 찾을 수 없음');
    }

    // 6. 최형호 데이터 확인
    const choiRow = page.locator('tr:has-text("최형호")');
    if (await choiRow.isVisible()) {
      console.log('✅ 최형호 데이터 발견');
      
      // 스케줄 컬럼 확인
      const scheduleColumn = choiRow.locator('td:nth-child(2)');
      const scheduleText = await scheduleColumn.textContent();
      console.log('📍 최형호 스케줄:', scheduleText);
      
      // 실제 출근 컬럼 확인
      const checkInColumn = choiRow.locator('td:nth-child(3)');
      const checkInText = await checkInColumn.textContent();
      console.log('📍 최형호 실제 출근:', checkInText);
    } else {
      console.log('⚠️ 최형호 데이터를 찾을 수 없음');
    }

    console.log('✅ 관리자 페이지 출근 기록 확인 테스트 완료!');
  });
});
