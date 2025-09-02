import { test, expect } from '@playwright/test';

test.describe('근무 스케줄 데이터 문제 진단', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // 로그인 시도 (실패해도 계속 진행)
    try {
      const phoneInput = page.locator('input[placeholder="전화번호"], input[name="phone"]');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('01012345678');
        const passwordInput = page.locator('input[type="password"], input[placeholder="비밀번호"], input[name="password"]');
        await passwordInput.fill('testpassword');
        await page.click('button:has-text("로그인")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      console.log('로그인 실패, 게스트 상태로 진행');
    }
  });

  test('근무 스케줄 추가 기능 테스트', async ({ page }) => {
    // 관리자 페이지로 이동 시도
    try {
      const adminLinks = page.locator('text=관리자, text=Admin, text=직원 관리, text=스케줄 관리, a[href*="admin"]');
      if (await adminLinks.isVisible()) {
        await adminLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else {
        console.log('관리자 링크를 찾을 수 없음');
        return;
      }
    } catch (error) {
      console.log('관리자 페이지 접근 실패:', error);
      return;
    }
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'test-results/admin-schedule-page.png' });
    
    // 스케줄 추가 버튼 찾기
    const addButtons = page.locator('button:has-text("+"), button:has-text("추가"), button:has-text("등록")');
    if (await addButtons.isVisible()) {
      console.log('✅ 스케줄 추가 버튼 발견');
      
      // 첫 번째 추가 버튼 클릭
      await addButtons.first().click();
      await page.waitForTimeout(2000);
      
      // 추가 폼 확인
      const form = page.locator('form, input[type="date"], input[type="time"], select');
      if (await form.isVisible()) {
        console.log('✅ 스케줄 추가 폼 발견');
        
        // 폼 필드 확인
        const dateInput = page.locator('input[type="date"]');
        const timeInputs = page.locator('input[type="time"]');
        const employeeSelect = page.locator('select, input[placeholder*="직원"]');
        
        console.log('📅 날짜 입력 필드:', await dateInput.count());
        console.log('⏰ 시간 입력 필드:', await timeInputs.count());
        console.log('👤 직원 선택 필드:', await employeeSelect.count());
        
        // 폼 스크린샷
        await page.screenshot({ path: 'test-results/schedule-add-form.png' });
        
      } else {
        console.log('❌ 스케줄 추가 폼 없음');
      }
    } else {
      console.log('❌ 스케줄 추가 버튼을 찾을 수 없음');
    }
  });

  test('시간대별 근무자 현황 데이터 확인', async ({ page }) => {
    // 관리자 페이지로 이동
    try {
      const adminLinks = page.locator('text=관리자, text=Admin, text=직원 관리, text=스케줄 관리, a[href*="admin"]');
      if (await adminLinks.isVisible()) {
        await adminLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('관리자 페이지 접근 실패:', error);
      return;
    }
    
    // 전체 보기 모드로 전환
    const viewAllButton = page.locator('text=전체 보기, button:has-text("전체 보기")');
    if (await viewAllButton.isVisible()) {
      await viewAllButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log('✅ 전체 보기 모드로 전환');
    }
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'test-results/view-all-schedule.png' });
    
    // 스케줄 그리드 확인
    const scheduleGrid = page.locator('.schedule-grid, [class*="grid"], [class*="schedule"]');
    if (await scheduleGrid.isVisible()) {
      console.log('✅ 스케줄 그리드 발견');
      
      // 시간대별 데이터 확인
      const timeSlots = page.locator('[class*="time"], [class*="hour"], text=/[0-9]{1,2}:[0-9]{2}/');
      const scheduleCells = page.locator('[class*="schedule"], [class*="cell"], [class*="slot"]');
      
      console.log('⏰ 시간대 슬롯 수:', await timeSlots.count());
      console.log('📅 스케줄 셀 수:', await scheduleCells.count());
      
      // 데이터가 있는 셀 확인
      const filledCells = page.locator('text=/[가-힣]+/, text=/[A-Z]+/, text=/[0-9]+/');
      console.log('📊 데이터가 있는 셀 수:', await filledCells.count());
      
    } else {
      console.log('❌ 스케줄 그리드 없음');
    }
  });

  test('브라우저 개발자 도구를 통한 데이터 진단', async ({ page }) => {
    // 관리자 페이지로 이동
    try {
      const adminLinks = page.locator('text=관리자, text=Admin, text=직원 관리, text=스케줄 관리, a[href*="admin"]');
      if (await adminLinks.isVisible()) {
        await adminLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('관리자 페이지 접근 실패:', error);
      return;
    }
    
    // 네트워크 요청 모니터링 시작
    await page.route('**/*', route => {
      console.log('🌐 네트워크 요청:', route.request().url());
      route.continue();
    });
    
    // 페이지 새로고침하여 네트워크 요청 캐치
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 네트워크 요청 분석
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('supabase') || entry.name.includes('api') || entry.name.includes('graphql'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize,
          initiatorType: entry.initiatorType
        }));
    });
    
    console.log('🌐 Supabase/API 요청:', networkRequests);
    
    // 브라우저 콘솔 로그 확인
    const consoleMessages = await page.evaluate(() => {
      return window.consoleMessages || [];
    });
    
    console.log('📝 콘솔 메시지:', consoleMessages);
    
    // localStorage 확인
    const localStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          data[key] = window.localStorage.getItem(key);
        }
      }
      return data;
    });
    
    console.log('💾 localStorage 데이터:', localStorage);
    
    // sessionStorage 확인
    const sessionStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          data[key] = window.sessionStorage.getItem(key);
        }
      }
      return data;
    });
    
    console.log('🔐 sessionStorage 데이터:', sessionStorage);
  });

  test('Supabase 연결 상태 및 에러 확인', async ({ page }) => {
    // 관리자 페이지로 이동
    try {
      const adminLinks = page.locator('text=관리자, text=Admin, text=직원 관리, text=스케줄 관리, a[href*="admin"]');
      if (await adminLinks.isVisible()) {
        await adminLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('관리자 페이지 접근 실패:', error);
      return;
    }
    
    // JavaScript 에러 확인
    const jsErrors = await page.evaluate(() => {
      return window.jsErrors || [];
    });
    
    console.log('❌ JavaScript 에러:', jsErrors);
    
    // Supabase 클라이언트 상태 확인
    const supabaseStatus = await page.evaluate(() => {
      try {
        // @ts-ignore
        if (window.supabase) {
          return {
            exists: true,
            url: window.supabase.supabaseUrl,
            key: window.supabase.supabaseKey ? '설정됨' : '설정 안됨'
          };
        }
        return { exists: false };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔌 Supabase 클라이언트 상태:', supabaseStatus);
    
    // 페이지 에러 이벤트 리스너 추가
    await page.addListener('pageerror', error => {
      console.log('🚨 페이지 에러:', error.message);
    });
    
    await page.addListener('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 콘솔 에러:', msg.text());
      }
    });
    
    // 페이지 새로고침하여 에러 캐치
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/final-debug-state.png' });
  });
});
