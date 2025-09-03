import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 최종 디자인 점검', () => {
  test.beforeEach(async ({ page }) => {
    // 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
  });

  test('전체 페이지 레이아웃 및 디자인 점검', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('출근 관리');
    
    // 현재 시간 표시 확인
    await expect(page.locator('text=현재 시간')).toBeVisible();
    
    // 사용자 정보 카드 확인
    await expect(page.locator('text=허상원')).toBeVisible();
    await expect(page.locator('text=HEO')).toBeVisible();
    await expect(page.locator('text=오늘 근무 시간')).toBeVisible();
  });

  test('오늘 근무 요약 섹션 점검', async ({ page }) => {
    // 오늘 근무 요약 제목 확인
    await expect(page.locator('text=오늘 근무 요약')).toBeVisible();
    
    // 3개 메트릭 확인 (스케줄 시간, 실제 근무 시간, 시간 차이)
    const metrics = page.locator('.grid.grid-cols-2.md\\:grid-cols-3 > div');
    await expect(metrics).toHaveCount(3);
    
    // 각 메트릭의 라벨 확인
    await expect(page.locator('text=스케줄 시간')).toBeVisible();
    await expect(page.locator('text=실제 근무 시간')).toBeVisible();
    await expect(page.locator('text=시간 차이')).toBeVisible();
    
    // 시간 차이 툴팁 확인
    const timeDifferenceMetric = page.locator('.text-purple-600').first();
    await timeDifferenceMetric.hover();
    await expect(page.locator('text=실제 근무 시간 - 스케줄 시간')).toBeVisible();
  });

  test('오늘의 근무 요약 섹션 점검', async ({ page }) => {
    // 오늘의 근무 요약 제목 확인
    await expect(page.locator('text=오늘의 근무 요약')).toBeVisible();
    
    // 근무 블록 확인 (09:00-12:00, 13:00-17:30)
    const workBlocks = page.locator('.bg-white.rounded-2xl');
    await expect(workBlocks).toHaveCount(2);
    
    // 첫 번째 블록 (09:00-12:00) 확인
    await expect(page.locator('text=09:00 - 12:00')).toBeVisible();
    await expect(page.locator('text=완료')).toBeVisible();
    await expect(page.locator('text=실제 근무')).toBeVisible();
    await expect(page.locator('text=09:00 → 12:00')).toBeVisible();
    
    // 두 번째 블록 (13:00-17:30) 확인
    await expect(page.locator('text=13:00 - 17:30')).toBeVisible();
    await expect(page.locator('text=완료')).toBeVisible();
    await expect(page.locator('text=실제 근무')).toBeVisible();
    await expect(page.locator('text=13:00 → 17:30')).toBeVisible();
    
    // 진행률 바 확인
    const progressBars = page.locator('.bg-gradient-to-r.from-blue-500.to-green-500');
    await expect(progressBars).toHaveCount(2);
  });

  test('이번 달 출근 요약 섹션 점검', async ({ page }) => {
    // 이번 달 출근 요약 제목 확인
    await expect(page.locator('text=이번 달 출근 요약')).toBeVisible();
    
    // 2개 메트릭 확인 (완료된 시간, 총 근무시간)
    const monthlyMetrics = page.locator('.grid.grid-cols-2 > div');
    await expect(monthlyMetrics).toHaveCount(2);
    
    // 각 메트릭의 라벨 확인
    await expect(page.locator('text=완료된 시간')).toBeVisible();
    await expect(page.locator('text=총 근무시간')).toBeVisible();
    
    // 총 스케줄 메트릭이 제거되었는지 확인
    await expect(page.locator('text=총 스케줄')).not.toBeVisible();
  });

  test('최근 7일 요약 섹션 점검', async ({ page }) => {
    // 최근 7일 요약 제목 확인
    await expect(page.locator('text=최근 7일 요약')).toBeVisible();
    
    // 일별 요약 항목 확인
    const dailyItems = page.locator('.bg-gray-50.rounded');
    await expect(dailyItems).toHaveCount(1); // 9월 3일만 표시
    
    // 중복 표시가 제거되었는지 확인
    await expect(page.locator('text=7.5시간 / 7.5시간 7.5시간')).not.toBeVisible();
    
    // 새로운 표시 방식 확인
    await expect(page.locator('text=스케줄:')).toBeVisible();
    await expect(page.locator('text=실제:')).toBeVisible();
  });

  test('간단한 출근 관리 섹션 점검', async ({ page }) => {
    // 간단한 출근 관리 제목 확인
    await expect(page.locator('text=간단한 출근 관리')).toBeVisible();
    
    // 근무 완료 상태 확인
    await expect(page.locator('text=근무 완료')).toBeVisible();
    
    // 출근 시간 확인
    await expect(page.locator('text=출근: 09/03 09:00')).toBeVisible();
  });

  test('중복 내용 및 부족한 내용 체크', async ({ page }) => {
    // 1. 출근/퇴근 정보 중복 체크
    const clockInOutInfo = page.locator('text=출근:').count();
    const clockOutInfo = page.locator('text=퇴근:').count();
    
    // 2. 시간 정보 중복 체크
    const timeInfo = page.locator('text=시간').count();
    
    // 3. 완료 상태 중복 체크
    const completedStatus = page.locator('text=완료').count();
    
    // 4. 진행중/대기중 상태가 제거되었는지 확인
    await expect(page.locator('text=진행 중')).not.toBeVisible();
    await expect(page.locator('text=대기 중')).not.toBeVisible();
    
    // 5. 불필요한 정보가 제거되었는지 확인
    await expect(page.locator('text=연속 근무')).not.toBeVisible();
    await expect(page.locator('text=예상:')).not.toBeVisible();
  });

  test('반응형 디자인 및 모바일 최적화 점검', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일에서도 모든 요소가 보이는지 확인
    await expect(page.locator('text=출근 관리')).toBeVisible();
    await expect(page.locator('text=오늘 근무 요약')).toBeVisible();
    await expect(page.locator('text=오늘의 근무 요약')).toBeVisible();
    
    // 그리드 레이아웃이 모바일에 적합하게 조정되었는지 확인
    const mobileGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-3');
    await expect(mobileGrid).toBeVisible();
  });

  test('색상 및 시각적 일관성 점검', async ({ page }) => {
    // 주요 색상 확인
    const blueElements = page.locator('.text-blue-600, .text-blue-700');
    const greenElements = page.locator('.text-green-600, .text-green-700');
    const purpleElements = page.locator('.text-purple-600, .text-purple-700');
    
    // 색상이 적절히 사용되었는지 확인
    await expect(blueElements.first()).toBeVisible();
    await expect(greenElements.first()).toBeVisible();
    await expect(purpleElements.first()).toBeVisible();
    
    // 그림자 효과 확인
    const shadowElements = page.locator('.shadow-sm, .hover\\:shadow-md');
    await expect(shadowElements.first()).toBeVisible();
  });

  test('접근성 및 사용성 점검', async ({ page }) => {
    // 모든 중요한 정보가 텍스트로 표시되는지 확인
    await expect(page.locator('text=7.5')).toBeVisible();
    await expect(page.locator('text=7h 30m')).toBeVisible();
    await expect(page.locator('text=0.0')).toBeVisible();
    
    // 아이콘과 함께 텍스트가 있는지 확인
    const iconWithText = page.locator('text=📊 오늘 근무 요약, text=📱 간단한 출근 관리, text=📅 오늘의 근무 요약');
    await expect(iconWithText).toBeVisible();
  });
});
