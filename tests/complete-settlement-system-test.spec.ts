import { test, expect } from '@playwright/test';

test('완전한 정산 시스템 테스트', async ({ page }) => {
  console.log('🧪 완전한 정산 시스템 테스트 시작');
  
  // 1. 허상원으로 로그인
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  
  // 로그인
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('89484501');
    console.log('✅ 허상원 비밀번호 입력 완료');
  }
  
  const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
  if (await submitButton.count() > 0) {
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭');
    await page.waitForTimeout(3000);
  }
  
  // 2. 정산서 페이지로 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 3. 정산서 목록 확인
  const table = page.locator('table');
  if (await table.count() > 0) {
    console.log('✅ 정산서 테이블 발견');
    
    // 테이블 행 수 확인
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`📊 정산서 개수: ${rowCount}개`);
    
    // 각 정산서 확인
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      console.log(`  ${i + 1}. ${rowText}`);
    }
    
    // 예상 정산서 개수 확인 (6개)
    if (rowCount >= 6) {
      console.log('✅ 예상 정산서 개수 확인됨 (6개 이상)');
    } else {
      console.log(`❌ 예상 정산서 개수와 다름 (예상: 6개, 실제: ${rowCount}개)`);
    }
  }
  
  // 4. 각 정산서 상세보기 테스트
  const viewButtons = page.locator('button:has-text("상세보기")');
  const viewButtonCount = await viewButtons.count();
  console.log(`🔍 상세보기 버튼 개수: ${viewButtonCount}개`);
  
  if (viewButtonCount > 0) {
    // 첫 번째 정산서 상세보기
    await viewButtons.first().click();
    console.log('✅ 첫 번째 정산서 상세보기 클릭');
    await page.waitForTimeout(2000);
    
    // 모달 확인
    const modal = page.locator('.fixed.inset-0');
    if (await modal.count() > 0) {
      console.log('✅ 정산서 상세 모달 열림');
      
      // 정산서 내용 확인
      const header = page.locator('h1, h2').first();
      const headerText = await header.textContent();
      console.log('📄 정산서 헤더:', headerText);
      
      // 직원 정보 확인
      const employeeInfo = page.locator('.grid.grid-cols-3');
      if (await employeeInfo.count() > 0) {
        const infoText = await employeeInfo.textContent();
        console.log('👤 직원 정보:', infoText);
      }
      
      // 정산 요약 확인
      const summary = page.locator('.grid.grid-cols-2').first();
      if (await summary.count() > 0) {
        const summaryText = await summary.textContent();
        console.log('📊 정산 요약:', summaryText);
      }
      
      // 닫기
      const closeButton = page.locator('button:has-text("닫기")');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        console.log('✅ 정산서 상세 모달 닫기');
        await page.waitForTimeout(1000);
      }
    }
  }
  
  // 5. 관리자 페이지 테스트
  await page.goto('https://www.maslabs.kr/admin/part-time-settlement');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 파트타임 정산 관리 페이지 접근 완료');
  
  // 직원 선택 드롭다운 확인
  const employeeSelect = page.locator('select').first();
  if (await employeeSelect.count() > 0) {
    const options = await employeeSelect.locator('option').allTextContents();
    console.log('📋 사용 가능한 직원 옵션들:', options);
    
    // 허상원 옵션 찾기
    const heoOption = options.find(option => option.includes('허상원'));
    if (heoOption) {
      console.log('✅ 허상원 옵션 발견:', heoOption);
    } else {
      console.log('❌ 허상원 옵션을 찾을 수 없음');
    }
  }
  
  // 6. 페이지 스크린샷
  await page.screenshot({ path: 'test-results/complete-settlement-system.png', fullPage: true });
  console.log('📸 완전한 정산 시스템 스크린샷 저장');
  
  console.log('🎉 완전한 정산 시스템 테스트 완료');
});

test('완전한 정산 시스템 테스트', async ({ page }) => {
  console.log('🧪 완전한 정산 시스템 테스트 시작');
  
  // 1. 허상원으로 로그인
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  
  // 로그인
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('89484501');
    console.log('✅ 허상원 비밀번호 입력 완료');
  }
  
  const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
  if (await submitButton.count() > 0) {
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭');
    await page.waitForTimeout(3000);
  }
  
  // 2. 정산서 페이지로 이동
  await page.goto('https://www.maslabs.kr/payslips');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 정산서 페이지 접근 완료');
  
  // 3. 정산서 목록 확인
  const table = page.locator('table');
  if (await table.count() > 0) {
    console.log('✅ 정산서 테이블 발견');
    
    // 테이블 행 수 확인
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`📊 정산서 개수: ${rowCount}개`);
    
    // 각 정산서 확인
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      console.log(`  ${i + 1}. ${rowText}`);
    }
    
    // 예상 정산서 개수 확인 (6개)
    if (rowCount >= 6) {
      console.log('✅ 예상 정산서 개수 확인됨 (6개 이상)');
    } else {
      console.log(`❌ 예상 정산서 개수와 다름 (예상: 6개, 실제: ${rowCount}개)`);
    }
  }
  
  // 4. 각 정산서 상세보기 테스트
  const viewButtons = page.locator('button:has-text("상세보기")');
  const viewButtonCount = await viewButtons.count();
  console.log(`🔍 상세보기 버튼 개수: ${viewButtonCount}개`);
  
  if (viewButtonCount > 0) {
    // 첫 번째 정산서 상세보기
    await viewButtons.first().click();
    console.log('✅ 첫 번째 정산서 상세보기 클릭');
    await page.waitForTimeout(2000);
    
    // 모달 확인
    const modal = page.locator('.fixed.inset-0');
    if (await modal.count() > 0) {
      console.log('✅ 정산서 상세 모달 열림');
      
      // 정산서 내용 확인
      const header = page.locator('h1, h2').first();
      const headerText = await header.textContent();
      console.log('📄 정산서 헤더:', headerText);
      
      // 직원 정보 확인
      const employeeInfo = page.locator('.grid.grid-cols-3');
      if (await employeeInfo.count() > 0) {
        const infoText = await employeeInfo.textContent();
        console.log('👤 직원 정보:', infoText);
      }
      
      // 정산 요약 확인
      const summary = page.locator('.grid.grid-cols-2').first();
      if (await summary.count() > 0) {
        const summaryText = await summary.textContent();
        console.log('📊 정산 요약:', summaryText);
      }
      
      // 닫기
      const closeButton = page.locator('button:has-text("닫기")');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        console.log('✅ 정산서 상세 모달 닫기');
        await page.waitForTimeout(1000);
      }
    }
  }
  
  // 5. 관리자 페이지 테스트
  await page.goto('https://www.maslabs.kr/admin/part-time-settlement');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('✅ 파트타임 정산 관리 페이지 접근 완료');
  
  // 직원 선택 드롭다운 확인
  const employeeSelect = page.locator('select').first();
  if (await employeeSelect.count() > 0) {
    const options = await employeeSelect.locator('option').allTextContents();
    console.log('📋 사용 가능한 직원 옵션들:', options);
    
    // 허상원 옵션 찾기
    const heoOption = options.find(option => option.includes('허상원'));
    if (heoOption) {
      console.log('✅ 허상원 옵션 발견:', heoOption);
    } else {
      console.log('❌ 허상원 옵션을 찾을 수 없음');
    }
  }
  
  // 6. 페이지 스크린샷
  await page.screenshot({ path: 'test-results/complete-settlement-system.png', fullPage: true });
  console.log('📸 완전한 정산 시스템 스크린샷 저장');
  
  console.log('🎉 완전한 정산 시스템 테스트 완료');
});
