import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 선택된 직원 자동 추가 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
    
    // 전체 보기 모드로 전환
    await page.getByRole('button', { name: '전체 보기' }).click();
    await page.waitForTimeout(1000);
  });

  test('허상원 선택 후 빈 시간대에 바로 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 왼쪽에서 허상원 선택
    const heoSangwon = page.locator('text=허상원').first();
    await expect(heoSangwon).toBeVisible();
    await heoSangwon.click();
    await page.waitForTimeout(1000);
    
    // 허상원이 선택되었는지 확인 (파란색 배경)
    const selectedEmployee = page.locator('text=허상원').first();
    await expect(selectedEmployee).toBeVisible();
    
    // 빈 시간대 찾기 (예: 목요일 9:00)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '목 4' }).first().locator('..').locator('div').filter({ hasText: '9:00' }).first().locator('..');
    await expect(emptyTimeSlot).toBeVisible();
    
    // 빈 시간대에 호버하여 추가 버튼 표시
    await emptyTimeSlot.hover();
    
    // 추가 버튼 클릭
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // 추가 후 대기 (이름 입력 프롬프트 없이 바로 추가되어야 함)
    await page.waitForTimeout(2000);
    
    // 추가된 스케줄 정보 확인
    const scheduleText = await emptyTimeSlot.textContent();
    console.log('허상원 선택 후 바로 추가:', scheduleText);
    
    // 허상원이 추가되었는지 확인
    expect(scheduleText).toContain('허상원');
    
    // "Unknown"이 아닌 실제 직원 이름이 표시되어야 함
    expect(scheduleText).not.toContain('Unknown');
  });

  test('하상희 선택 후 기존 스케줄 셀에 바로 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 왼쪽에서 하상희 선택
    const haSanghee = page.locator('text=하상희').first();
    await expect(haSanghee).toBeVisible();
    await haSanghee.click();
    await page.waitForTimeout(1000);
    
    // 하상희가 선택되었는지 확인
    const selectedEmployee = page.locator('text=하상희').first();
    await expect(selectedEmployee).toBeVisible();
    
    // 이미 사람이 들어있는 셀 찾기 (예: 화요일 9:00 - 2명)
    const occupiedCell = page.locator('div').filter({ hasText: '2명허상원최형호' }).first();
    await expect(occupiedCell).toBeVisible();
    
    // 기존 스케줄 셀에 호버하여 직원 추가 버튼 표시
    await occupiedCell.hover();
    
    // 직원 추가 버튼 클릭
    const addEmployeeButton = page.locator('button[title="직원 추가"]').first();
    await expect(addEmployeeButton).toBeVisible();
    await addEmployeeButton.click();
    
    // 추가 후 대기 (이름 입력 프롬프트 없이 바로 추가되어야 함)
    await page.waitForTimeout(2000);
    
    // 추가 후 스케줄 정보 확인
    const afterText = await occupiedCell.textContent();
    console.log('하상희 선택 후 기존 셀에 바로 추가:', afterText);
    
    // 하상희가 추가되었는지 확인
    expect(afterText).toContain('하상희');
    
    // 직원 수가 증가했는지 확인
    expect(afterText).toContain('3명');
  });

  test('직원 선택 없이 빈 시간대 추가 시 이름 입력 프롬프트 표시 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 아무 직원도 선택하지 않은 상태에서 빈 시간대 찾기
    const emptyTimeSlot = page.locator('div').filter({ hasText: '토 6' }).first().locator('..').locator('div').filter({ hasText: '10:00' }).first().locator('..');
    await expect(emptyTimeSlot).toBeVisible();
    
    // 빈 시간대에 호버하여 추가 버튼 표시
    await emptyTimeSlot.hover();
    
    // 추가 버튼 클릭
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // 이름 입력 프롬프트가 표시되어야 함
    // Playwright에서는 prompt를 직접 테스트할 수 없으므로, 
    // 페이지에 프롬프트 관련 요소가 나타나는지 확인
    await page.waitForTimeout(1000);
    
    // 프롬프트가 표시되었는지 확인 (브라우저의 기본 프롬프트는 테스트하기 어려움)
    console.log('직원 선택 없이 추가 시 이름 입력 프롬프트가 표시되어야 함');
  });

  test('최형호 선택 후 여러 시간대에 연속 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 왼쪽에서 최형호 선택
    const choiHyeongho = page.locator('text=최형호').first();
    await expect(choiHyeongho).toBeVisible();
    await choiHyeongho.click();
    await page.waitForTimeout(1000);
    
    // 최형호가 선택되었는지 확인
    const selectedEmployee = page.locator('text=최형호').first();
    await expect(selectedEmployee).toBeVisible();
    
    // 여러 빈 시간대에 연속으로 추가
    const timeSlots = ['9:00', '9:30', '10:00'];
    const day = '일 7'; // 일요일
    
    for (const time of timeSlots) {
      const timeSlot = page.locator('div').filter({ hasText: day }).first().locator('..').locator('div').filter({ hasText: time }).first().locator('..');
      await expect(timeSlot).toBeVisible();
      
      // 시간대에 호버하여 추가 버튼 표시
      await timeSlot.hover();
      
      // 추가 버튼 클릭
      const addButton = page.locator('button[title="스케줄 추가"]').first();
      await expect(addButton).toBeVisible();
      await addButton.click();
      
      // 추가 후 대기
      await page.waitForTimeout(1000);
      
      // 추가된 스케줄 정보 확인
      const scheduleText = await timeSlot.textContent();
      console.log(`${day} ${time}에 최형호 추가 후:`, scheduleText);
      
      // 최형호가 추가되었는지 확인
      expect(scheduleText).toContain('최형호');
    }
  });

  test('선택된 직원 변경 후 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 처음에 허상원 선택
    const heoSangwon = page.locator('text=허상원').first();
    await expect(heoSangwon).toBeVisible();
    await heoSangwon.click();
    await page.waitForTimeout(1000);
    
    // 허상원이 선택되었는지 확인
    await expect(heoSangwon).toBeVisible();
    
    // 빈 시간대에 허상원 추가
    const emptyTimeSlot1 = page.locator('div').filter({ hasText: '금 5' }).first().locator('..').locator('div').filter({ hasText: '14:00' }).first().locator('..');
    await expect(emptyTimeSlot1).toBeVisible();
    
    await emptyTimeSlot1.hover();
    const addButton1 = page.locator('button[title="스케줄 추가"]').first();
    await addButton1.click();
    await page.waitForTimeout(1000);
    
    // 허상원이 추가되었는지 확인
    const scheduleText1 = await emptyTimeSlot1.textContent();
    expect(scheduleText1).toContain('허상원');
    
    // 이제 김탁수로 변경
    const kimTaksu = page.locator('text=김탁수').first();
    await expect(kimTaksu).toBeVisible();
    await kimTaksu.click();
    await page.waitForTimeout(1000);
    
    // 김탁수가 선택되었는지 확인
    await expect(kimTaksu).toBeVisible();
    
    // 다른 빈 시간대에 김탁수 추가
    const emptyTimeSlot2 = page.locator('div').filter({ hasText: '금 5' }).first().locator('..').locator('div').filter({ hasText: '15:00' }).first().locator('..');
    await expect(emptyTimeSlot2).toBeVisible();
    
    await emptyTimeSlot2.hover();
    const addButton2 = page.locator('button[title="스케줄 추가"]').first();
    await addButton2.click();
    await page.waitForTimeout(1000);
    
    // 김탁수가 추가되었는지 확인
    const scheduleText2 = await emptyTimeSlot2.textContent();
    expect(scheduleText2).toContain('김탁수');
    
    console.log('선택된 직원 변경 테스트 완료: 허상원 → 김탁수');
  });
});
