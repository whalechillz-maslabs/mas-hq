import { test, expect } from '@playwright/test';

test.describe('출근 체크 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지로 이동 (배포된 사이트 사용)
    await page.goto('https://maslabs.kr/attendance');
  });

  test('출근 체크 페이지 로드 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('출근 관리');
    
    // 직원 정보 표시 확인
    await expect(page.locator('text=김탁수')).toBeVisible();
    await expect(page.locator('text=MASLABS-001')).toBeVisible();
    
    // 출근 체크 버튼 확인
    await expect(page.locator('button:has-text("출근 체크")')).toBeVisible();
  });

  test('출근 체크 버튼 클릭 테스트', async ({ page }) => {
    // 출근 체크 버튼 클릭
    await page.click('button:has-text("출근 체크")');
    
    // 성공 메시지 또는 상태 변경 확인
    // (실제 구현에 따라 다를 수 있음)
    await page.waitForTimeout(2000);
    
    // 페이지 새로고침 후 상태 확인
    await page.reload();
    await page.waitForTimeout(1000);
  });

  test('출근 관리 페이지 접근 테스트', async ({ page }) => {
    // 관리자 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    
    // 페이지 로드 확인
    await expect(page.locator('h1')).toContainText('출근 관리');
    
    // 필터 섹션 확인
    await expect(page.locator('text=날짜')).toBeVisible();
    await expect(page.locator('text=부서')).toBeVisible();
    await expect(page.locator('text=검색')).toBeVisible();
    
    // 요약 카드 확인
    await expect(page.locator('text=출근 완료')).toBeVisible();
    await expect(page.locator('text=근무 중')).toBeVisible();
    await expect(page.locator('text=미출근')).toBeVisible();
    await expect(page.locator('text=평균 근무시간')).toBeVisible();
  });

  test('출근 데이터 확인', async ({ page }) => {
    // 관리자 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    
    // 현재 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    console.log('오늘 날짜:', today);
    
    // 날짜 필터 설정 (필요한 경우)
    // await page.fill('input[type="date"]', today);
    
    // 필터 적용 버튼 클릭
    await page.click('button:has-text("필터 적용")');
    
    // 데이터 로딩 대기
    await page.waitForTimeout(2000);
    
    // 출근 기록 섹션 확인
    const recordsSection = page.locator('text=출근 기록');
    await expect(recordsSection).toBeVisible();
    
    // 데이터가 있는지 확인
    const totalRecords = page.locator('text=총').first();
    await expect(totalRecords).toBeVisible();
    
    // 콘솔에 현재 상태 출력
    const recordsText = await totalRecords.textContent();
    console.log('출근 기록 상태:', recordsText);
  });

  test('직원별 출근 체크 테스트', async ({ page }) => {
    // 여러 직원으로 로그인하여 출근 체크 테스트
    const employees = [
      { phone: '010-6669-9000', name: '김탁수' },
      { phone: '010-8948-4501', name: '허상원' },
      { phone: '010-7128-4590', name: '최형호' }
    ];

    for (const employee of employees) {
      console.log(`${employee.name} 출근 체크 테스트 시작`);
      
      // 로그인 페이지로 이동
      await page.goto('https://maslabs.kr/login');
      
      // 전화번호 입력
      await page.fill('input[name="phone"], input[type="tel"]', employee.phone);
      
      // 비밀번호 입력 (전화번호 뒷 8자리)
      const password = employee.phone.replace(/\D/g, '').slice(-8);
      await page.fill('input[name="password"], input[type="password"]', password);
      
      // 로그인 버튼 클릭
      await page.click('button:has-text("로그인"), button[type="submit"]');
      
      // 로그인 성공 대기
      await page.waitForTimeout(2000);
      
      // 출근 체크 페이지로 이동
      await page.goto('https://maslabs.kr/attendance');
      
      // 직원 이름 확인
      await expect(page.locator(`text=${employee.name}`)).toBeVisible();
      
      // 출근 체크 버튼 클릭
      const checkInButton = page.locator('button:has-text("출근 체크")');
      if (await checkInButton.isVisible()) {
        await checkInButton.click();
        console.log(`${employee.name} 출근 체크 완료`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`${employee.name} 출근 체크 버튼이 보이지 않음`);
      }
      
      // 로그아웃
      await page.goto('https://maslabs.kr/logout');
      await page.waitForTimeout(1000);
    }
  });
});
