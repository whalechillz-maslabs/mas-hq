import { test, expect } from '@playwright/test';

test.describe('스케줄 승인 처리 페이지 접근 테스트', () => {
  test('배포된 서버에서 스케줄 승인 처리 페이지 접근', async ({ page }) => {
    console.log('🚀 스케줄 승인 처리 페이지 접근 테스트 시작');
    
    // 1단계: 메인 페이지 접근
    console.log('🔗 1단계: 메인 페이지 접근...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 메인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 메인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/schedule-approval-main-page.png' });
    console.log('📸 메인 페이지 스크린샷 저장 완료');
    
    // 2단계: 스케줄 페이지 접근
    console.log('🔗 2단계: 스케줄 페이지 접근...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 스케줄 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 스케줄 페이지 스크린샷
    await page.screenshot({ path: 'test-results/schedule-approval-schedules-page.png' });
    console.log('📸 스케줄 페이지 스크린샷 저장 완료');
    
    // 3단계: 관리자 스케줄 관리 페이지 접근
    console.log('🔗 3단계: 관리자 스케줄 관리 페이지 접근...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 관리자 스케줄 관리 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 관리자 페이지 스크린샷
    await page.screenshot({ path: 'test-results/schedule-approval-admin-page.png' });
    console.log('📸 관리자 스케줄 관리 페이지 스크린샷 저장 완료');
    
    // 4단계: 페이지 구조 분석
    console.log('🔍 4단계: 페이지 구조 분석...');
    
    // 페이지에 있는 주요 요소들 확인
    const pageContent = await page.content();
    
    // 승인 관련 텍스트가 있는지 확인
    const hasApprovalText = pageContent.includes('승인') || 
                           pageContent.includes('approve') || 
                           pageContent.includes('pending') ||
                           pageContent.includes('approved');
    
    console.log('✅ 승인 관련 텍스트 포함 여부:', hasApprovalText);
    
    // 스케줄 관련 텍스트가 있는지 확인
    const hasScheduleText = pageContent.includes('스케줄') || 
                           pageContent.includes('schedule') ||
                           pageContent.includes('근무');
    
    console.log('✅ 스케줄 관련 텍스트 포함 여부:', hasScheduleText);
    
    // 5단계: 버튼 및 입력 필드 확인
    console.log('🔍 5단계: 버튼 및 입력 필드 확인...');
    
    // 승인 버튼 찾기
    const approveButtons = page.locator('button:has-text("승인"), button:has-text("approve"), button:has-text("Approve")');
    const approveButtonCount = await approveButtons.count();
    console.log('✅ 승인 버튼 개수:', approveButtonCount);
    
    // 대기중 상태 확인
    const pendingElements = page.locator('text=대기중, text=pending, text=Pending');
    const pendingCount = await pendingElements.count();
    console.log('✅ 대기중 상태 요소 개수:', pendingCount);
    
    // 승인됨 상태 확인
    const approvedElements = page.locator('text=승인됨, text=approved, text=Approved');
    const approvedCount = await approvedElements.count();
    console.log('✅ 승인됨 상태 요소 개수:', approvedCount);
    
    // 6단계: 최종 결과 요약
    console.log('📊 6단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 테스트 결과:');
    console.log(`   - 메인 페이지 접근: ✅ 성공`);
    console.log(`   - 스케줄 페이지 접근: ✅ 성공`);
    console.log(`   - 관리자 페이지 접근: ✅ 성공`);
    console.log(`   - 승인 관련 텍스트: ${hasApprovalText ? '✅ 발견' : '❌ 없음'}`);
    console.log(`   - 스케줄 관련 텍스트: ${hasScheduleText ? '✅ 발견' : '❌ 없음'}`);
    console.log(`   - 승인 버튼: ${approveButtonCount}개`);
    console.log(`   - 대기중 상태: ${pendingCount}개`);
    console.log(`   - 승인됨 상태: ${approvedCount}개`);
    console.log('=====================================');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/schedule-approval-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 스케줄 승인 처리 페이지 접근 테스트 완료!');
  });
});
