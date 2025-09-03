import { test, expect } from '@playwright/test';

test('출근 관리 페이지 UX 개선 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 허상원 계정으로 로그인
  await page.fill('input[name="phone"]', '010-1234-5678');
  await page.fill('input[name="password"]', '12345678');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 출근 관리 페이지 UX 개선 테스트 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 1. 디버깅 정보 제거 확인
  console.log('=== 1. 디버깅 정보 제거 확인 ===');
  
  const debugInfo = page.locator('text=디버깅 정보');
  const debugInfoCount = await debugInfo.count();
  console.log('디버깅 정보 섹션 수:', debugInfoCount);
  
  if (debugInfoCount === 0) {
    console.log('✅ 디버깅 정보가 성공적으로 제거되었습니다.');
  } else {
    console.log('❌ 디버깅 정보가 여전히 표시되고 있습니다.');
  }
  
  // 2. 간단한 사용자 정보 확인
  console.log('=== 2. 간단한 사용자 정보 확인 ===');
  
  const userInfo = page.locator('text=사용자');
  const userInfoCount = await userInfo.count();
  console.log('사용자 정보 섹션 수:', userInfoCount);
  
  if (userInfoCount > 0) {
    console.log('✅ 간단한 사용자 정보가 표시되고 있습니다.');
    
    // 사용자 이름과 ID 확인
    const userName = await page.locator('.font-medium.text-gray-900').first().textContent();
    const userId = await page.locator('.text-sm.text-gray-600').first().textContent();
    console.log(`사용자 이름: ${userName}`);
    console.log(`사용자 ID: ${userId}`);
  } else {
    console.log('❌ 사용자 정보가 표시되지 않고 있습니다.');
  }
  
  // 3. 스케줄 그룹화 확인
  console.log('=== 3. 스케줄 그룹화 확인 ===');
  
  const scheduleGroups = page.locator('.bg-white.rounded-lg.border.p-4.shadow-sm');
  const groupCount = await scheduleGroups.count();
  console.log('스케줄 그룹 수:', groupCount);
  
  if (groupCount > 0) {
    console.log('✅ 스케줄이 그룹화되어 표시되고 있습니다.');
    
    // 첫 번째 그룹의 내용 확인
    const firstGroup = scheduleGroups.first();
    
    // 시간대 범위 확인
    const timeRange = await firstGroup.locator('.text-lg.font-semibold.text-gray-900').textContent();
    console.log(`첫 번째 그룹 시간대: ${timeRange}`);
    
    // 상태 확인
    const status = await firstGroup.locator('.px-3.py-1.rounded-full.text-sm.font-medium').textContent();
    console.log(`첫 번째 그룹 상태: ${status}`);
    
    // 시간대 개수 확인
    const slotCount = await firstGroup.locator('.text-sm.text-gray-500').first().textContent();
    console.log(`첫 번째 그룹 시간대 개수: ${slotCount}`);
    
    // 진행률 확인
    const progress = await firstGroup.locator('.text-sm.text-gray-600').first().textContent();
    console.log(`첫 번째 그룹 진행률: ${progress}`);
    
  } else {
    console.log('❌ 스케줄 그룹이 표시되지 않고 있습니다.');
  }
  
  // 4. 개별 스케줄 버튼 확인
  console.log('=== 4. 개별 스케줄 버튼 확인 ===');
  
  const checkInButtons = page.locator('button:has-text("출근")');
  const checkOutButtons = page.locator('button:has-text("퇴근")');
  
  const checkInCount = await checkInButtons.count();
  const checkOutCount = await checkOutButtons.count();
  
  console.log('출근 버튼 수:', checkInCount);
  console.log('퇴근 버튼 수:', checkOutCount);
  
  if (checkInCount > 0 || checkOutCount > 0) {
    console.log('✅ 개별 스케줄 관리 버튼이 표시되고 있습니다.');
  } else {
    console.log('❌ 개별 스케줄 관리 버튼이 표시되지 않고 있습니다.');
  }
  
  // 5. 전체적인 UI 개선 확인
  console.log('=== 5. 전체적인 UI 개선 확인 ===');
  
  // 불필요한 정보가 제거되었는지 확인
  const uuidInfo = page.locator('text=UUID');
  const uuidCount = await uuidInfo.count();
  console.log('UUID 정보 표시 여부:', uuidCount > 0 ? '❌ 여전히 표시됨' : '✅ 제거됨');
  
  const scheduleDetail = page.locator('text=스케줄 데이터 상세');
  const detailCount = await scheduleDetail.count();
  console.log('스케줄 데이터 상세 표시 여부:', detailCount > 0 ? '❌ 여전히 표시됨' : '✅ 제거됨');
  
  // 6. 최종 스크린샷 저장
  console.log('=== 6. 최종 스크린샷 저장 ===');
  
  await page.screenshot({ path: 'playwright-report/attendance-ux-improvement.png', fullPage: true });
  console.log('✅ 개선된 출근 관리 페이지 스크린샷 저장');
  
  console.log('=== 출근 관리 페이지 UX 개선 테스트 완료 ===');
});
