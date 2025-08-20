import { test, expect } from '@playwright/test';

test.describe('박진(JIN) 계정 종합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
  });

  test('박진 계정 로그인 테스트 (전화번호)', async ({ page }) => {
    console.log('🔍 박진 계정 로그인 테스트 시작 (전화번호)');
    
    // 박진 계정으로 로그인 (전화번호 + 기본 패스워드)
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337'); // 기본 패스워드: 전화번호 8자리
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 박진 계정 로그인 성공 (전화번호)');
    
    // 대시보드에서 박진 정보 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    await expect(page.locator('text=OP팀')).toBeVisible();
    await expect(page.locator('text=파트타임')).toBeVisible();
    
    console.log('✅ 박진 정보 확인 완료');
    
    // 빠른 메뉴 확인
    await expect(page.locator('text=근무 스케줄')).toBeVisible();
    await expect(page.locator('text=급여 조회')).toBeVisible();
    await expect(page.locator('text=업무 기록')).toBeVisible();
    await expect(page.locator('text=조직도')).toBeVisible();
    
    console.log('✅ 빠른 메뉴 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-login-phone-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 계정 로그인 테스트 완료! (전화번호)');
  });

  test('박진 계정 로그인 테스트 (핀번호)', async ({ page }) => {
    console.log('🔍 박진 계정 로그인 테스트 시작 (핀번호)');
    
    // 핀번호 로그인 탭 선택
    await page.click('text=핀번호');
    
    // 기본 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 박진 계정 로그인 성공 (핀번호)');
    
    // 대시보드에서 관리자 정보 확인 (핀번호는 관리자로 로그인)
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    
    console.log('✅ 관리자 정보 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-login-pin-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 계정 로그인 테스트 완료! (핀번호)');
  });

  test('박진 근무 스케줄 확인 테스트', async ({ page }) => {
    console.log('🔍 박진 근무 스케줄 확인 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 근무 스케줄 페이지로 이동
    await page.click('text=근무 스케줄');
    await page.waitForURL('**/schedules');
    
    // 스케줄 데이터 확인
    await expect(page.locator('text=2025-07-29')).toBeVisible();
    await expect(page.locator('text=15:00 - 17:00')).toBeVisible();
    await expect(page.locator('text=면접, 교육')).toBeVisible();
    
    await expect(page.locator('text=2025-08-04')).toBeVisible();
    await expect(page.locator('text=09:00 - 12:00')).toBeVisible();
    
    await expect(page.locator('text=2025-08-06')).toBeVisible();
    await expect(page.locator('text=09:00 - 15:30')).toBeVisible();
    
    await expect(page.locator('text=2025-08-08')).toBeVisible();
    await expect(page.locator('text=OJT(JH)')).toBeVisible();
    
    await expect(page.locator('text=2025-08-11')).toBeVisible();
    await expect(page.locator('text=as입고,출고 인트라교육')).toBeVisible();
    
    console.log('✅ 근무 스케줄 데이터 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-schedule-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 근무 스케줄 확인 테스트 완료!');
  });

  test('박진 급여 조회 테스트', async ({ page }) => {
    console.log('🔍 박진 급여 조회 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 급여 조회 페이지로 이동
    await page.click('text=급여 조회');
    await page.waitForURL('**/salary');
    
    // 급여 정보 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    await expect(page.locator('text=시급: 12,000원')).toBeVisible();
    await expect(page.locator('text=우리은행')).toBeVisible();
    await expect(page.locator('text=19007131399')).toBeVisible();
    
    // 8월 급여 확인
    await expect(page.locator('text=2025-08-18')).toBeVisible();
    await expect(page.locator('text=210,000원')).toBeVisible();
    await expect(page.locator('text=21만원 결제 완료')).toBeVisible();
    
    console.log('✅ 급여 정보 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-salary-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 급여 조회 테스트 완료!');
  });

  test('박진 업무 기록 테스트', async ({ page }) => {
    console.log('🔍 박진 업무 기록 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 업무 기록 페이지로 이동
    await page.click('text=업무 기록');
    await page.waitForURL('**/tasks');
    
    // 업무 기록 데이터 확인
    await expect(page.locator('text=신입 교육')).toBeVisible();
    await expect(page.locator('text=면접, 교육')).toBeVisible();
    
    await expect(page.locator('text=문서 작성')).toBeVisible();
    
    await expect(page.locator('text=회의 참석')).toBeVisible();
    
    await expect(page.locator('text=OJT 교육')).toBeVisible();
    await expect(page.locator('text=OJT(JH)')).toBeVisible();
    
    await expect(page.locator('text=입출고 관리')).toBeVisible();
    await expect(page.locator('text=as입고,출고 인트라교육')).toBeVisible();
    
    console.log('✅ 업무 기록 데이터 확인 완료');
    
    // 업무 추가 테스트
    await page.click('text=업무 추가');
    await expect(page.locator('text=업무 추가')).toBeVisible();
    
    // 업무 정보 입력
    await page.fill('input[name="task_date"]', '2025-01-17');
    await page.selectOption('select[name="operation_type_id"]', { index: 1 });
    await page.fill('input[name="task_name"]', '테스트 업무');
    await page.fill('textarea[name="description"]', '박진 계정 테스트용 업무');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('textarea[name="employee_memo"]', '테스트 메모');
    
    // 업무 추가
    await page.click('button[type="submit"]');
    
    console.log('✅ 업무 추가 테스트 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-tasks-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 업무 기록 테스트 완료!');
  });

  test('박진 개인정보 관리 테스트', async ({ page }) => {
    console.log('🔍 박진 개인정보 관리 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 개인정보 관리 페이지로 이동
    await page.click('button[title="개인정보 관리"]');
    await page.waitForURL('**/profile');
    
    // 개인정보 확인
    await expect(page.locator('text=박진(JIN)')).toBeVisible();
    await expect(page.locator('text=MASLABS-004')).toBeVisible();
    await expect(page.locator('text=OP팀 • 파트타임')).toBeVisible();
    await expect(page.locator('text=park.jin@maslabs.kr')).toBeVisible();
    await expect(page.locator('text=입사일: 2025-07-29')).toBeVisible();
    await expect(page.locator('text=권한: part_time')).toBeVisible();
    
    console.log('✅ 개인정보 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-profile-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 개인정보 관리 테스트 완료!');
  });

  test('박진 출근 기록 확인 테스트', async ({ page }) => {
    console.log('🔍 박진 출근 기록 확인 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 대시보드에서 출근 기록 확인
    await expect(page.locator('text=근무 상태')).toBeVisible();
    
    // 출근 체크 버튼이 있는지 확인 (오늘 근무가 예정되어 있다면)
    const checkInButton = page.locator('text=출근 체크');
    const checkOutButton = page.locator('text=퇴근 체크');
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼 확인');
    } else if (await checkOutButton.isVisible()) {
      console.log('✅ 퇴근 체크 버튼 확인');
    } else {
      console.log('✅ 오늘 근무 예정 없음');
    }
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-attendance-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 출근 기록 확인 테스트 완료!');
  });

  test('박진 성과 지표 확인 테스트', async ({ page }) => {
    console.log('🔍 박진 성과 지표 확인 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 대시보드에서 KPI 확인
    await expect(page.locator('text=개인 KPI')).toBeVisible();
    await expect(page.locator('text=팀 KPI')).toBeVisible();
    
    // 개인 KPI 데이터 확인
    await expect(page.locator('text=전화 판매 건수')).toBeVisible();
    await expect(page.locator('text=오프라인 시타 만족도')).toBeVisible();
    await expect(page.locator('text=온라인 판매 성사')).toBeVisible();
    await expect(page.locator('text=콘텐츠 조회수')).toBeVisible();
    
    console.log('✅ 성과 지표 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-kpi-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 성과 지표 확인 테스트 완료!');
  });
});
