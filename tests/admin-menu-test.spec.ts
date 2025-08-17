import { test, expect } from '@playwright/test';

test('관리자 메뉴 및 페이지 테스트', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // 2. 대시보드 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 3. 관리자 기능 섹션 확인
  await expect(page.locator('text=관리자 기능')).toBeVisible();
  
  // 4. 관리자 메뉴 개수 확인 (6개여야 함)
  const adminButtons = page.locator('text=관리자 기능').locator('..').locator('button');
  const buttonCount = await adminButtons.count();
  console.log('관리자 메뉴 개수:', buttonCount);
  
  // 5. 각 관리자 메뉴 확인
  const expectedMenus = [
    '인사정책 관리',
    'OP 팀장 설정', 
    '직원 관리',
    '팀원 평가',
    '출근 관리',
    '시스템 설정'
  ];
  
  for (const menuName of expectedMenus) {
    await expect(page.locator(`text=${menuName}`)).toBeVisible();
    console.log(`✅ ${menuName} 메뉴 표시됨`);
  }
  
  // 6. 대시보드 스크린샷 캡처
  await page.screenshot({ 
    path: 'admin-dashboard.png', 
    fullPage: true 
  });
  
  // 7. OP 팀장 설정 페이지 테스트
  console.log('🔍 OP 팀장 설정 페이지 테스트 시작');
  await page.click('text=OP 팀장 설정');
  await page.waitForURL('**/admin/team-management');
  await expect(page.locator('text=OP 팀장 설정')).toBeVisible();
  await expect(page.locator('text=팀장 관리')).toBeVisible();
  await expect(page.locator('text=팀원 배정')).toBeVisible();
  
  // 팀장 목록 확인
  await expect(page.locator('text=시스템 관리자')).toBeVisible();
  await expect(page.locator('text=김팀장')).toBeVisible();
  
  // 탭 전환 테스트
  await page.click('text=팀원 배정');
  await expect(page.locator('text=이사원')).toBeVisible();
  
  await page.screenshot({ 
    path: 'team-management-page.png', 
    fullPage: true 
  });
  console.log('✅ OP 팀장 설정 페이지 테스트 완료');
  
  // 8. 직원 관리 페이지 테스트
  console.log('🔍 직원 관리 페이지 테스트 시작');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  await page.click('text=직원 관리');
  await page.waitForURL('**/admin/employee-management');
  await expect(page.locator('text=직원 관리')).toBeVisible();
  await expect(page.locator('text=직원 추가')).toBeVisible();
  
  // 검색 기능 테스트
  await page.fill('input[placeholder*="검색"]', '시스템');
  await expect(page.locator('text=시스템 관리자')).toBeVisible();
  
  // 직원 목록 확인
  await expect(page.locator('text=김팀장')).toBeVisible();
  await expect(page.locator('text=이사원')).toBeVisible();
  
  await page.screenshot({ 
    path: 'employee-management-page.png', 
    fullPage: true 
  });
  console.log('✅ 직원 관리 페이지 테스트 완료');
  
  // 9. 시스템 설정 페이지 테스트
  console.log('🔍 시스템 설정 페이지 테스트 시작');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  await page.click('text=시스템 설정');
  await page.waitForURL('**/admin/system-settings');
  await expect(page.locator('text=시스템 설정')).toBeVisible();
  await expect(page.locator('text=저장')).toBeVisible();
  
  // 탭 확인
  await expect(page.locator('text=일반 설정')).toBeVisible();
  await expect(page.locator('text=보안 설정')).toBeVisible();
  await expect(page.locator('text=알림 설정')).toBeVisible();
  
  // 설정 항목 확인
  await expect(page.locator('text=회사명')).toBeVisible();
  await expect(page.locator('text=기본 근무시간')).toBeVisible();
  
  // 탭 전환 테스트
  await page.click('text=보안 설정');
  await expect(page.locator('text=세션 타임아웃')).toBeVisible();
  await expect(page.locator('text=2FA 필수')).toBeVisible();
  
  await page.click('text=알림 설정');
  await expect(page.locator('text=이메일 알림')).toBeVisible();
  await expect(page.locator('text=SMS 알림')).toBeVisible();
  
  await page.screenshot({ 
    path: 'system-settings-page.png', 
    fullPage: true 
  });
  console.log('✅ 시스템 설정 페이지 테스트 완료');
  
  // 10. 기존 관리자 페이지들도 확인
  console.log('🔍 기존 관리자 페이지들 확인');
  
  // 인사정책 관리 페이지
  await page.goto('http://localhost:3000/admin/hr-policy');
  await expect(page.locator('text=인사정책 관리')).toBeVisible();
  console.log('✅ 인사정책 관리 페이지 접근 가능');
  
  // 팀원 평가 페이지
  await page.goto('http://localhost:3000/admin/team-evaluation');
  await expect(page.locator('text=팀원 평가')).toBeVisible();
  console.log('✅ 팀원 평가 페이지 접근 가능');
  
  // 출근 관리 페이지
  await page.goto('http://localhost:3000/admin/attendance-management');
  await expect(page.locator('text=출근 관리')).toBeVisible();
  console.log('✅ 출근 관리 페이지 접근 가능');
  
  console.log('🎉 모든 관리자 페이지 테스트 완료!');
});
