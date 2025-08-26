import { test, expect } from '@playwright/test';

test.describe('스케줄 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    // 로그인 (올바른 전화번호 사용)
    await page.fill('input[name="phone"]', '010-6669-9000'); // 시스템 관리자 전화번호
    await page.fill('input[name="password"]', '66699000'); // 시스템 관리자 비밀번호
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/dashboard');
    console.log('✅ 로그인 완료');
    
    // 스케줄 페이지로 이동
    await page.goto('http://localhost:3000/schedules');
    await page.waitForLoadState('networkidle');
    console.log('✅ 스케줄 페이지 이동 완료');
  });

  test('스케줄 페이지 로드 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('근무 스케줄');
    
    // 주간/월간 토글 확인
    await expect(page.locator('text=주간')).toBeVisible();
    await expect(page.locator('text=월간')).toBeVisible();
    
    // 추가 버튼 확인
    await expect(page.locator('text=+ 추가')).toBeVisible();
    
    console.log('✅ 스케줄 페이지 로드 확인 완료');
  });

  test('스케줄 추가 기능 테스트', async ({ page }) => {
    // 8월 26일 15:00 시간대 클릭
    await page.locator('[data-date="2025-08-26"]').locator('[data-time="15:00"]').click();
    
    // 스케줄 추가 모달 확인
    await expect(page.locator('text=스케줄 추가')).toBeVisible();
    
    // 직원 선택 (박진)
    await page.selectOption('select[name="employee_id"]', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc');
    
    // 시간 설정
    await page.fill('input[name="scheduled_start"]', '15:00');
    await page.fill('input[name="scheduled_end"]', '16:00');
    
    // 메모 입력
    await page.fill('textarea[name="employee_note"]', 'Playwright 테스트로 추가됨');
    
    // 저장 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인
    await expect(page.locator('text=스케줄이 성공적으로 추가되었습니다')).toBeVisible();
    
    // 새로 추가된 스케줄 확인
    await expect(page.locator('[data-date="2025-08-26"]').locator('[data-time="15:00"]')).toContainText('박진(JIN)');
    
    console.log('✅ 스케줄 추가 기능 테스트 완료');
  });

  test('같은 날짜에 여러 스케줄 추가 테스트', async ({ page }) => {
    // 8월 26일 16:00 시간대에 첫 번째 스케줄 추가
    await page.locator('[data-date="2025-08-26"]').locator('[data-time="16:00"]').click();
    
    await page.selectOption('select[name="employee_id"]', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc');
    await page.fill('input[name="scheduled_start"]', '16:00');
    await page.fill('input[name="scheduled_end"]', '17:00');
    await page.fill('textarea[name="employee_note"]', '첫 번째 스케줄');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=스케줄이 성공적으로 추가되었습니다')).toBeVisible();
    
    // 8월 26일 17:00 시간대에 두 번째 스케줄 추가 (같은 직원, 같은 날짜, 다른 시간)
    await page.locator('[data-date="2025-08-26"]').locator('[data-time="17:00"]').click();
    
    await page.selectOption('select[name="employee_id"]', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc');
    await page.fill('input[name="scheduled_start"]', '17:00');
    await page.fill('input[name="scheduled_end"]', '18:00');
    await page.fill('textarea[name="employee_note"]', '두 번째 스케줄');
    await page.click('button[type="submit"]');
    
    // 두 번째 스케줄도 성공적으로 추가되어야 함
    await expect(page.locator('text=스케줄이 성공적으로 추가되었습니다')).toBeVisible();
    
    // 두 스케줄 모두 표시되는지 확인
    await expect(page.locator('[data-date="2025-08-26"]').locator('[data-time="16:00"]')).toContainText('박진(JIN)');
    await expect(page.locator('[data-date="2025-08-26"]').locator('[data-time="17:00"]')).toContainText('박진(JIN)');
    
    console.log('✅ 같은 날짜에 여러 스케줄 추가 테스트 완료');
  });

  test('스케줄 수정 기능 테스트', async ({ page }) => {
    // 기존 스케줄 클릭 (8월 26일 10:00 박진 스케줄)
    await page.locator('[data-date="2025-08-26"]').locator('[data-time="10:00"]').click();
    
    // 스케줄 수정 모달 확인
    await expect(page.locator('text=스케줄 수정')).toBeVisible();
    
    // 메모 수정
    await page.fill('textarea[name="employee_note"]', 'Playwright 테스트로 수정됨');
    
    // 저장 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인
    await expect(page.locator('text=스케줄이 성공적으로 수정되었습니다')).toBeVisible();
    
    console.log('✅ 스케줄 수정 기능 테스트 완료');
  });

  test('스케줄 삭제 기능 테스트', async ({ page }) => {
    // 기존 스케줄 클릭
    await page.locator('[data-date="2025-08-26"]').locator('[data-time="11:00"]').click();
    
    // 삭제 버튼 클릭
    await page.click('button[data-action="delete"]');
    
    // 삭제 확인 다이얼로그
    await expect(page.locator('text=스케줄을 삭제하시겠습니까?')).toBeVisible();
    
    // 확인 버튼 클릭
    await page.click('button[data-action="confirm-delete"]');
    
    // 성공 메시지 확인
    await expect(page.locator('text=스케줄이 성공적으로 삭제되었습니다')).toBeVisible();
    
    console.log('✅ 스케줄 삭제 기능 테스트 완료');
  });
});
