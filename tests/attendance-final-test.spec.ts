import { test, expect } from '@playwright/test';

test.describe('개인별 출근 관리 페이지 최종 테스트', () => {
  test('김탁수 계정으로 전체 기능 테스트', async ({ page }) => {
    console.log('🚀 개인별 출근 관리 페이지 최종 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 개인 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    console.log('🔍 개인 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기 (더 오래 기다리기)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000); // 10초 대기
    
    // 3. 현재 URL 확인
    const currentURL = page.url();
    console.log('🌐 현재 URL:', currentURL);
    
    // 4. 로딩 상태 재확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 10초 후 로딩 상태:', hasLoading ? '여전히 로딩 중' : '로딩 완료');
    
    // 5. 페이지 내용 확인
    const bodyText = await page.locator('body').textContent();
    
    const hasAttendanceText = bodyText?.includes('출근') || false;
    const hasScheduleText = bodyText?.includes('스케줄') || false;
    const hasLoadingText = bodyText?.includes('로딩') || false;
    const hasTodayScheduleText = bodyText?.includes('오늘의 근무 스케줄') || false;
    const hasMonthlyRecordText = bodyText?.includes('이번 달 출근 기록') || false;
    const hasNoScheduleText = bodyText?.includes('오늘 등록된 근무 스케줄이 없습니다') || false;
    
    console.log('🔍 페이지 내용 확인:');
    console.log('   - "출근" 텍스트:', hasAttendanceText);
    console.log('   - "스케줄" 텍스트:', hasScheduleText);
    console.log('   - "로딩" 텍스트:', hasLoadingText);
    console.log('   - "오늘의 근무 스케줄" 텍스트:', hasTodayScheduleText);
    console.log('   - "이번 달 출근 기록" 텍스트:', hasMonthlyRecordText);
    console.log('   - "스케줄이 없습니다" 텍스트:', hasNoScheduleText);
    
    // 6. 특정 요소 존재 확인
    const headerElement = page.locator('h1:has-text("출근 관리")');
    const currentTimeElement = page.locator('text=현재 시간');
    const todayScheduleSection = page.locator('text=오늘의 근무 스케줄');
    const monthlyRecordSection = page.locator('text=이번 달 출근 기록');
    
    const hasHeader = await headerElement.count() > 0;
    const hasCurrentTime = await currentTimeElement.count() > 0;
    const hasTodaySchedule = await todayScheduleSection.count() > 0;
    const hasMonthlyRecord = await monthlyRecordSection.count() > 0;
    
    console.log('🔍 요소 존재 확인:');
    console.log('   - 헤더 ("출근 관리"):', hasHeader);
    console.log('   - 현재 시간:', hasCurrentTime);
    console.log('   - 오늘의 근무 스케줄 섹션:', hasTodaySchedule);
    console.log('   - 이번 달 출근 기록 섹션:', hasMonthlyRecord);
    
    // 7. 버튼 확인
    const checkInButtons = page.locator('button:has-text("출근")');
    const checkOutButtons = page.locator('button:has-text("퇴근")');
    
    const checkInButtonCount = await checkInButtons.count();
    const checkOutButtonCount = await checkOutButtons.count();
    
    console.log('🔍 버튼 확인:');
    console.log('   - 출근 버튼 수:', checkInButtonCount);
    console.log('   - 퇴근 버튼 수:', checkOutButtonCount);
    
    // 8. 최종 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-final-test.png' });
    console.log('📸 최종 스크린샷 저장됨');
    
    // 9. 결과 분석
    console.log('\n📊 최종 결과 분석:');
    
    if (currentURL.includes('/attendance')) {
      console.log('✅ 페이지 접근: 성공');
      
      if (hasHeader && hasCurrentTime) {
        console.log('✅ 기본 UI: 정상');
        
        if (hasTodaySchedule && hasMonthlyRecord) {
          console.log('✅ 주요 섹션: 정상');
          
          if (!hasLoadingText) {
            console.log('✅ 로딩 완료: 성공');
            
            if (hasNoScheduleText) {
              console.log('ℹ️ 스케줄 데이터: 오늘 스케줄 없음 (정상)');
            } else if (checkInButtonCount > 0 || checkOutButtonCount > 0) {
              console.log('✅ 스케줄 데이터: 있음 (출근/퇴근 버튼 존재)');
            } else {
              console.log('ℹ️ 스케줄 데이터: 알 수 없음');
            }
            
            console.log('\n🎉 개인별 출근 관리 페이지 완전 수정 성공!');
          } else {
            console.log('⚠️ 로딩 상태: 여전히 로딩 중 (데이터 로딩 문제)');
          }
        } else {
          console.log('❌ 주요 섹션: 일부 누락');
        }
      } else {
        console.log('❌ 기본 UI: 문제 있음');
      }
    } else {
      console.log('❌ 페이지 접근: 실패');
    }
    
    console.log('\n🎉 개인별 출근 관리 페이지 최종 테스트 완료!');
  });
});
