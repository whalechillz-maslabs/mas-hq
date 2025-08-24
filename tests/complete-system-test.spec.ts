import { test, expect } from '@playwright/test';

test.describe('완전한 시스템 테스트', () => {
  
  test('권한 시스템 및 출근 관리 테스트', async ({ page }) => {
    console.log('=== 권한 시스템 및 출근 관리 테스트 시작 ===');
    
    // 1. 이은정(매니저) 로그인
    await page.goto('http://localhost:3001/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-3243-3099');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('text=이은정')).toBeVisible();
    
    // 2. 출근 관리 메뉴 확인
    await expect(page.locator('text=출근 관리')).toBeVisible();
    await page.click('text=출근 관리');
    await page.waitForURL('**/attendance');
    
    // 출근 관리 페이지 요소 확인
    await expect(page.locator('h1:has-text("출근 관리")')).toBeVisible();
    await expect(page.locator('text=오늘의 근무 스케줄')).toBeVisible();
    await expect(page.locator('text=이번 달 출근 기록')).toBeVisible();
    
    // 3. 스케줄 페이지 이동
    await page.goto('http://localhost:3001/schedules');
    await page.waitForLoadState('networkidle');
    
    // 권한별 설명 확인 (매니저)
    await expect(page.locator('text=매니저: 본인 과거 스케줄 수정 가능')).toBeVisible();
    
    // 4. 일괄 입력 기능 테스트
    await page.click('text=일괄입력');
    await expect(page.locator('text=일괄 스케줄 입력')).toBeVisible();
    
    // 시간 설정
    await page.fill('input[type="time"]:first-of-type', '10:00');
    await page.fill('input[type="time"]:last-of-type', '15:00');
    
    // 요일 선택 (월, 화, 수)
    await page.click('button:has-text("월")');
    await page.click('button:has-text("화")'); 
    await page.click('button:has-text("수")');
    
    await page.click('button:has-text("적용")');
    await page.waitForTimeout(2000);
    
    // 스케줄이 추가되었는지 확인
    await expect(page.locator('.bg-blue-300').first()).toBeVisible();
    
    console.log('매니저 테스트 완료');
  });

  test('관리자 권한 테스트', async ({ page }) => {
    console.log('=== 관리자 권한 테스트 시작 ===');
    
    // 1. 관리자 로그인
    await page.goto('http://localhost:3001/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    
    // 2. 스케줄 페이지에서 권한 확인
    await page.goto('http://localhost:3001/schedules');
    await page.waitForLoadState('networkidle');
    
    // 관리자 권한 설명 확인
    await expect(page.locator('text=관리자: 모든 스케줄 수정 가능')).toBeVisible();
    
    // 3. 관리자 전용 메뉴 확인
    await page.goto('http://localhost:3001/dashboard');
    await expect(page.locator('text=관리자 전용 기능')).toBeVisible();
    await expect(page.locator('text=직원 관리')).toBeVisible();
    await expect(page.locator('text=부서 관리')).toBeVisible();
    
    console.log('관리자 테스트 완료');
  });

  test('박진(일반직원) 권한 테스트', async ({ page }) => {
    console.log('=== 일반직원 권한 테스트 시작 ===');
    
    // 1. 박진 로그인
    await page.goto('http://localhost:3001/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-1234-5678');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('text=박진')).toBeVisible();
    
    // 2. 관리자 메뉴가 보이지 않는지 확인
    await expect(page.locator('text=관리자 전용 기능')).not.toBeVisible();
    
    // 3. 스케줄 페이지에서 권한 확인
    await page.goto('http://localhost:3001/schedules');
    await page.waitForLoadState('networkidle');
    
    // 일반직원 권한 설명 확인
    await expect(page.locator('text=직원: 미래 스케줄만 수정 가능')).toBeVisible();
    
    // 4. 출근 관리 페이지 접근 확인
    await page.click('text=출근 관리');
    await page.waitForURL('**/attendance');
    await expect(page.locator('text=출근 관리')).toBeVisible();
    
    console.log('일반직원 테스트 완료');
  });

  test('스케줄 시스템 개선 테스트', async ({ page }) => {
    console.log('=== 스케줄 시스템 개선 테스트 시작 ===');
    
    // 이은정으로 로그인
    await page.goto('http://localhost:3001/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-3243-3099');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard');
    await page.goto('http://localhost:3001/schedules');
    await page.waitForLoadState('networkidle');
    
    // 1. 주차 표시 확인
    await expect(page.locator('text~=주차')).toBeVisible();
    
    // 2. 월간 보기로 전환하여 일자 표시 확인
    await page.click('button:has-text("월간")');
    await page.waitForTimeout(1000);
    
    // 월간 뷰에서 날짜 표시 확인
    const dateElements = page.locator('.aspect-square .absolute');
    await expect(dateElements.first()).toBeVisible();
    
    // 3. 주간 보기로 돌아가서 스케줄 클릭 테스트
    await page.click('button:has-text("주간")');
    await page.waitForTimeout(1000);
    
    // 미래 시간 슬롯 클릭 테스트 (11시)
    const timeSlots = page.locator('.grid-cols-8 button');
    const elevenAMSlot = timeSlots.nth(10); // 대략적인 위치
    
    if (await elevenAMSlot.isVisible()) {
      await elevenAMSlot.click();
      await page.waitForTimeout(1000);
      
      // 스케줄이 생성되었는지 확인
      await expect(page.locator('.bg-blue-300').first()).toBeVisible();
    }
    
    // 4. 일괄 입력으로 10시-18시 연속 스케줄 테스트
    await page.click('text=일괄입력');
    await page.fill('input[type="time"]:first-of-type', '10:00');
    await page.fill('input[type="time"]:last-of-type', '18:00');
    
    // 목요일 선택
    await page.click('button:has-text("목")');
    await page.click('button:has-text("적용")');
    await page.waitForTimeout(2000);
    
    console.log('스케줄 시스템 개선 테스트 완료');
  });
});



