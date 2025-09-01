import { test, expect } from '@playwright/test';

test.describe('대시보드 네비게이션 변경사항 테스트', () => {
  test('상단 네비게이션에서 직원별 스케줄 관리 버튼이 제거되었는지 확인', async ({ page }) => {
    console.log('🚀 대시보드 네비게이션 테스트 시작');
    
    // 대시보드 페이지로 이동
    await page.goto('https://www.maslabs.kr/dashboard');
    console.log('✅ 대시보드 페이지 접근');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 상단 헤더에서 "직원별 스케줄 관리" 버튼이 없는지 확인
    const adminButton = page.locator('button[title="직원별 스케줄 관리"]');
    await expect(adminButton).not.toBeVisible();
    console.log('✅ 상단 네비게이션에서 직원별 스케줄 관리 버튼이 제거됨');
    
    // 페이지에 "직원별 스케줄 관리" 텍스트가 있는지 확인 (하단에 있어야 함)
    const scheduleText = page.locator('text=직원별 스케줄 관리');
    await expect(scheduleText).toBeVisible();
    console.log('✅ 직원별 스케줄 관리 텍스트가 페이지에 존재함');
    
    console.log('✅ 대시보드 네비게이션 테스트 완료');
  });
  
  test('하단에 직원별 스케줄 관리 카드가 있는지 확인', async ({ page }) => {
    console.log('🔍 하단 직원별 스케줄 관리 카드 확인');
    
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 직원별 스케줄 관리 텍스트가 있는지 확인
    const scheduleText = page.locator('text=직원별 스케줄 관리');
    await expect(scheduleText).toBeVisible();
    
    // 직원별 스케줄 관리 카드의 설명 텍스트 확인
    const cardDescription = page.locator('text=모든 직원의 스케줄 관리');
    await expect(cardDescription).toBeVisible();
    
    console.log('✅ 하단 직원별 스케줄 관리 카드 확인 완료');
  });
  
  test('페이지 구조 전체 확인', async ({ page }) => {
    console.log('🔍 페이지 구조 전체 확인');
    
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const pageTitle = page.locator('h1:has-text("MASLABS")');
    await expect(pageTitle).toBeVisible();
    
    // 사용자 인사말 확인
    const greeting = page.locator('text=/Hi,.*님/');
    await expect(greeting).toBeVisible();
    
    // 오늘의 미션 섹션 확인
    const missionSection = page.locator('h2:has-text("오늘의 미션")');
    await expect(missionSection).toBeVisible();
    
    // KPI 섹션 확인
    const kpiSection = page.locator('h2:has-text("KPI 하이라이트")');
    await expect(kpiSection).toBeVisible();
    
    console.log('✅ 페이지 구조 전체 확인 완료');
  });
});
