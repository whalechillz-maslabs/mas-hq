import { test, expect } from '@playwright/test';

test.describe('부서 관리 시스템 테스트', () => {
  test('관리자 부서 관리 기능 확인', async ({ page }) => {
    console.log('🔍 관리자 부서 관리 기능 테스트 시작');
    
    // 1. 관리자로 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    await page.fill('input[placeholder="핀번호 4자리"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ 관리자 로그인 완료');
    
    // 2. 부서 관리 페이지로 이동
    await page.click('text=부서 관리');
    await page.waitForURL('**/admin/department-management');
    console.log('✅ 부서 관리 페이지 이동 완료');
    
    // 3. 부서 목록 확인
    await expect(page.locator('text=마스골프팀')).toBeVisible();
    await expect(page.locator('text=싱싱팀')).toBeVisible();
    await expect(page.locator('text=마스팀')).toBeVisible();
    console.log('✅ 부서 목록 확인 완료');
    
    // 4. 새 부서 추가 버튼 확인
    await expect(page.locator('text=새 부서 추가')).toBeVisible();
    console.log('✅ 새 부서 추가 버튼 확인 완료');
    
    // 5. 스크린샷 캡처
    await page.screenshot({ path: 'department-management-test.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 부서 관리 시스템 테스트 완료!');
  });

  test('부서 추가 기능 테스트', async ({ page }) => {
    console.log('🔍 부서 추가 기능 테스트 시작');
    
    // 1. 관리자로 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    await page.fill('input[placeholder="핀번호 4자리"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ 관리자 로그인 완료');
    
    // 2. 부서 관리 페이지로 이동
    await page.click('text=부서 관리');
    await page.waitForURL('**/admin/department-management');
    console.log('✅ 부서 관리 페이지 이동 완료');
    
    // 3. 새 부서 추가 버튼 클릭
    await page.click('text=새 부서 추가');
    console.log('✅ 새 부서 추가 모달 열기 완료');
    
    // 4. 폼 확인
    await expect(page.locator('input[placeholder="예: 마스골프팀"]')).toBeVisible();
    await expect(page.locator('input[placeholder="예: MASGOLF"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder="부서에 대한 설명을 입력하세요..."]')).toBeVisible();
    console.log('✅ 부서 추가 폼 확인 완료');
    
    // 5. 스크린샷 캡처
    await page.screenshot({ path: 'department-add-form.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 부서 추가 기능 테스트 완료!');
  });
});
