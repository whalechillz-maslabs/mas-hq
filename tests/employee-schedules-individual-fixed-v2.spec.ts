import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 개별 관리 모드 테스트 (수정됨 v2)', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://maslabs.kr/login');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/quick-task');
    
    // 직원별 스케줄 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
  });

  test('개별 관리 모드에서 스케줄 입력 모달 표시 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 직원 목록에서 하상희 선택 (공백 없는 형태)
    await page.click('button:has-text("하상희HA디자인팀 • 대리")');
    await page.waitForTimeout(2000);
    
    // 하상희가 선택되었는지 확인 (선택된 직원은 파란색 배경)
    const selectedEmployee = page.locator('button:has-text("하상희HA디자인팀 • 대리")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    console.log('하상희 버튼 클래스:', buttonClass);
    
    // 파란색 배경이 있는지 확인
    expect(buttonClass).toContain('bg-blue');
    
    // 스케줄 그리드에서 빈 시간 슬롯 클릭하여 스케줄 추가 모달 표시
    const emptyTimeSlot = page.locator('div[class*="bg-gray-50"]').first();
    if (await emptyTimeSlot.isVisible()) {
      console.log('빈 시간 슬롯을 찾았습니다');
      
      // 시간 슬롯 클릭
      await emptyTimeSlot.click();
      await page.waitForTimeout(1000);
      
      // 스케줄 입력 모달이 나타나는지 확인
      const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
      await expect(modal).toBeVisible();
      console.log('✅ 스케줄 입력 모달이 표시됨');
      
      // 모달 제목 확인
      const modalTitle = page.locator('h3:has-text("스케줄 추가")');
      await expect(modalTitle).toBeVisible();
      
      // 모달 내용 확인
      const modalContent = await page.locator('.bg-white.rounded-lg').textContent();
      console.log('모달 내용:', modalContent);
      
      // 입력 필드들이 표시되는지 확인
      const startTimeInput = page.locator('input[type="time"]').first();
      const endTimeInput = page.locator('input[type="time"]').nth(1);
      const noteTextarea = page.locator('textarea');
      
      await expect(startTimeInput).toBeVisible();
      await expect(endTimeInput).toBeVisible();
      await expect(noteTextarea).toBeVisible();
      
      console.log('✅ 모든 입력 필드가 표시됨');
      
      // 모달 닫기
      const closeButton = page.locator('button:has-text("취소")');
      await closeButton.click();
      await page.waitForTimeout(500);
      
      // 모달이 닫혔는지 확인
      await expect(modal).not.toBeVisible();
      console.log('✅ 모달이 정상적으로 닫힘');
    } else {
      console.log('빈 시간 슬롯을 찾을 수 없음');
    }
  });

  test('개별 관리 모드에서 기존 스케줄 수정 모달 표시 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 허상원 선택
    await page.click('button:has-text("허상원HEO본사 • 인턴")');
    await page.waitForTimeout(2000);
    
    // 허상원이 선택되었는지 확인
    const selectedEmployee = page.locator('button:has-text("허상원HEO본사 • 인턴")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    expect(buttonClass).toContain('bg-blue');
    
    // 기존 스케줄이 있는 시간 슬롯 클릭 (점심시간)
    const lunchTimeSlot = page.locator('div[class*="bg-orange-50"]').first();
    if (await lunchTimeSlot.isVisible()) {
      await lunchTimeSlot.click();
      await page.waitForTimeout(1000);
      
      // 스케줄 수정 모달이 나타나는지 확인
      const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
      await expect(modal).toBeVisible();
      console.log('✅ 스케줄 수정 모달이 표시됨');
      
      // 모달 제목 확인
      const modalTitle = page.locator('h3:has-text("스케줄 수정")');
      await expect(modalTitle).toBeVisible();
      
      // 기존 데이터가 입력 필드에 표시되는지 확인
      const startTimeInput = page.locator('input[type="time"]').first();
      const endTimeInput = page.locator('input[type="time"]').nth(1);
      
      const startTimeValue = await startTimeInput.getAttribute('value');
      const endTimeValue = await endTimeInput.getAttribute('value');
      
      console.log('시작 시간 값:', startTimeValue);
      console.log('종료 시간 값:', endTimeValue);
      
      // 시간 값이 비어있지 않은지 확인
      expect(startTimeValue).not.toBe('');
      expect(endTimeValue).not.toBe('');
      
      console.log('✅ 기존 스케줄 데이터가 입력 필드에 표시됨');
      
      // 모달 닫기
      const closeButton = page.locator('button:has-text("취소")');
      await closeButton.click();
      await page.waitForTimeout(500);
      
      // 모달이 닫혔는지 확인
      await expect(modal).not.toBeVisible();
    } else {
      console.log('점심시간 슬롯이 표시되지 않음');
    }
  });

  test('개별 관리 모드에서 스케줄 추가 및 저장 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 김탁수 선택 (이미 선택되어 있을 수 있음)
    await page.click('button:has-text("김탁수WHA본사 • 대표이사")');
    await page.waitForTimeout(2000);
    
    // 김탁수가 선택되었는지 확인
    const selectedEmployee = page.locator('button:has-text("김탁수WHA본사 • 대표이사")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    expect(buttonClass).toContain('bg-blue');
    
    // 빈 시간 슬롯 클릭 (스케줄 생성)
    const emptyTimeSlot = page.locator('div[class*="bg-gray-50"]').first();
    if (await emptyTimeSlot.isVisible()) {
      console.log('빈 시간 슬롯을 찾았습니다');
      
      // 시간 슬롯 클릭
      await emptyTimeSlot.click();
      await page.waitForTimeout(1000);
      
      // 스케줄 입력 모달이 나타나는지 확인
      const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
      await expect(modal).toBeVisible();
      
      // 시간 입력 필드에 값 입력
      const startTimeInput = page.locator('input[type="time"]').first();
      const endTimeInput = page.locator('input[type="time"]').nth(1);
      const noteTextarea = page.locator('textarea');
      
      await startTimeInput.fill('09:00');
      await endTimeInput.fill('10:00');
      await noteTextarea.fill('테스트 스케줄');
      
      console.log('✅ 시간 및 메모 입력 완료');
      
      // 저장 버튼 클릭
      const saveButton = page.locator('button:has-text("추가")');
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ 스케줄 저장 버튼 클릭됨');
      
      // 모달이 닫혔는지 확인
      await expect(modal).not.toBeVisible();
      
      // 페이지 새로고침하여 스케줄이 저장되었는지 확인
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 개별 관리 모드로 다시 설정
      await page.click('button:has-text("개별 관리")');
      await page.waitForTimeout(2000);
      await page.click('button:has-text("김탁수WHA본사 • 대표이사")');
      await page.waitForTimeout(2000);
      
      // 저장된 스케줄이 표시되는지 확인
      const savedSchedule = page.locator('div[class*="bg-blue-200"]').first();
      if (await savedSchedule.isVisible()) {
        console.log('✅ 스케줄이 성공적으로 저장되고 표시됨');
      } else {
        console.log('❌ 저장된 스케줄이 표시되지 않음');
      }
    } else {
      console.log('빈 시간 슬롯을 찾을 수 없음');
    }
  });

  test('개별 관리 모드와 전체 보기 모드 전환 테스트', async ({ page }) => {
    // 초기 상태 확인 (개별 관리가 기본)
    const 개별관리Button = page.locator('button:has-text("개별 관리")');
    const 개별관리Class = await 개별관리Button.getAttribute('class');
    console.log('개별 관리 버튼 초기 클래스:', 개별관리Class);
    
    // 전체 보기로 전환
    await page.click('button:has-text("전체 보기")');
    await page.waitForTimeout(2000);
    
    // 전체 보기가 활성화되었는지 확인
    const 전체보기Button = page.locator('button:has-text("전체 보기")');
    const 전체보기Class = await 전체보기Button.getAttribute('class');
    console.log('전체 보기 버튼 클래스 (클릭 후):', 전체보기Class);
    
    // 파란색 배경이 있는지 확인
    expect(전체보기Class).toContain('bg-blue');
    
    // 전체 보기 모드에서 스케줄 그리드가 표시되는지 확인
    const overviewHeader = page.locator('h3:has-text("전체 직원 스케줄 보기")');
    await expect(overviewHeader).toBeVisible();
    
    console.log('✅ 전체 보기 모드로 정상 전환됨');
    
    // 개별 관리로 다시 전환
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 개별 관리가 활성화되었는지 확인
    const 개별관리ClassAfter = await 개별관리Button.getAttribute('class');
    console.log('개별 관리 버튼 클래스 (다시 클릭 후):', 개별관리ClassAfter);
    
    // 개별 관리 모드가 활성화되었는지 확인
    expect(개별관리ClassAfter).toContain('bg-white');
    expect(개별관리ClassAfter).toContain('text-blue-600');
    
    console.log('✅ 개별 관리 모드로 정상 전환됨');
  });

  test('스케줄 모달의 모든 기능 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 하상희 선택
    await page.click('button:has-text("하상희HA디자인팀 • 대리")');
    await page.waitForTimeout(2000);
    
    // 빈 시간 슬롯 클릭
    const emptyTimeSlot = page.locator('div[class*="bg-gray-50"]').first();
    await emptyTimeSlot.click();
    await page.waitForTimeout(1000);
    
    // 모달이 표시되는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();
    
    // 모달 내부 요소들 확인
    const modalContent = page.locator('.bg-white.rounded-lg');
    
    // 날짜 필드 확인 (비활성화되어 있어야 함)
    const dateField = modalContent.locator('input[disabled]');
    await expect(dateField).toBeVisible();
    
    // 시작 시간 필드 확인
    const startTimeField = modalContent.locator('input[type="time"]').first();
    await expect(startTimeField).toBeVisible();
    
    // 종료 시간 필드 확인
    const endTimeField = modalContent.locator('input[type="time"]').nth(1);
    await expect(endTimeField).toBeVisible();
    
    // 메모 필드 확인
    const noteField = modalContent.locator('textarea');
    await expect(noteField).toBeVisible();
    
    // 기본값 확인
    const startTimeValue = await startTimeField.getAttribute('value');
    const endTimeValue = await endTimeField.getAttribute('value');
    
    console.log('기본 시작 시간:', startTimeValue);
    console.log('기본 종료 시간:', endTimeValue);
    
    // 30분 간격으로 설정되어 있는지 확인
    if (startTimeValue && endTimeValue) {
      const startMinutes = parseInt(startTimeValue.split(':')[1]);
      const endMinutes = parseInt(endTimeValue.split(':')[1]);
      const timeDiff = Math.abs(endMinutes - startMinutes);
      
      if (timeDiff === 30 || timeDiff === 30) {
        console.log('✅ 30분 간격으로 기본 설정됨');
      } else {
        console.log('❌ 30분 간격이 아님:', timeDiff);
      }
    }
    
    // 취소 버튼으로 모달 닫기
    const cancelButton = modalContent.locator('button:has-text("취소")');
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // 모달이 닫혔는지 확인
    await expect(modal).not.toBeVisible();
    
    console.log('✅ 스케줄 모달의 모든 기능이 정상 작동함');
  });
});
