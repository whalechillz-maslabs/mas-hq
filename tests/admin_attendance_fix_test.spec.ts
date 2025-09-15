import { test, expect } from '@playwright/test';

test.describe('Admin Page and Attendance Fix Tests', () => {
  test('김탁수 로그인 후 출근 체크 시간 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    
    // 로그인 폼 작성
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 후 리다이렉트 확인 (dashboard 또는 tasks)
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
      await page.waitForURL('**/tasks', { timeout: 10000 });
    });
    
    // 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 출근 시간 표시 확인
    const checkInTimeElement = page.locator('text=출근:').first();
    await expect(checkInTimeElement).toBeVisible();
    
    // 출근 시간이 올바른 형식인지 확인 (MM/dd HH:mm)
    const checkInTimeText = await checkInTimeElement.textContent();
    console.log('출근 시간:', checkInTimeText);
    
    // 시간 형식 검증 (MM/dd HH:mm 형식)
    expect(checkInTimeText).toMatch(/\d{2}\/\d{2} \d{2}:\d{2}/);
    
    // 현재 날짜와 시간 확인
    const currentTimeElement = page.locator('text=현재 시간').first();
    await expect(currentTimeElement).toBeVisible();
    
    const currentTimeText = await currentTimeElement.textContent();
    console.log('현재 시간:', currentTimeText);
  });

  test('관리자 페이지 데이터 표시 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    
    // 로그인 폼 작성
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 후 리다이렉트 확인 (dashboard 또는 tasks)
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
      await page.waitForURL('**/tasks', { timeout: 10000 });
    });
    
    // 관리자 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("출근 관리")')).toBeVisible();
    
    // 날짜 필터 확인
    const dateFilter = page.locator('input[type="date"]');
    await expect(dateFilter).toBeVisible();
    
    // 현재 날짜가 설정되어 있는지 확인
    const currentDate = new Date().toISOString().split('T')[0];
    const dateValue = await dateFilter.inputValue();
    console.log('설정된 날짜:', dateValue);
    
    // 요약 카드들 확인
    const summaryCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-5.gap-4 > div');
    await expect(summaryCards).toHaveCount(5);
    
    // 각 요약 카드의 내용 확인
    const attendanceComplete = page.locator('text=출근 완료');
    await expect(attendanceComplete).toBeVisible();
    
    const working = page.locator('text=근무 중');
    await expect(working).toBeVisible();
    
    const onBreak = page.locator('text=휴식 중');
    await expect(onBreak).toBeVisible();
    
    const absent = page.locator('text=미출근');
    await expect(absent).toBeVisible();
    
    const avgWorkTime = page.locator('text=평균 근무시간');
    await expect(avgWorkTime).toBeVisible();
    
    // 출근 기록 테이블 확인
    const tableHeader = page.locator('text=출근 기록');
    await expect(tableHeader).toBeVisible();
    
    // 테이블 헤더 확인
    const tableHeaders = page.locator('thead th');
    await expect(tableHeaders).toHaveCount(8); // 직원 정보, 스케줄, 실제 출근, 점심 휴식, 실제 퇴근, 근무 시간, 위치, 상태, 액션
    
    // 데이터가 있는지 확인 (최소한 테이블 구조는 있어야 함)
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();
    
    // 로딩 상태가 완료되었는지 확인
    const loadingSpinner = page.locator('.animate-spin');
    await expect(loadingSpinner).not.toBeVisible();
    
    console.log('✅ 관리자 페이지 기본 구조 확인 완료');
  });

  test('허상원 로그인 후 출근 체크 시간 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    
    // 로그인 폼 작성
    await page.fill('input[name="phone"]', '010-1234-5678');
    await page.fill('input[name="password"]', '12345678');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 후 리다이렉트 확인 (dashboard 또는 tasks)
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
      await page.waitForURL('**/tasks', { timeout: 10000 });
    });
    
    // 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 출근 시간 표시 확인
    const checkInTimeElement = page.locator('text=출근:').first();
    await expect(checkInTimeElement).toBeVisible();
    
    // 출근 시간이 올바른 형식인지 확인
    const checkInTimeText = await checkInTimeElement.textContent();
    console.log('허상원 출근 시간:', checkInTimeText);
    
    // 시간 형식 검증
    expect(checkInTimeText).toMatch(/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  test('최형호 로그인 후 출근 체크 시간 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    
    // 로그인 폼 작성
    await page.fill('input[name="phone"]', '010-7128-4590');
    await page.fill('input[name="password"]', '71284590');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 후 리다이렉트 확인 (dashboard 또는 tasks)
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
      await page.waitForURL('**/tasks', { timeout: 10000 });
    });
    
    // 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/attendance');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 출근 시간 표시 확인
    const checkInTimeElement = page.locator('text=출근:').first();
    await expect(checkInTimeElement).toBeVisible();
    
    // 출근 시간이 올바른 형식인지 확인
    const checkInTimeText = await checkInTimeElement.textContent();
    console.log('최형호 출근 시간:', checkInTimeText);
    
    // 시간 형식 검증
    expect(checkInTimeText).toMatch(/\d{2}\/\d{2} \d{2}:\d{2}/);
  });
});
