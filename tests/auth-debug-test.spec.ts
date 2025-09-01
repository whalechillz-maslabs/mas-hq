import { test, expect } from '@playwright/test';

test.describe('Supabase 인증 디버깅 테스트', () => {
  test('인증 상태 및 세션 상세 디버깅', async ({ page }) => {
    console.log('🚀 Supabase 인증 디버깅 테스트 시작');
    
    // 1. 콘솔 오류 수집
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // 2. 네트워크 요청 모니터링
    const networkRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        networkRequests.push(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    const networkResponses: string[] = [];
    page.on('response', response => {
      if (response.url().includes('supabase')) {
        networkResponses.push(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    // 3. 로그인 페이지 접근
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 4. 로그인 전 인증 상태 확인
    console.log('\n🔍 로그인 전 인증 상태 확인:');
    
    // localStorage 확인
    const beforeLoginAuth = await page.evaluate(() => {
      return {
        localStorage: {
          'maslabs-auth': localStorage.getItem('maslabs-auth'),
          'isLoggedIn': localStorage.getItem('isLoggedIn'),
          'currentEmployee': localStorage.getItem('currentEmployee')
        },
        sessionStorage: {
          'maslabs-auth': sessionStorage.getItem('maslabs-auth')
        }
      };
    });
    
    console.log('📦 로그인 전 localStorage:', beforeLoginAuth.localStorage);
    console.log('📦 로그인 전 sessionStorage:', beforeLoginAuth.sessionStorage);
    
    // 5. 로그인 실행
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 6. 로그인 후 인증 상태 확인
    console.log('\n🔍 로그인 후 인증 상태 확인:');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const afterLoginAuth = await page.evaluate(() => {
      return {
        localStorage: {
          'maslabs-auth': localStorage.getItem('maslabs-auth'),
          'isLoggedIn': localStorage.getItem('isLoggedIn'),
          'currentEmployee': localStorage.getItem('currentEmployee')
        },
        sessionStorage: {
          'maslabs-auth': sessionStorage.getItem('maslabs-auth')
        }
      };
    });
    
    console.log('📦 로그인 후 localStorage:', afterLoginAuth.localStorage);
    console.log('📦 로그인 후 sessionStorage:', afterLoginAuth.sessionStorage);
    
    // 7. Supabase 세션 확인
    console.log('\n🔍 Supabase 세션 확인:');
    
    const sessionInfo = await page.evaluate(async () => {
      try {
        // @ts-ignore
        if ((window as any).supabase) {
          const { data: { session }, error } = await (window as any).supabase.auth.getSession();
          return { session, error };
        }
        return { session: null, error: 'supabase not found' };
      } catch (error: any) {
        return { session: null, error: error.message };
      }
    });
    
    console.log('🔐 Supabase 세션:', sessionInfo);
    
    // 8. 개인 출근 관리 페이지 접근 시도
    console.log('\n🔍 개인 출근 관리 페이지 접근 시도:');
    
    await page.goto('https://www.maslabs.kr/attendance');
    console.log('🔍 개인 출근 관리 페이지로 이동 중...');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const currentURL = page.url();
    console.log('🌐 현재 URL:', currentURL);
    
    // 9. 페이지 접근 후 인증 상태 재확인
    console.log('\n🔍 페이지 접근 후 인증 상태 재확인:');
    
    const afterPageAccessAuth = await page.evaluate(() => {
      return {
        localStorage: {
          'maslabs-auth': localStorage.getItem('maslabs-auth'),
          'isLoggedIn': localStorage.getItem('isLoggedIn'),
          'currentEmployee': localStorage.getItem('currentEmployee')
        },
        sessionStorage: {
          'maslabs-auth': sessionStorage.getItem('maslabs-auth')
        }
      };
    });
    
    console.log('📦 페이지 접근 후 localStorage:', afterPageAccessAuth.localStorage);
    console.log('📦 페이지 접근 후 sessionStorage:', afterPageAccessAuth.localStorage);
    
    // 10. 최종 결과 요약
    console.log('\n📊 인증 디버깅 결과 요약:');
    console.log('='.repeat(50));
    
    console.log(`콘솔 오류: ${consoleErrors.length}개`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log(`\n콘솔 로그: ${consoleLogs.length}개`);
    if (consoleLogs.length > 0) {
      consoleLogs.slice(-10).forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    console.log(`\n네트워크 요청: ${networkRequests.length}개`);
    if (networkRequests.length > 0) {
      networkRequests.slice(-10).forEach((req, index) => {
        console.log(`${index + 1}. ${req}`);
      });
    }
    
    console.log(`\n네트워크 응답: ${networkResponses.length}개`);
    if (networkResponses.length > 0) {
      networkResponses.slice(-10).forEach((res, index) => {
        console.log(`${index + 1}. ${res}`);
      });
    }
    
    // 11. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/auth-debug-test.png' });
    console.log('\n📸 인증 디버깅 스크린샷 저장됨');
    
    console.log('\n🎉 Supabase 인증 디버깅 테스트 완료!');
    
    // 12. 문제 진단
    if (currentURL.includes('/login')) {
      console.log('\n❌ 문제 진단:');
      console.log('   - 로그인 후에도 개인별 출근 관리 페이지 접근 불가');
      console.log('   - 로그인 페이지로 리다이렉트됨');
      
      if (sessionInfo.session) {
        console.log('   - Supabase 세션은 존재함');
        console.log('   - 문제: 페이지에서 세션을 제대로 인식하지 못함');
      } else {
        console.log('   - Supabase 세션이 없음');
        console.log('   - 문제: 로그인 후 세션이 생성되지 않음');
      }
    } else {
      console.log('\n✅ 성공: 개인별 출근 관리 페이지 정상 접근');
    }
  });
});
