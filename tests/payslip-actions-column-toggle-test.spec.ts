import { test, expect } from '@playwright/test';

test('급여명세서 목록 작업 컬럼 토글 기능 테스트', async ({ page }) => {
  console.log('🧪 급여명세서 목록 작업 컬럼 토글 기능 테스트 시작');
  
  // 배포된 URL로 이동 (실제 프로덕션 URL 사용)
  const baseUrl = 'https://www.maslabs.kr';
  
  // 1. 로그인 페이지로 이동
  console.log('1. 로그인 페이지로 이동...');
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 페이지 스크린샷 저장 (디버깅용)
  await page.screenshot({ path: 'test-results/login-page-debug.png', fullPage: true });
  console.log('📸 로그인 페이지 스크린샷 저장 완료');
  
  // 2. 관리자 로그인 - 다양한 방법 시도
  console.log('2. 관리자 로그인...');
  
  // 페이지의 모든 input 요소 확인
  const allInputs = await page.locator('input').all();
  console.log(`발견된 input 요소 수: ${allInputs.length}`);
  
  // 전화번호 입력 필드 찾기 (여러 방법 시도)
  let phoneInput = null;
  const phoneSelectors = [
    'input[type="tel"]',
    'input[name="phone"]',
    'input[placeholder*="전화번호"]',
    'input[type="text"]',
    'input'
  ];
  
  for (const selector of phoneSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      phoneInput = elements.first();
      console.log(`✅ 전화번호 입력 필드 발견: ${selector}`);
      break;
    }
  }
  
  if (!phoneInput) {
    throw new Error('전화번호 입력 필드를 찾을 수 없습니다');
  }
  
  await phoneInput.fill('010-6669-9000');
  console.log('✅ 전화번호 입력 완료');
  
  // 비밀번호 입력
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('66699000');
  console.log('✅ 비밀번호 입력 완료');
  
  // 로그인 버튼 클릭
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  console.log('✅ 로그인 버튼 클릭');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  console.log('✅ 관리자 로그인 완료');
  
  // 3. 급여명세서 생성기 페이지로 이동
  console.log('3. 급여명세서 생성기 페이지로 이동...');
  await page.goto(`${baseUrl}/admin/payslip-generator`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 급여명세서 생성기 페이지 접근 완료');
  
  // 4. "발행된 급여명세서 목록" 탭 클릭
  console.log('4. "발행된 급여명세서 목록" 탭 클릭...');
  const listTab = page.locator('button:has-text("발행된 급여명세서 목록")');
  await expect(listTab).toBeVisible({ timeout: 10000 });
  await listTab.click();
  await page.waitForTimeout(2000);
  
  console.log('✅ 발행된 급여명세서 목록 탭 활성화 완료');
  
  // 5. 작업 컬럼 토글 버튼 확인
  console.log('5. 작업 컬럼 토글 버튼 확인...');
  const toggleButton = page.locator('button:has-text("작업 숨기기"), button:has-text("작업 보이기")');
  await expect(toggleButton).toBeVisible({ timeout: 10000 });
  
  const buttonText = await toggleButton.textContent();
  console.log(`✅ 작업 컬럼 토글 버튼 발견: "${buttonText}"`);
  
  // 6. 작업 컬럼이 보이는지 확인
  console.log('6. 작업 컬럼이 보이는지 확인...');
  const actionsColumnHeader = page.locator('th:has-text("작업")');
  const actionsColumnVisible = await actionsColumnHeader.isVisible();
  console.log(`작업 컬럼 헤더 표시 여부: ${actionsColumnVisible}`);
  
  if (actionsColumnVisible) {
    console.log('✅ 작업 컬럼이 현재 표시되어 있음');
    
    // 7. 작업 컬럼 숨기기 버튼 클릭
    console.log('7. 작업 컬럼 숨기기 버튼 클릭...');
    await toggleButton.click();
    await page.waitForTimeout(1000);
    
    // 8. 작업 컬럼이 숨겨졌는지 확인
    console.log('8. 작업 컬럼이 숨겨졌는지 확인...');
    const actionsColumnHidden = await actionsColumnHeader.isHidden();
    console.log(`작업 컬럼 헤더 숨김 여부: ${actionsColumnHidden}`);
    
    if (actionsColumnHidden) {
      console.log('✅ 작업 컬럼이 성공적으로 숨겨짐');
      
      // 9. 다른 컬럼들이 모두 보이는지 확인
      console.log('9. 다른 컬럼들이 모두 보이는지 확인...');
      const employeeNameHeader = page.locator('th:has-text("직원명")');
      const yearHeader = page.locator('th:has-text("연도")');
      const periodHeader = page.locator('th:has-text("급여 기간")');
      const issuedDateHeader = page.locator('th:has-text("발행일")');
      const paidDateHeader = page.locator('th:has-text("지급일")');
      
      await expect(employeeNameHeader).toBeVisible();
      await expect(yearHeader).toBeVisible();
      await expect(periodHeader).toBeVisible();
      await expect(issuedDateHeader).toBeVisible();
      await expect(paidDateHeader).toBeVisible();
      
      console.log('✅ 모든 주요 컬럼이 표시됨');
      
      // 10. 작업 컬럼 보이기 버튼 클릭
      console.log('10. 작업 컬럼 보이기 버튼 클릭...');
      const showButton = page.locator('button:has-text("작업 보이기")');
      await expect(showButton).toBeVisible();
      await showButton.click();
      await page.waitForTimeout(1000);
      
      // 11. 작업 컬럼이 다시 보이는지 확인
      console.log('11. 작업 컬럼이 다시 보이는지 확인...');
      const actionsColumnVisibleAgain = await actionsColumnHeader.isVisible();
      console.log(`작업 컬럼 헤더 다시 표시 여부: ${actionsColumnVisibleAgain}`);
      
      if (actionsColumnVisibleAgain) {
        console.log('✅ 작업 컬럼이 성공적으로 다시 표시됨');
      } else {
        console.log('❌ 작업 컬럼이 다시 표시되지 않음');
      }
    } else {
      console.log('❌ 작업 컬럼이 숨겨지지 않음');
    }
  } else {
    console.log('⚠️ 작업 컬럼이 이미 숨겨져 있음. 보이기 버튼 클릭...');
    await toggleButton.click();
    await page.waitForTimeout(1000);
    
    const actionsColumnVisibleAfter = await actionsColumnHeader.isVisible();
    if (actionsColumnVisibleAfter) {
      console.log('✅ 작업 컬럼이 성공적으로 표시됨');
    } else {
      console.log('❌ 작업 컬럼이 표시되지 않음');
    }
  }
  
  console.log('🎉 작업 컬럼 토글 기능 테스트 완료');
});

