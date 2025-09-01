import { test, expect } from '@playwright/test';

test('종합 문제 진단 - 관리자 기능, 출근 관리, 스케줄 추가 문제', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  console.log('=== 종합 문제 진단 시작 ===');
  
  // 1. 대시보드에서 관리자 기능 확인
  console.log('=== 1. 대시보드 관리자 기능 확인 ===');
  
  // 대시보드로 이동
  await page.goto('https://maslabs.kr/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 페이지 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin');
  if (await loadingElement.isVisible()) {
    console.log('대시보드가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 사용자 정보 확인
  const userInfo = page.locator('text=/김탁수님/');
  if (await userInfo.isVisible()) {
    console.log('✅ 사용자 정보가 표시됩니다:', await userInfo.textContent());
  } else {
    console.log('❌ 사용자 정보가 표시되지 않습니다');
  }
  
  // 관리자 관련 메뉴/링크 찾기
  const adminLinks = page.locator('a[href*="admin"]');
  const employeeLinks = page.locator('a[href*="employee"]');
  const adminTextLinks = page.locator('text=/직원별|관리자/');
  
  const adminLinkCount = await adminLinks.count();
  const employeeLinkCount = await employeeLinks.count();
  const adminTextLinkCount = await adminTextLinks.count();
  
  console.log('관리자 관련 링크 수:', adminLinkCount + employeeLinkCount + adminTextLinkCount);
  
  if (adminLinkCount > 0) {
    for (let i = 0; i < adminLinkCount; i++) {
      const link = adminLinks.nth(i);
      const linkText = await link.textContent();
      const linkHref = await link.getAttribute('href');
      console.log(`관리자 링크 ${i + 1}: "${linkText}" -> ${linkHref}`);
    }
  }
  
  if (employeeLinkCount > 0) {
    for (let i = 0; i < employeeLinkCount; i++) {
      const link = employeeLinks.nth(i);
      const linkText = await link.textContent();
      const linkHref = await link.getAttribute('href');
      console.log(`직원 관련 링크 ${i + 1}: "${linkText}" -> ${linkHref}`);
    }
  }
  
  if (adminTextLinkCount > 0) {
    for (let i = 0; i < adminTextLinkCount; i++) {
      const link = adminTextLinks.nth(i);
      const linkText = await link.textContent();
      console.log(`관리자 텍스트 링크 ${i + 1}: "${linkText}"`);
    }
  }
  
  if (adminLinkCount === 0 && employeeLinkCount === 0 && adminTextLinkCount === 0) {
    console.log('❌ 관리자 관련 링크를 찾을 수 없습니다');
  }
  
  // 네비게이션 메뉴 확인
  const navMenu = page.locator('nav, [role="navigation"], .sidebar, .menu');
  const navCount = await navMenu.count();
  console.log('네비게이션 메뉴 수:', navCount);
  
  if (navCount > 0) {
    for (let i = 0; i < navCount; i++) {
      const nav = navMenu.nth(i);
      const navText = await nav.textContent();
      console.log(`네비게이션 ${i + 1}: ${navText?.substring(0, 100)}`);
    }
  }
  
  // 2. 출근 관리 페이지 오류 확인
  console.log('=== 2. 출근 관리 페이지 오류 확인 ===');
  
  await page.goto('https://maslabs.kr/attendance');
  await page.waitForLoadState('networkidle');
  
  // 오류 메시지 확인
  const errorMessage = page.locator('text=/Application error|client-side exception/');
  if (await errorMessage.isVisible()) {
    console.log('❌ 출근 관리 페이지에서 오류가 발생했습니다:', await errorMessage.textContent());
  } else {
    console.log('✅ 출근 관리 페이지가 정상적으로 로드되었습니다');
  }
  
  // 콘솔 오류 확인
  const consoleErrors = await page.evaluate(() => {
    return (window as any).consoleErrors || [];
  });
  
  if (consoleErrors.length > 0) {
    console.log('콘솔 오류:', consoleErrors);
  }
  
  // 3. 스케줄 추가 페이지 문제 확인
  console.log('=== 3. 스케줄 추가 페이지 문제 확인 ===');
  
  await page.goto('https://maslabs.kr/schedules/add');
  await page.waitForLoadState('networkidle');
  
  // 페이지 로딩 상태 확인
  if (await loadingElement.isVisible()) {
    console.log('스케줄 추가 페이지가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 사용자 정보 표시 확인
  const scheduleUserInfo = page.locator('text=/김탁수.*WHA/');
  if (await scheduleUserInfo.isVisible()) {
    console.log('✅ 스케줄 추가 페이지에서 사용자 정보가 표시됩니다:', await scheduleUserInfo.textContent());
  } else {
    console.log('❌ 스케줄 추가 페이지에서 사용자 정보가 표시되지 않습니다');
  }
  
  // 기존 스케줄 섹션 확인
  const existingScheduleSection = page.locator('text=기존 스케줄');
  if (await existingScheduleSection.isVisible()) {
    console.log('✅ 기존 스케줄 섹션이 표시됩니다');
    
    // 기존 스케줄 메시지 확인
    const noScheduleMessage = page.locator('text=해당 날짜에 등록된 스케줄이 없습니다');
    if (await noScheduleMessage.isVisible()) {
      console.log('✅ "등록된 스케줄이 없습니다" 메시지가 표시됩니다');
    } else {
      console.log('❌ "등록된 스케줄이 없습니다" 메시지가 표시되지 않습니다');
    }
  } else {
    console.log('❌ 기존 스케줄 섹션이 표시되지 않습니다');
  }
  
  // 시간대별 근무자 현황 확인
  const workerStatusSection = page.locator('text=시간대별 근무자 현황');
  if (await workerStatusSection.isVisible()) {
    console.log('✅ 시간대별 근무자 현황 섹션이 표시됩니다');
    
    // 각 시간대별 인원 수 확인
    const timeSlots = page.locator('div[class*="text-center"]');
    const timeSlotCount = await timeSlots.count();
    console.log('시간대별 슬롯 수:', timeSlotCount);
    
    for (let i = 0; i < Math.min(timeSlotCount, 10); i++) {
      const slot = timeSlots.nth(i);
      const slotText = await slot.textContent();
      console.log(`시간대 슬롯 ${i + 1}: ${slotText}`);
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션이 표시되지 않습니다');
  }
  
  // 4. 직접 관리자 페이지 접근 시도
  console.log('=== 4. 직접 관리자 페이지 접근 시도 ===');
  
  await page.goto('https://maslabs.kr/admin/employee-schedules');
  await page.waitForLoadState('networkidle');
  
  // 접근 권한 확인
  const accessDenied = page.locator('text=/접근 권한이 없습니다|Access denied|권한이 없습니다/');
  const notFound = page.locator('text=/404|Not Found|페이지를 찾을 수 없습니다/');
  
  if (await accessDenied.isVisible()) {
    console.log('❌ 관리자 페이지에 접근 권한이 없습니다:', await accessDenied.textContent());
  } else if (await notFound.isVisible()) {
    console.log('❌ 관리자 페이지를 찾을 수 없습니다:', await notFound.textContent());
  } else {
    console.log('✅ 관리자 페이지에 접근할 수 있습니다');
    
    // 관리자 페이지 내용 확인
    const adminContent = page.locator('text=/직원별 스케줄 관리|Employee Schedule Management/');
    if (await adminContent.isVisible()) {
      console.log('✅ 관리자 기능이 표시됩니다:', await adminContent.textContent());
    } else {
      console.log('❌ 관리자 기능이 표시되지 않습니다');
    }
  }
  
  // 5. 사용자 역할 정보 확인
  console.log('=== 5. 사용자 역할 정보 확인 ===');
  
  // localStorage에서 사용자 정보 재확인
  const userRoleInfo = await page.evaluate(() => {
    const currentEmployee = localStorage.getItem('currentEmployee');
    if (currentEmployee) {
      const parsed = JSON.parse(currentEmployee);
      return {
        id: parsed.id,
        employee_id: parsed.employee_id,
        name: parsed.name,
        role_id: parsed.role_id,
        department_id: parsed.department_id,
        position_id: parsed.position_id
      };
    }
    return null;
  });
  
  console.log('사용자 역할 정보:', userRoleInfo);
  
  // 6. 네트워크 요청 분석
  console.log('=== 6. 네트워크 요청 분석 ===');
  
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('admin') || entry.name.includes('attendance') || entry.name.includes('schedules'))
      .map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('관리자/출근/스케줄 관련 네트워크 요청:', networkRequests);
  
  console.log('=== 종합 문제 진단 완료 ===');
});
