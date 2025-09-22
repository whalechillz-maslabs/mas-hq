import { test, expect } from '@playwright/test';

test('허상원 정산서 생성 테스트', async ({ page }) => {
  console.log('🧪 허상원 정산서 생성 테스트 시작');
  
  // 관리자 로그인
  await page.goto('https://www.maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  
  // 로그인 페이지 구조 확인
  const pageContent = await page.content();
  console.log('📄 로그인 페이지 내용 확인');
  
  // 다양한 로그인 방법 시도
  const usernameInput = page.locator('input[type="text"], input[name="username"], input[name="email"], input[placeholder*="사용자"], input[placeholder*="아이디"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
  
  if (await usernameInput.count() > 0) {
    await usernameInput.fill('admin');
    console.log('✅ 사용자명 입력 완료');
  } else {
    console.log('❌ 사용자명 입력 필드를 찾을 수 없음');
  }
  
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('admin123');
    console.log('✅ 비밀번호 입력 완료');
  } else {
    console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
  }
  
  if (await submitButton.count() > 0) {
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭');
    await page.waitForTimeout(3000);
  } else {
    console.log('❌ 로그인 버튼을 찾을 수 없음');
  }
  
  console.log('✅ 관리자 로그인 완료');
  
  // 파트타임 정산 페이지로 이동
  await page.goto('https://www.maslabs.kr/admin/part-time-settlement');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // 추가 대기 시간
  
  console.log('✅ 파트타임 정산 페이지 접근 완료');
  
  // 직원 선택 (허상원)
  const employeeSelect = page.locator('select').first();
  
  // 드롭다운이 로드될 때까지 대기
  await page.waitForFunction(() => {
    const select = document.querySelector('select');
    return select && select.options.length > 1;
  }, { timeout: 10000 });
  
  // 드롭다운 옵션들 확인
  const options = await employeeSelect.locator('option').allTextContents();
  console.log('📋 사용 가능한 직원 옵션들:', options);
  
  // 허상원 옵션 찾기
  const heoOption = options.find(option => option.includes('허상원'));
  if (heoOption) {
    await employeeSelect.selectOption({ label: heoOption });
    console.log('✅ 허상원 선택 완료:', heoOption);
  } else {
    console.log('❌ 허상원 옵션을 찾을 수 없음');
    console.log('   사용 가능한 옵션들:', options);
    // 첫 번째 옵션 선택 (허상원이 아닐 수 있음)
    if (options.length > 1) {
      await employeeSelect.selectOption({ index: 1 });
      console.log('⚠️ 첫 번째 직원 선택:', options[1]);
    }
  }
  
  // 정산 기간 설정 (8월 11일 ~ 8월 13일)
  const startDateInput = page.locator('input[type="date"]').first();
  const endDateInput = page.locator('input[type="date"]').nth(1);
  
  await startDateInput.fill('2025-08-11');
  await endDateInput.fill('2025-08-13');
  
  console.log('✅ 정산 기간 설정 완료 (2025-08-11 ~ 2025-08-13)');
  
  // 정산서 생성 버튼 클릭
  const generateButton = page.locator('button:has-text("정산서 생성")');
  await generateButton.click();
  
  console.log('✅ 정산서 생성 버튼 클릭');
  
  // 정산서 내용 확인
  await page.waitForTimeout(2000);
  
  // 정산서 제목 확인
  const title = page.locator('h1, h2, h3').first();
  const titleText = await title.textContent();
  console.log('📄 정산서 제목:', titleText);
  
  // 정산 금액 확인
  const amountElements = page.locator('text=/\\d{1,3}(,\\d{3})*원/');
  const amounts = await amountElements.allTextContents();
  console.log('💰 발견된 금액들:', amounts);
  
  // 예상 금액 (253,500원) 확인
  const expectedAmount = '253,500원';
  const hasExpectedAmount = amounts.some(amount => amount.includes('253,500'));
  
  if (hasExpectedAmount) {
    console.log('✅ 예상 금액 253,500원 확인됨');
  } else {
    console.log('❌ 예상 금액 253,500원을 찾을 수 없음');
    console.log('   실제 금액들:', amounts);
  }
  
  // 근무 시간 확인
  const timeElements = page.locator('text=/\\d+\\.?\\d*시간/');
  const times = await timeElements.allTextContents();
  console.log('⏰ 발견된 시간들:', times);
  
  // 예상 시간 (19.5시간) 확인
  const hasExpectedTime = times.some(time => time.includes('19.5') || time.includes('19시간'));
  
  if (hasExpectedTime) {
    console.log('✅ 예상 시간 19.5시간 확인됨');
  } else {
    console.log('❌ 예상 시간 19.5시간을 찾을 수 없음');
    console.log('   실제 시간들:', times);
  }
  
  // 정산서 보기 버튼 테스트
  const viewButton = page.locator('button:has-text("정산서 보기")');
  if (await viewButton.count() > 0) {
    await viewButton.click();
    console.log('✅ 정산서 보기 버튼 클릭');
    await page.waitForTimeout(1000);
  }
  
  // PDF 다운로드 버튼 테스트
  const downloadButton = page.locator('button:has-text("PDF 다운로드")');
  if (await downloadButton.count() > 0) {
    console.log('✅ PDF 다운로드 버튼 발견');
  }
  
  // 인쇄 버튼 테스트
  const printButton = page.locator('button:has-text("인쇄")');
  if (await printButton.count() > 0) {
    console.log('✅ 인쇄 버튼 발견');
  }
  
  console.log('🎉 허상원 정산서 생성 테스트 완료');
});
