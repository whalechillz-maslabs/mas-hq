import { test, expect } from '@playwright/test';

test.describe('전체 시스템 진단 테스트', () => {
  test('모든 페이지 접근 가능성 및 문제점 진단', async ({ page }) => {
    console.log('🚀 전체 시스템 진단 테스트 시작');
    
    // 1. 콘솔 오류 수집
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // 2. 네트워크 오류 수집
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.url()} - ${response.status()}`);
      }
    });
    
    // 3. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 4. 각 페이지별 테스트
    const pages = [
      { name: '퀵 태스크', url: '/quick-task', expectedTitle: '퀵 태스크' },
      { name: '대시보드', url: '/dashboard', expectedTitle: '대시보드' },
      { name: '개인 출근 관리', url: '/attendance', expectedTitle: '출근 관리' },
      { name: '스케줄 관리', url: '/schedules', expectedTitle: '근무 스케줄' },
      { name: '업무 관리', url: '/tasks', expectedTitle: '업무 관리' },
      { name: '프로필', url: '/profile', expectedTitle: '프로필' },
      { name: '조직도', url: '/organization', expectedTitle: '조직도' },
      { name: '급여', url: '/salary', expectedTitle: '급여' },
      { name: '관리자 출근 관리', url: '/admin/attendance-management', expectedTitle: '출근 관리' },
      { name: '관리자 직원 관리', url: '/admin/employee-management', expectedTitle: '직원 관리' },
      { name: '관리자 부서 관리', url: '/admin/department-management', expectedTitle: '부서 관리' },
      { name: '관리자 팀 관리', url: '/admin/team-management', expectedTitle: '팀 관리' },
      { name: '관리자 직원 스케줄', url: '/admin/employee-schedules', expectedTitle: '직원 스케줄' },
      { name: '관리자 HR 정책', url: '/admin/hr-policy', expectedTitle: 'HR 정책' },
      { name: '관리자 시스템 설정', url: '/admin/system-settings', expectedTitle: '시스템 설정' },
      { name: '관리자 팀 평가', url: '/admin/team-evaluation', expectedTitle: '팀 평가' },
      { name: '관리자 직원 마이그레이션', url: '/admin/employee-migration', expectedTitle: '직원 마이그레이션' }
    ];
    
    const pageResults: any[] = [];
    
    for (const pageInfo of pages) {
      console.log(`\n🔍 ${pageInfo.name} 페이지 테스트 시작...`);
      
      try {
        // 페이지 이동
        await page.goto(`https://www.maslabs.kr${pageInfo.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 현재 URL 확인
        const currentURL = page.url();
        const isCorrectPage = currentURL.includes(pageInfo.url);
        
        // 페이지 제목 확인
        let pageTitle = '';
        try {
          const titleElement = page.locator('title');
          if (await titleElement.count() > 0) {
            pageTitle = await titleElement.textContent() || '';
          }
        } catch (error) {
          pageTitle = '제목 없음';
        }
        
        // 페이지 본문 길이 확인
        const bodyText = await page.locator('body').textContent();
        const bodyLength = bodyText?.length || 0;
        
        // 로딩 상태 확인
        const loadingElement = page.locator('text=로딩 중...');
        const hasLoading = await loadingElement.count() > 0;
        
        // 특정 텍스트 포함 여부 확인
        const hasExpectedContent = bodyText?.includes(pageInfo.expectedTitle) || false;
        
        // 결과 저장
        const result = {
          name: pageInfo.name,
          url: pageInfo.url,
          currentURL: currentURL,
          isCorrectPage: isCorrectPage,
          pageTitle: pageTitle,
          bodyLength: bodyLength,
          hasLoading: hasLoading,
          hasExpectedContent: hasExpectedContent,
          status: isCorrectPage && hasExpectedContent ? '✅ 정상' : '❌ 문제'
        };
        
        pageResults.push(result);
        
        console.log(`📊 ${pageInfo.name} 결과:`, result.status);
        console.log(`   - 현재 URL: ${currentURL}`);
        console.log(`   - 페이지 제목: ${pageTitle}`);
        console.log(`   - 본문 길이: ${bodyLength}`);
        console.log(`   - 로딩 상태: ${hasLoading ? '로딩 중' : '로딩 완료'}`);
        console.log(`   - 예상 내용 포함: ${hasExpectedContent}`);
        
        // 문제가 있는 페이지 스크린샷 저장
        if (!isCorrectPage || !hasExpectedContent) {
          await page.screenshot({ path: `tests/screenshots/problem-${pageInfo.name.replace(/\s+/g, '-')}.png` });
          console.log(`   - 문제 페이지 스크린샷 저장됨`);
        }
        
      } catch (error) {
        console.log(`❌ ${pageInfo.name} 페이지 테스트 실패:`, error);
        
        const result = {
          name: pageInfo.name,
          url: pageInfo.url,
          currentURL: '접근 실패',
          isCorrectPage: false,
          pageTitle: '오류',
          bodyLength: 0,
          hasLoading: false,
          hasExpectedContent: false,
          status: '❌ 접근 실패'
        };
        
        pageResults.push(result);
      }
    }
    
    // 5. 전체 결과 요약
    console.log('\n📊 전체 시스템 진단 결과 요약:');
    console.log('=' * 50);
    
    const normalPages = pageResults.filter(r => r.status === '✅ 정상');
    const problemPages = pageResults.filter(r => r.status !== '✅ 정상');
    
    console.log(`✅ 정상 작동 페이지: ${normalPages.length}개`);
    normalPages.forEach(page => {
      console.log(`   - ${page.name}`);
    });
    
    console.log(`\n❌ 문제가 있는 페이지: ${problemPages.length}개`);
    problemPages.forEach(page => {
      console.log(`   - ${page.name}: ${page.status}`);
      if (page.currentURL !== '접근 실패') {
        console.log(`     현재 URL: ${page.currentURL}`);
        console.log(`     예상 URL: ${page.url}`);
      }
    });
    
    // 6. 콘솔 및 네트워크 오류 요약
    console.log('\n📊 시스템 오류 요약:');
    console.log(`콘솔 오류: ${consoleErrors.length}개`);
    console.log(`콘솔 경고: ${consoleWarnings.length}개`);
    console.log(`네트워크 오류: ${networkErrors.length}개`);
    
    if (consoleErrors.length > 0) {
      console.log('\n콘솔 오류 목록:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n네트워크 오류 목록:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 7. 최종 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/system-diagnosis-final.png' });
    console.log('\n📸 최종 진단 스크린샷 저장됨');
    
    console.log('\n🎉 전체 시스템 진단 테스트 완료!');
    
    // 8. 테스트 결과 반환
    return { pageResults, consoleErrors, networkErrors };
  });
});
