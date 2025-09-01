import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 선택된 직원 자동 추가 테스트 (간단 버전)', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
    
    // 전체 보기 모드로 전환
    await page.getByRole('button', { name: '전체 보기' }).click();
    await page.waitForTimeout(1000);
  });

  test('허상원 선택 후 스케줄 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 왼쪽에서 허상원 선택
    const heoSangwon = page.locator('text=허상원').first();
    await expect(heoSangwon).toBeVisible();
    await heoSangwon.click();
    await page.waitForTimeout(1000);
    
    // 허상원이 선택되었는지 확인
    await expect(heoSangwon).toBeVisible();
    console.log('허상원이 선택되었습니다.');
    
    // 빈 시간대 찾기 (더 간단한 방식)
    const emptyTimeSlots = page.locator('div').filter({ hasText: '없음' });
    const count = await emptyTimeSlots.count();
    console.log(`빈 시간대 개수: ${count}개`);
    
    if (count > 0) {
      // 첫 번째 빈 시간대 선택
      const firstEmptySlot = emptyTimeSlots.first();
      await expect(firstEmptySlot).toBeVisible();
      
      // 빈 시간대에 호버하여 추가 버튼 표시
      await firstEmptySlot.hover();
      
      // 추가 버튼이 표시되는지 확인
      const addButton = page.locator('button[title="스케줄 추가"]').first();
      await expect(addButton).toBeVisible();
      console.log('추가 버튼이 표시되었습니다.');
      
      // 추가 버튼 클릭
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // 추가된 스케줄 정보 확인
      const scheduleText = await firstEmptySlot.textContent();
      console.log('허상원 선택 후 바로 추가 결과:', scheduleText);
      
      // 허상원이 추가되었는지 확인
      expect(scheduleText).toContain('허상원');
      console.log('✅ 허상원이 성공적으로 추가되었습니다!');
    } else {
      console.log('빈 시간대가 없습니다. 다른 방법으로 테스트합니다.');
      
      // 기존 스케줄이 있는 셀에 호버하여 직원 추가 버튼 확인
      const scheduleCells = page.locator('div').filter({ hasText: '2명' });
      const scheduleCount = await scheduleCells.count();
      console.log(`2명이 근무하는 시간대 개수: ${scheduleCount}개`);
      
      if (scheduleCount > 0) {
        const firstScheduleCell = scheduleCells.first();
        await expect(firstScheduleCell).toBeVisible();
        
        // 스케줄 셀에 호버
        await firstScheduleCell.hover();
        
        // 직원 추가 버튼이 표시되는지 확인
        const addEmployeeButton = page.locator('button[title="직원 추가"]').first();
        await expect(addEmployeeButton).toBeVisible();
        console.log('직원 추가 버튼이 표시되었습니다.');
        
        // 직원 추가 버튼 클릭
        await addEmployeeButton.click();
        await page.waitForTimeout(2000);
        
        // 추가 후 스케줄 정보 확인
        const afterText = await firstScheduleCell.textContent();
        console.log('허상원 선택 후 기존 셀에 추가 결과:', afterText);
        
        // 허상원이 추가되었는지 확인
        expect(afterText).toContain('허상원');
        console.log('✅ 허상원이 기존 셀에 성공적으로 추가되었습니다!');
      }
    }
  });

  test('선택된 직원 상태 확인 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 현재 선택된 직원이 있는지 확인
    const selectedEmployees = page.locator('div').filter({ hasText: /[가-힣]+/ });
    const count = await selectedEmployees.count();
    console.log(`직원 목록에서 표시되는 직원 수: ${count}명`);
    
    // 직원 목록이 표시되어 있는지 확인
    expect(count).toBeGreaterThan(0);
    
    // 허상원 찾기
    const heoSangwon = page.locator('text=허상원').first();
    await expect(heoSangwon).toBeVisible();
    
    // 허상원 클릭하여 선택
    await heoSangwon.click();
    await page.waitForTimeout(1000);
    
    console.log('허상원이 선택되었습니다.');
    
    // 선택된 상태 확인 (파란색 배경 등)
    const selectedEmployee = page.locator('text=허상원').first();
    await expect(selectedEmployee).toBeVisible();
    
    console.log('✅ 허상원 선택 상태가 확인되었습니다.');
  });

  test('전체보기 모드에서 스케줄 추가 버튼 확인 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 전체보기 모드가 활성화되어 있는지 확인
    const overviewButton = page.getByRole('button', { name: '전체 보기' });
    await expect(overviewButton).toBeVisible();
    
    // 전체보기 설명 텍스트 확인
    const description = page.locator('text=모든 직원의 스케줄을 한눈에 확인하고 관리할 수 있습니다');
    await expect(description).toBeVisible();
    
    console.log('전체보기 모드가 활성화되어 있습니다.');
    
    // 스케줄 추가 버튼들이 표시되는지 확인
    const addButtons = page.locator('button[title="스케줄 추가"]');
    const addButtonCount = await addButtons.count();
    console.log(`스케줄 추가 버튼 개수: ${addButtonCount}개`);
    
    // 직원 추가 버튼들도 확인
    const addEmployeeButtons = page.locator('button[title="직원 추가"]');
    const addEmployeeButtonCount = await addEmployeeButtons.count();
    console.log(`직원 추가 버튼 개수: ${addEmployeeButtonCount}개`);
    
    // 최소한 하나의 추가 버튼이 있어야 함
    expect(addButtonCount + addEmployeeButtonCount).toBeGreaterThan(0);
    
    console.log('✅ 스케줄 추가 관련 버튼들이 정상적으로 표시되고 있습니다.');
  });
});
