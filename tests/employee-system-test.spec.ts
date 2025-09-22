import { test, expect } from '@playwright/test';

test.describe('직원 관리 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 시작 전 로그인
    await page.goto('http://localhost:3000');
    
    // 로그인 (김탁수 계정 사용)
    await page.fill('input[name="employee_id"]', 'MASLABS-001');
    await page.fill('input[name="pin_code"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 성공 확인
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('직원 목록 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/employee-management');
    
    // 직원 목록이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('직원 관리');
    
    // 각 직원 정보 확인
    const expectedEmployees = [
      { name: '김탁수', id: 'MASLABS-001', type: 'full_time', salary: '3,000,000' },
      { name: '이은정', id: 'MASLABS-002', type: 'full_time', salary: '2,000,000' },
      { name: '허상원', id: 'MASLABS-003', type: 'part_time', wage: '13,000' },
      { name: '최형호', id: 'MASLABS-004', type: 'full_time', salary: '1,680,000' },
      { name: '나수진', id: 'MASLABS-005', type: 'full_time', salary: '1,000,000' },
      { name: '하상희', id: 'MASLABS-006', type: 'part_time', wage: '12,000' }
    ];
    
    for (const employee of expectedEmployees) {
      await expect(page.locator(`text=${employee.name}`)).toBeVisible();
      await expect(page.locator(`text=${employee.id}`)).toBeVisible();
      
      if (employee.type === 'full_time') {
        await expect(page.locator(`text=${employee.salary}`)).toBeVisible();
      } else {
        await expect(page.locator(`text=${employee.wage}`)).toBeVisible();
      }
    }
  });

  test('시급 관리 페이지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/hourly-wages');
    
    // 시급 관리 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('시급 관리');
    
    // 파트타임 직원들의 시급 데이터 확인
    await expect(page.locator('text=허상원')).toBeVisible();
    await expect(page.locator('text=13,000원')).toBeVisible();
    
    await expect(page.locator('text=하상희')).toBeVisible();
    await expect(page.locator('text=12,000원')).toBeVisible();
    
    // 최형호의 과거 시급 데이터 확인
    await expect(page.locator('text=최형호')).toBeVisible();
    await expect(page.locator('text=13,000원')).toBeVisible();
    await expect(page.locator('text=12,000원')).toBeVisible();
  });

  test('급여 조회 페이지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/salary');
    
    // 급여 조회 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('급여 조회');
    
    // 직원 선택 드롭다운 확인
    await expect(page.locator('select[name="employee_id"]')).toBeVisible();
    
    // 김탁수 선택
    await page.selectOption('select[name="employee_id"]', 'MASLABS-001');
    
    // 급여 정보 확인
    await expect(page.locator('text=김탁수')).toBeVisible();
    await expect(page.locator('text=3,000,000원')).toBeVisible();
  });

  test('출근 관리 페이지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/attendance-management');
    
    // 출근 관리 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('출근 관리');
    
    // 직원 목록이 표시되는지 확인
    await expect(page.locator('text=김탁수')).toBeVisible();
    await expect(page.locator('text=이은정')).toBeVisible();
    await expect(page.locator('text=허상원')).toBeVisible();
    await expect(page.locator('text=최형호')).toBeVisible();
    await expect(page.locator('text=나수진')).toBeVisible();
    await expect(page.locator('text=하상희')).toBeVisible();
  });

  test('스케줄 관리 페이지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/schedules');
    
    // 스케줄 관리 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('근무 스케줄');
    
    // 주간/월간 뷰 전환 버튼 확인
    await expect(page.locator('button:has-text("주간")')).toBeVisible();
    await expect(page.locator('button:has-text("월간")')).toBeVisible();
    
    // 오늘로 가기 버튼 확인
    await expect(page.locator('button:has-text("오늘로 가기")')).toBeVisible();
  });

  test('급여 명세서 생성 페이지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/payslip-generator');
    
    // 급여 명세서 생성 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('급여 명세서 생성');
    
    // 직원 선택 드롭다운 확인
    await expect(page.locator('select[name="employee_id"]')).toBeVisible();
    
    // 김탁수 선택
    await page.selectOption('select[name="employee_id"]', 'MASLABS-001');
    
    // 급여 정보 확인
    await expect(page.locator('text=김탁수')).toBeVisible();
    await expect(page.locator('text=3,000,000원')).toBeVisible();
  });


  test('모든 페이지 네비게이션 확인', async ({ page }) => {
    // 대시보드에서 각 페이지로 이동 테스트
    await page.goto('http://localhost:3000/dashboard');
    
    // 직원 관리 링크
    await page.click('a[href="/admin/employee-management"]');
    await expect(page).toHaveURL(/.*employee-management/);
    
    // 시급 관리 링크
    await page.click('a[href="/admin/hourly-wages"]');
    await expect(page).toHaveURL(/.*hourly-wages/);
    
    // 출근 관리 링크
    await page.click('a[href="/admin/attendance-management"]');
    await expect(page).toHaveURL(/.*attendance-management/);
    
    // 급여 조회 링크
    await page.click('a[href="/salary"]');
    await expect(page).toHaveURL(/.*salary/);
    
    // 스케줄 관리 링크
    await page.click('a[href="/schedules"]');
    await expect(page).toHaveURL(/.*schedules/);
  });
});
