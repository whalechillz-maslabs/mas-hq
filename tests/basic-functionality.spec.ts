import { test, expect } from '@playwright/test';

test('기본 기능 확인', async ({ page }) => {
  console.log('🔍 기본 기능 확인 시작');
  
  // 1. 로그인 페이지 접근
  await page.goto('http://localhost:3000/login');
  await expect(page.locator('text=직원 로그인')).toBeVisible();
  console.log('✅ 로그인 페이지 접근 성공');
  
  // 2. 핀번호 로그인 탭 확인
  await page.click('text=핀번호');
  await expect(page.locator('input[placeholder="0000"]')).toBeVisible();
  console.log('✅ 핀번호 로그인 탭 확인 성공');
  
  // 3. 핀번호 입력 및 로그인
  await page.fill('input[placeholder="0000"]', '1234');
  await page.click('button[type="submit"]');
  
  // 4. 대시보드로 이동 확인
  await page.waitForURL('**/dashboard');
  console.log('✅ 핀번호 로그인 성공');
  
  // 5. 스크린샷 캡처
  await page.screenshot({ 
    path: 'basic-functionality-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 기본 기능 확인 완료!');
});

test('관리자 페이지 접근 테스트', async ({ page }) => {
  console.log('🔍 관리자 페이지 접근 테스트 시작');
  
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 로그인 성공');
  
  // 2. 각 관리자 페이지 직접 접근
  const adminPages = [
    { path: '/admin/team-management', name: 'OP 팀장 설정' },
    { path: '/admin/employee-management', name: '직원 관리' },
    { path: '/admin/system-settings', name: '시스템 설정' },
    { path: '/admin/hr-policy', name: '인사정책 관리' },
    { path: '/admin/team-evaluation', name: '팀원 평가' },
    { path: '/admin/attendance-management', name: '출근 관리' }
  ];
  
  for (const pageInfo of adminPages) {
    console.log(`🔍 ${pageInfo.name} 페이지 테스트`);
    await page.goto(`http://localhost:3000${pageInfo.path}`);
    
    // 페이지 제목 확인
    await expect(page.locator(`text=${pageInfo.name}`)).toBeVisible();
    console.log(`✅ ${pageInfo.name} 페이지 접근 성공`);
    
    // 뒤로가기 버튼 확인
    await expect(page.locator('text=뒤로가기')).toBeVisible();
    console.log(`✅ ${pageInfo.name} 뒤로가기 버튼 확인`);
  }
  
  // 3. 개인정보 관리 페이지 접근
  console.log('🔍 개인정보 관리 페이지 테스트');
  await page.goto('http://localhost:3000/profile');
  await expect(page.locator('text=개인정보 관리')).toBeVisible();
  console.log('✅ 개인정보 관리 페이지 접근 성공');
  
  // 4. 스크린샷 캡처
  await page.screenshot({ 
    path: 'admin-pages-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 관리자 페이지 접근 테스트 완료!');
});
