const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 중복 스케줄 제거 함수
async function removeDuplicateSchedules() {
  try {
    console.log('🔍 중복 스케줄 검사 및 제거 시작...\n');
    
    // 1. 모든 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .order('schedule_date', { ascending: true })
      .order('scheduled_start', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }
    
    console.log(`📊 총 스케줄 수: ${schedules?.length || 0}개\n`);
    
    // 2. 중복 스케줄 찾기
    const duplicateMap = new Map();
    const duplicatesToRemove = [];
    
    schedules?.forEach(schedule => {
      // 중복 체크를 위한 고유 키 생성
      const uniqueKey = `${schedule.employee_id}_${schedule.schedule_date}_${schedule.scheduled_start}_${schedule.scheduled_end}`;
      
      if (duplicateMap.has(uniqueKey)) {
        // 중복 발견
        const existing = duplicateMap.get(uniqueKey);
        
        // 더 최근에 생성된 것을 유지하고, 오래된 것을 삭제 대상으로 추가
        if (new Date(schedule.created_at) > new Date(existing.created_at)) {
          duplicatesToRemove.push(existing);
          duplicateMap.set(uniqueKey, schedule);
        } else {
          duplicatesToRemove.push(schedule);
        }
      } else {
        duplicateMap.set(uniqueKey, schedule);
      }
    });
    
    console.log(`🔄 중복 스케줄 발견: ${duplicatesToRemove.length}개\n`);
    
    if (duplicatesToRemove.length === 0) {
      console.log('✅ 중복 스케줄이 없습니다.');
      return;
    }
    
    // 3. 중복 스케줄 상세 정보 출력
    console.log('📋 삭제할 중복 스케줄 목록:');
    duplicatesToRemove.forEach((schedule, index) => {
      const employeeName = schedule.employee?.name || '알 수 없음';
      const employeeId = schedule.employee?.employee_id || '알 수 없음';
      console.log(`${index + 1}. ${employeeName} (${employeeId}) - ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
      console.log(`   생성일: ${schedule.created_at}`);
      console.log(`   상태: ${schedule.status}`);
      console.log(`   노트: ${schedule.employee_note || '없음'}\n`);
    });
    
    // 4. 중복 스케줄 삭제
    console.log('🗑️ 중복 스케줄 삭제 중...');
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const schedule of duplicatesToRemove) {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id);
      
      if (deleteError) {
        console.error(`❌ 스케줄 삭제 실패 (ID: ${schedule.id}):`, deleteError);
        errorCount++;
      } else {
        console.log(`✅ 스케줄 삭제 완료: ${schedule.employee?.name} - ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        deletedCount++;
      }
    }
    
    // 5. 결과 요약
    console.log('\n📊 중복 제거 결과:');
    console.log(`✅ 성공적으로 삭제: ${deletedCount}개`);
    console.log(`❌ 삭제 실패: ${errorCount}개`);
    console.log(`📈 남은 스케줄: ${(schedules?.length || 0) - deletedCount}개`);
    
    // 6. 최종 검증
    const { data: finalSchedules, error: finalError } = await supabase
      .from('schedules')
      .select('id')
      .order('schedule_date', { ascending: true });
    
    if (!finalError) {
      console.log(`\n🔍 최종 검증: 현재 스케줄 수 ${finalSchedules?.length || 0}개`);
    }
    
  } catch (error) {
    console.error('❌ 중복 제거 중 오류 발생:', error);
  }
}

// 권한 체크 함수
async function checkSchedulePermissions() {
  try {
    console.log('\n🔐 스케줄 권한 체크...\n');
    
    // 직원별 역할 확인
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        employee_id,
        role:roles(name)
      `);
    
    if (employeeError) {
      console.error('❌ 직원 정보 조회 오류:', employeeError);
      return;
    }
    
    console.log('👥 직원별 권한 현황:');
    employees?.forEach(employee => {
      const roleName = employee.role?.name || '역할 없음';
      const canAddPastSchedules = ['admin', 'manager'].includes(roleName);
      console.log(`- ${employee.name} (${employee.employee_id}): ${roleName} ${canAddPastSchedules ? '✅' : '❌'} 과거 스케줄 추가 가능`);
    });
    
    // 최근 스케줄 추가 이력 확인
    const { data: recentSchedules, error: recentError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id, role:roles(name))
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 최근 7일
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!recentError && recentSchedules?.length > 0) {
      console.log('\n📅 최근 7일간 스케줄 추가 이력:');
      recentSchedules.forEach(schedule => {
        const employeeName = schedule.employee?.name || '알 수 없음';
        const roleName = schedule.employee?.role?.name || '역할 없음';
        const scheduleDate = new Date(schedule.schedule_date);
        const isPastSchedule = scheduleDate < new Date();
        const canAddPast = ['admin', 'manager'].includes(roleName);
        
        console.log(`- ${employeeName} (${roleName}): ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        console.log(`  생성일: ${schedule.created_at}`);
        console.log(`  과거 스케줄: ${isPastSchedule ? '예' : '아니오'} | 권한: ${canAddPast ? '있음' : '없음'} ${isPastSchedule && !canAddPast ? '⚠️' : ''}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ 권한 체크 중 오류 발생:', error);
  }
}

// 메인 실행
async function main() {
  console.log('🚀 스케줄 중복 제거 및 권한 체크 시작\n');
  
  await removeDuplicateSchedules();
  await checkSchedulePermissions();
  
  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);
