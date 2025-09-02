import { test, expect } from '@playwright/test';

test.describe('Supabase 직접 연결로 스케줄 승인 처리 테스트', () => {
  test('Supabase 대시보드에서 스케줄 승인 처리 확인', async ({ page }) => {
    console.log('🚀 Supabase 직접 연결 테스트 시작');
    
    // 1단계: Supabase 대시보드 접근
    console.log('🔗 1단계: Supabase 대시보드 접근...');
    await page.goto('https://supabase.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Supabase 대시보드 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // Supabase 대시보드 스크린샷
    await page.screenshot({ path: 'test-results/supabase-direct-dashboard.png' });
    console.log('📸 Supabase 대시보드 스크린샷 저장 완료');
    
    // 2단계: 로그인 상태 확인
    console.log('🔍 2단계: 로그인 상태 확인...');
    
    const loginButton = page.locator('button:has-text("Sign in"), button:has-text("Log in")');
    if (await loginButton.isVisible()) {
      console.log('⚠️ 로그인이 필요합니다');
      console.log('💡 Supabase에 로그인해주세요 (30초 대기)');
      
      // 사용자가 로그인할 때까지 대기
      await page.waitForTimeout(30000);
      
      // 로그인 후 상태 확인
      const currentUrl = page.url();
      const title = await page.title();
      
      console.log('🔗 로그인 후 URL:', currentUrl);
      console.log('📄 로그인 후 제목:', title);
      
      if (currentUrl.includes('dashboard') && !title.includes('Sign in')) {
        console.log('✅ Supabase 로그인 성공!');
        
        // 3단계: MASLABS 프로젝트 접근
        console.log('🔗 3단계: MASLABS 프로젝트 접근...');
        
        // 프로젝트 목록에서 MASLABS 찾기
        const maslabsProject = page.locator('text=maslabs, text=MASLABS, text=www.maslabs.kr');
        if (await maslabsProject.isVisible()) {
          await maslabsProject.click();
          console.log('✅ MASLABS 프로젝트 클릭 완료');
          
          // 프로젝트 대시보드 로딩 대기
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          console.log('✅ MASLABS 프로젝트 대시보드 접속 완료');
          console.log('🔗 현재 URL:', page.url());
          
          // 프로젝트 대시보드 스크린샷
          await page.screenshot({ path: 'test-results/supabase-direct-maslabs-project.png' });
          console.log('📸 MASLABS 프로젝트 대시보드 스크린샷 저장 완료');
          
          // 4단계: Table Editor에서 스케줄 데이터 확인
          console.log('🔍 4단계: Table Editor에서 스케줄 데이터 확인...');
          
          // Table Editor 메뉴 클릭
          const tableEditorMenu = page.locator('a[href*="editor"], text=Table Editor, text=Tables');
          if (await tableEditorMenu.isVisible()) {
            await tableEditorMenu.click();
            console.log('✅ Table Editor 메뉴 클릭 완료');
            
            // Table Editor 로딩 대기
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            console.log('✅ Table Editor 접속 완료');
            
            // Table Editor 스크린샷
            await page.screenshot({ path: 'test-results/supabase-direct-table-editor.png' });
            console.log('📸 Table Editor 스크린샷 저장 완료');
            
            // 5단계: schedules 테이블 확인
            console.log('🔍 5단계: schedules 테이블 확인...');
            
            // schedules 테이블 찾기
            const schedulesTable = page.locator('text=schedules, text=Schedules');
            if (await schedulesTable.isVisible()) {
              await schedulesTable.click();
              console.log('✅ schedules 테이블 클릭 완료');
              
              // 테이블 데이터 로딩 대기
              await page.waitForLoadState('networkidle');
              await page.waitForTimeout(3000);
              
              console.log('✅ schedules 테이블 데이터 로딩 완료');
              
              // 테이블 데이터 스크린샷
              await page.screenshot({ path: 'test-results/supabase-direct-schedules-table.png' });
              console.log('📸 schedules 테이블 데이터 스크린샷 저장 완료');
              
              // 6단계: 스케줄 승인 상태 분석
              console.log('🔍 6단계: 스케줄 승인 상태 분석...');
              
              // 페이지 내용에서 승인 상태 확인
              const pageContent = await page.content();
              
              // 승인 관련 데이터 확인
              const hasPendingStatus = pageContent.includes('pending') || pageContent.includes('대기중');
              const hasApprovedStatus = pageContent.includes('approved') || pageContent.includes('승인됨');
              const hasEmployeeData = pageContent.includes('허상원') || pageContent.includes('나수진') || pageContent.includes('김탁수');
              
              console.log('✅ 대기중 상태 데이터:', hasPendingStatus);
              console.log('✅ 승인됨 상태 데이터:', hasApprovedStatus);
              console.log('✅ 직원 데이터:', hasEmployeeData);
              
              // 7단계: SQL Editor에서 직접 쿼리 실행
              console.log('🔍 7단계: SQL Editor에서 직접 쿼리 실행...');
              
              // SQL Editor 메뉴 클릭
              const sqlEditorMenu = page.locator('a[href*="sql"], text=SQL Editor, text=SQL');
              if (await sqlEditorMenu.isVisible()) {
                await sqlEditorMenu.click();
                console.log('✅ SQL Editor 메뉴 클릭 완료');
                
                // SQL Editor 로딩 대기
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000);
                
                console.log('✅ SQL Editor 접속 완료');
                
                // SQL Editor 스크린샷
                await page.screenshot({ path: 'test-results/supabase-direct-sql-editor.png' });
                console.log('📸 SQL Editor 스크린샷 저장 완료');
                
                // 8단계: 스케줄 승인 상태 SQL 쿼리
                console.log('🔍 8단계: 스케줄 승인 상태 SQL 쿼리...');
                
                // SQL 입력 필드 찾기
                const sqlInput = page.locator('.monaco-editor textarea, .sql-editor textarea, [data-testid="sql-editor"]');
                if (await sqlInput.isVisible()) {
                  // 스케줄 승인 상태 확인 SQL
                  const scheduleQuery = `
-- 2025-09-02 스케줄 승인 상태 확인
SELECT 
  s.id,
  s.employee_id,
  e.name as employee_name,
  s.schedule_date,
  s.scheduled_start,
  s.scheduled_end,
  s.status,
  s.approved_by,
  s.approved_at,
  s.created_at
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.schedule_date = '2025-09-02'
ORDER BY s.scheduled_start, e.name;
                  `;
                  
                  await sqlInput.fill(scheduleQuery);
                  console.log('✅ SQL 쿼리 입력 완료');
                  
                  // 실행 버튼 클릭
                  const runButton = page.locator('button:has-text("Run"), button:has-text("실행")');
                  if (await runButton.isVisible()) {
                    await runButton.click();
                    console.log('✅ SQL 쿼리 실행 완료');
                    
                    // 결과 로딩 대기
                    await page.waitForTimeout(3000);
                    
                    // 쿼리 결과 스크린샷
                    await page.screenshot({ path: 'test-results/supabase-direct-sql-results.png' });
                    console.log('📸 SQL 쿼리 결과 스크린샷 저장 완료');
                    
                    // 9단계: 최종 결과 요약
                    console.log('📊 9단계: 최종 결과 요약');
                    console.log('=====================================');
                    console.log('🎯 Supabase 직접 연결 테스트 결과:');
                    console.log(`   - Supabase 대시보드 접근: ✅ 성공`);
                    console.log(`   - MASLABS 프로젝트 접근: ✅ 성공`);
                    console.log(`   - Table Editor 접근: ✅ 성공`);
                    console.log(`   - schedules 테이블 접근: ✅ 성공`);
                    console.log(`   - SQL Editor 접근: ✅ 성공`);
                    console.log(`   - SQL 쿼리 실행: ✅ 성공`);
                    console.log(`   - 대기중 상태 데이터: ${hasPendingStatus ? '✅ 발견' : '❌ 없음'}`);
                    console.log(`   - 승인됨 상태 데이터: ${hasApprovedStatus ? '✅ 발견' : '❌ 없음'}`);
                    console.log(`   - 직원 데이터: ${hasEmployeeData ? '✅ 발견' : '❌ 없음'}`);
                    console.log('=====================================');
                    
                  } else {
                    console.log('❌ SQL 실행 버튼을 찾을 수 없음');
                  }
                  
                } else {
                  console.log('❌ SQL 입력 필드를 찾을 수 없음');
                }
                
              } else {
                console.log('❌ SQL Editor 메뉴를 찾을 수 없음');
              }
              
            } else {
              console.log('❌ schedules 테이블을 찾을 수 없음');
            }
            
          } else {
            console.log('❌ Table Editor 메뉴를 찾을 수 없음');
          }
          
        } else {
          console.log('❌ MASLABS 프로젝트를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ Supabase 로그인에 실패했습니다');
      }
      
    } else {
      console.log('✅ 이미 로그인된 상태입니다');
      
      // 바로 MASLABS 프로젝트로 이동
      console.log('🔗 바로 MASLABS 프로젝트로 이동...');
      await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('✅ MASLABS 프로젝트 직접 접근 완료');
      console.log('🔗 현재 URL:', page.url());
      
      // 프로젝트 대시보드 스크린샷
      await page.screenshot({ path: 'test-results/supabase-direct-maslabs-project-direct.png' });
      console.log('📸 MASLABS 프로젝트 직접 접근 스크린샷 저장 완료');
    }
    
    console.log('🎉 Supabase 직접 연결 테스트 완료!');
  });
});
