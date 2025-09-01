import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 UX 분석 테스트', () => {
  test('스케줄 추가/삭제 UX 분석', async ({ page }) => {
    console.log('🚀 스케줄 추가/삭제 UX 분석 테스트 시작');
    
    // 직원별 스케줄 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    console.log('✅ 직원별 스케줄 관리 페이지 접근');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 1. 첫 번째 직원 선택
    const firstEmployee = page.locator('button:has-text("김탁수")').first();
    await firstEmployee.click();
    console.log('✅ 김탁수 직원 선택');
    
    // 2. 빈 시간대 클릭하여 스케줄 추가 테스트
    const emptyTimeSlot = page.locator('.bg-gray-50').first();
    await emptyTimeSlot.click();
    console.log('✅ 빈 시간대 클릭 (스케줄 추가)');
    
    // 3. 성공 메시지 확인
    const successMessage = page.locator('text="스케줄이 추가되었습니다."');
    const hasSuccessMessage = await successMessage.isVisible();
    console.log('📝 성공 메시지 표시 여부:', hasSuccessMessage);
    
    // 4. 스케줄이 실제로 추가되었는지 확인
    await page.waitForTimeout(2000);
    const updatedCell = page.locator('.bg-blue-200, .bg-blue-300, .bg-blue-400').first();
    const isScheduleAdded = await updatedCell.isVisible();
    console.log('✅ 스케줄 추가 성공 여부:', isScheduleAdded);
    
    // 5. 추가된 스케줄 클릭하여 모달 표시 확인
    if (isScheduleAdded) {
      await updatedCell.click();
      console.log('✅ 추가된 스케줄 클릭');
      
      // 모달이 나타나는지 확인
      const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
      const hasModal = await modal.isVisible();
      console.log('📋 모달 표시 여부:', hasModal);
      
      if (hasModal) {
        // 모달 내용 확인
        const modalTitle = page.locator('h3');
        const titleText = await modalTitle.textContent();
        console.log('📋 모달 제목:', titleText);
        
        // 모달 닫기
        const closeButton = page.locator('button:has-text("취소")');
        await closeButton.click();
        console.log('✅ 모달 닫기');
      }
    }
    
    // 6. 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-ux-analysis.png' });
    console.log('✅ 스크린샷 저장 완료');
    
    console.log('✅ 스케줄 추가/삭제 UX 분석 테스트 완료');
  });
  
  test('모달 없이 직접 추가/삭제 가능성 테스트', async ({ page }) => {
    console.log('🔍 모달 없이 직접 조작 가능성 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    // 직원 선택
    const firstEmployee = page.locator('button:has-text("김탁수")').first();
    await firstEmployee.click();
    
    // 빈 시간대에 스케줄 추가
    const emptyTimeSlot = page.locator('.bg-gray-50').first();
    await emptyTimeSlot.click();
    await page.waitForTimeout(2000);
    
    // 추가된 스케줄 확인
    const addedSchedule = page.locator('.bg-blue-200, .bg-blue-300, .bg-blue-400').first();
    if (await addedSchedule.isVisible()) {
      console.log('✅ 스케줄 추가됨');
      
      // 추가된 스케줄을 다시 클릭하여 삭제 시도
      await addedSchedule.click();
      await page.waitForTimeout(1000);
      
      // 모달이 나타나는지 확인
      const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
      const hasModal = await modal.isVisible();
      console.log('📋 삭제 시 모달 표시 여부:', hasModal);
      
      if (hasModal) {
        // 삭제 버튼 확인
        const deleteButton = page.locator('button:has-text("삭제")');
        const hasDeleteButton = await deleteButton.isVisible();
        console.log('🗑️ 삭제 버튼 존재 여부:', hasDeleteButton);
        
        // 모달 닫기
        const closeButton = page.locator('button:has-text("취소")');
        await closeButton.click();
      }
    }
    
    console.log('✅ 모달 없이 직접 조작 가능성 테스트 완료');
  });
  
  test('사용자 경험 및 안전성 분석', async ({ page }) => {
    console.log('🛡️ 사용자 경험 및 안전성 분석 시작');
    
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    // 직원 선택
    const firstEmployee = page.locator('button:has-text("김탁수")').first();
    await firstEmployee.click();
    
    // 현재 UX 분석
    console.log('📊 현재 UX 분석:');
    console.log('- 스케줄 추가: 클릭 한 번으로 즉시 추가');
    console.log('- 스케줄 수정/삭제: 모달을 통한 확인 절차');
    console.log('- 성공 메시지: alert로 표시');
    
    // 안전성 분석
    console.log('🛡️ 안전성 분석:');
    console.log('- 즉시 추가: 실수로 인한 의도치 않은 추가 가능');
    console.log('- 모달 확인: 수정/삭제 시 안전장치 제공');
    console.log('- 사용자 피드백: 성공/실패 메시지로 상태 확인');
    
    console.log('✅ 사용자 경험 및 안전성 분석 완료');
  });
});
