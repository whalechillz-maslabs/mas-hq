import { test, expect } from '@playwright/test';

test.describe('허상원 계정 간단 테스트', () => {
  test('허상원 계정 로그인 및 업무 기록 페이지 접근', async ({ page }) => {
    console.log('🚀 허상원 계정 테스트 시작');

    // 1. 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 페이지 로드 완료');

    // 2. 허상원 계정으로 로그인
    console.log('2️⃣ 허상원 계정으로 로그인');
    
    // 전화번호 입력
    await page.fill('input[type="tel"]', '010-8948-4501');
    console.log('✅ 전화번호 입력 완료');
    
    // 비밀번호 입력
    await page.fill('input[type="password"]', '89484501');
    console.log('✅ 비밀번호 입력 완료');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    console.log('✅ 로그인 버튼 클릭 완료');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ 로그인 성공 - 대시보드 페이지 로드됨');

    // 3. 대시보드 페이지 스크린샷
    await page.screenshot({ path: 'heo-sangwon-dashboard.png' });
    console.log('✅ 대시보드 페이지 스크린샷 저장됨');

    // 4. 직접 업무 기록 페이지로 이동
    console.log('4️⃣ 직접 업무 기록 페이지로 이동');
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    console.log('✅ 업무 기록 페이지 로드 완료');

    // 5. 업무 기록 페이지 스크린샷
    await page.screenshot({ path: 'heo-sangwon-tasks-page.png' });
    console.log('✅ 업무 기록 페이지 스크린샷 저장됨');

    // 6. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 7. 현재 업무 목록 확인
    console.log('7️⃣ 현재 업무 목록 확인');
    await page.waitForTimeout(3000);
    
    const taskRows = await page.locator('tbody tr').count();
    console.log(`📊 현재 업무 수: ${taskRows}개`);

    // 8. 업무 추가 버튼 확인
    console.log('8️⃣ 업무 추가 버튼 확인');
    const addButton = page.locator('button:has-text("업무 추가")');
    
    if (await addButton.isVisible()) {
      console.log('✅ 업무 추가 버튼 확인됨');
      
      // 9. 업무 추가 버튼 클릭
      console.log('9️⃣ 업무 추가 버튼 클릭');
      await addButton.click();
      
      // 모달이 나타날 때까지 대기
      await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
      console.log('✅ 업무 추가 모달 열림');
      
      // 10. 모달 스크린샷
      await page.screenshot({ path: 'heo-sangwon-add-task-modal.png' });
      console.log('✅ 업무 추가 모달 스크린샷 저장됨');
      
      // 11. 모달 닫기 (취소 버튼 클릭)
      const modal = page.locator('div[class*="fixed"]').first();
      const cancelButton = modal.locator('button:has-text("취소")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        console.log('✅ 모달 닫기 완료');
      }
      
    } else {
      console.log('❌ 업무 추가 버튼을 찾을 수 없음');
    }

    // 12. 통계 카드 확인
    console.log('🔟 통계 카드 확인');
    
    // 총 업무 수 확인
    const totalTasksCard = page.locator('div').filter({ hasText: '총 업무' });
    if (await totalTasksCard.count() > 0) {
      const totalTasksText = await totalTasksCard.locator('p').first().textContent();
      console.log(`📊 총 업무 수: ${totalTasksText}`);
    } else {
      console.log('❌ 총 업무 카드를 찾을 수 없음');
    }
    
    // 획득 포인트 확인
    const totalPointsCard = page.locator('div').filter({ hasText: '획득 포인트' });
    if (await totalPointsCard.count() > 0) {
      const totalPointsText = await totalPointsCard.locator('p').first().textContent();
      console.log(`🎯 총 포인트: ${totalPointsText}`);
    } else {
      console.log('❌ 획득 포인트 카드를 찾을 수 없음');
    }

    console.log('🎉 허상원 계정 테스트 완료');
  });
});
