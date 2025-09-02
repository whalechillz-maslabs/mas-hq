import { test, expect } from '@playwright/test';

test.describe('로그인 및 Supabase 연결 문제 진단', () => {
  test('로그인 폼 구조 분석', async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'test-results/login-page-structure.png' });
    
    // 모든 입력 필드 찾기
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    console.log('📝 전체 입력 필드 수:', inputCount);
    
    // 각 입력 필드의 속성 분석
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      console.log(`📝 입력 필드 ${i + 1}:`, {
        type,
        placeholder,
        name,
        id
      });
    }
    
    // 로그인 버튼 찾기
    const loginButtons = page.locator('button:has-text("로그인"), button:has-text("Login"), input[type="submit"]');
    const buttonCount = await loginButtons.count();
    console.log('🔘 로그인 버튼 수:', buttonCount);
    
    // 페이지 HTML 구조 확인
    const pageContent = await page.content();
    console.log('📄 페이지 내용 길이:', pageContent.length);
    
    // 로그인 관련 텍스트 찾기
    const loginTexts = page.locator('text=/로그인|login|Login|전화번호|비밀번호|password|phone/i');
    console.log('🔍 로그인 관련 텍스트 수:', await loginTexts.count());
  });

  test('Supabase 환경 변수 확인', async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // JavaScript 환경 변수 확인
    const envVars = await page.evaluate(() => {
      return {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        window: {
          location: window.location.href,
          userAgent: navigator.userAgent
        }
      };
    });
    
    console.log('🌍 환경 변수:', envVars);
    
    // 페이지 소스에서 Supabase 설정 찾기
    const pageSource = await page.content();
    const supabaseUrlMatch = pageSource.match(/supabase\.co[^"'\s]*/g);
    const supabaseKeyMatch = pageSource.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[^"'\s]*/g);
    
    console.log('🔗 Supabase URL 패턴:', supabaseUrlMatch);
    console.log('🔑 Supabase Key 패턴:', supabaseKeyMatch ? '발견됨' : '없음');
    
    // 네트워크 요청에서 Supabase 도메인 찾기
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('supabase'))
        .map(entry => entry.name);
    });
    
    console.log('🌐 Supabase 네트워크 요청:', networkRequests);
  });

  test('실제 로그인 시도', async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // 로그인 폼 찾기 시도
    const possibleSelectors = [
      'input[placeholder*="전화번호"]',
      'input[placeholder*="phone"]',
      'input[name*="phone"]',
      'input[type="tel"]',
      'input[placeholder*="이메일"]',
      'input[type="email"]',
      'input[placeholder*="아이디"]',
      'input[name*="id"]'
    ];
    
    let phoneInput = null;
    for (const selector of possibleSelectors) {
      try {
        const input = page.locator(selector);
        if (await input.isVisible()) {
          phoneInput = input;
          console.log('✅ 전화번호/아이디 입력 필드 발견:', selector);
          break;
        }
      } catch (error) {
        console.log('❌ 선택자 실패:', selector);
      }
    }
    
    if (phoneInput) {
      // 테스트 데이터 입력
      await phoneInput.fill('01012345678');
      console.log('✅ 전화번호 입력 완료');
      
      // 비밀번호 필드 찾기
      const passwordSelectors = [
        'input[type="password"]',
        'input[placeholder*="비밀번호"]',
        'input[name*="password"]',
        'input[name*="pw"]'
      ];
      
      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          const input = page.locator(selector);
          if (await input.isVisible()) {
            passwordInput = input;
            console.log('✅ 비밀번호 입력 필드 발견:', selector);
            break;
          }
        } catch (error) {
          console.log('❌ 비밀번호 선택자 실패:', selector);
        }
      }
      
      if (passwordInput) {
        await passwordInput.fill('testpassword');
        console.log('✅ 비밀번호 입력 완료');
        
        // 로그인 버튼 클릭
        const loginButton = page.locator('button:has-text("로그인"), button:has-text("Login"), input[type="submit"]');
        if (await loginButton.isVisible()) {
          await loginButton.click();
          console.log('✅ 로그인 버튼 클릭');
          
          // 로그인 결과 대기
          await page.waitForTimeout(5000);
          
          // 로그인 후 페이지 상태 확인
          const currentUrl = page.url();
          console.log('🔗 현재 URL:', currentUrl);
          
          // 로그인 성공/실패 확인
          const errorMessage = page.locator('text=/오류|에러|error|실패|실패했습니다/i');
          if (await errorMessage.isVisible()) {
            console.log('❌ 로그인 실패:', await errorMessage.textContent());
          } else {
            console.log('✅ 로그인 성공 가능성');
          }
          
          // 페이지 스크린샷
          await page.screenshot({ path: 'test-results/login-result.png' });
        }
      }
    } else {
      console.log('❌ 로그인 폼을 찾을 수 없음');
    }
  });

  test('페이지 소스 코드 분석', async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // 페이지 소스에서 중요한 정보 추출
    const pageSource = await page.content();
    
    // Supabase 관련 코드 찾기
    const supabasePatterns = [
      /createClient\([^)]*\)/g,
      /supabase\.[a-zA-Z]+\(/g,
      /NEXT_PUBLIC_SUPABASE_[A-Z_]+/g
    ];
    
    for (const pattern of supabasePatterns) {
      const matches = pageSource.match(pattern);
      if (matches) {
        console.log('🔍 Supabase 패턴 발견:', matches);
      }
    }
    
    // React 컴포넌트 구조 확인
    const reactPatterns = [
      /<div[^>]*class[^>]*>/g,
      /useState|useEffect|useRouter/g,
      /export default|function|const.*=/g
    ];
    
    for (const pattern of reactPatterns) {
      const matches = pageSource.match(pattern);
      if (matches) {
        console.log('⚛️ React 패턴 발견:', matches.length, '개');
      }
    }
    
    // 페이지 크기 정보
    console.log('📄 페이지 소스 크기:', pageSource.length, '문자');
    console.log('🔍 Supabase 관련 코드 포함 여부:', pageSource.includes('supabase'));
  });
});
