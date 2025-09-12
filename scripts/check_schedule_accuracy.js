const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    // 따옴표와 개행 문자 제거
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScheduleAccuracy() {
  try {
    console.log('🔍 스케줄 데이터 정확성 검증 시작');
    
    // 1. 모든 직원의 스케줄 데이터 조회
    const { data: allSchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 스케줄 조회 실패:', scheduleError);
      return;
    }
    
    console.log(`📊 총 스케줄 데이터: ${allSchedules.length}개`);
    
    // 2. 직원별로 그룹화
    const schedulesByEmployee = {};
    allSchedules.forEach(schedule => {
      const employeeName = schedule.employees.name;
      if (!schedulesByEmployee[employeeName]) {
        schedulesByEmployee[employeeName] = [];
      }
      schedulesByEmployee[employeeName].push(schedule);
    });
    
    // 3. 각 직원별 스케줄 검증
    Object.keys(schedulesByEmployee).forEach(employeeName => {
      const schedules = schedulesByEmployee[employeeName];
      console.log(`\n👤 ${employeeName} (${schedules.length}개 스케줄)`);
      
      // 4. 스케줄 데이터 품질 검사
      let totalHours = 0;
      let nullHoursCount = 0;
      let invalidHoursCount = 0;
      let duplicateDates = [];
      const dateSet = new Set();
      
      schedules.forEach(schedule => {
        // 중복 날짜 체크
        if (dateSet.has(schedule.schedule_date)) {
          duplicateDates.push(schedule.schedule_date);
        } else {
          dateSet.add(schedule.schedule_date);
        }
        
        // 근무시간 검증
        if (schedule.total_hours === null || schedule.total_hours === undefined) {
          nullHoursCount++;
        } else if (schedule.total_hours < 0 || schedule.total_hours > 24) {
          invalidHoursCount++;
        } else {
          totalHours += schedule.total_hours;
        }
      });
      
      // 5. 검증 결과 출력
      console.log(`  📅 기간: ${schedules[0]?.schedule_date} ~ ${schedules[schedules.length - 1]?.schedule_date}`);
      console.log(`  ⏰ 총 근무시간: ${totalHours.toFixed(1)}시간`);
      console.log(`  ❌ null 근무시간: ${nullHoursCount}개`);
      console.log(`  ⚠️ 잘못된 근무시간: ${invalidHoursCount}개`);
      console.log(`  🔄 중복 날짜: ${duplicateDates.length}개`);
      
      if (duplicateDates.length > 0) {
        console.log(`    중복 날짜 목록: ${duplicateDates.join(', ')}`);
      }
      
      // 6. 최근 5개 스케줄 상세 정보
      console.log(`  📋 최근 5개 스케줄:`);
      schedules.slice(-5).forEach(schedule => {
        const hours = schedule.total_hours !== null ? `${schedule.total_hours}시간` : '❌ null';
        console.log(`    - ${schedule.schedule_date}: ${hours}`);
      });
    });
    
    // 7. 전체 시스템 상태 요약
    console.log('\n📊 전체 시스템 상태 요약:');
    console.log(`  - 총 직원 수: ${Object.keys(schedulesByEmployee).length}명`);
    console.log(`  - 총 스케줄 수: ${allSchedules.length}개`);
    
    const totalNullHours = allSchedules.filter(s => s.total_hours === null).length;
    const totalInvalidHours = allSchedules.filter(s => s.total_hours !== null && (s.total_hours < 0 || s.total_hours > 24)).length;
    
    console.log(`  - null 근무시간: ${totalNullHours}개`);
    console.log(`  - 잘못된 근무시간: ${totalInvalidHours}개`);
    
    if (totalNullHours > 0 || totalInvalidHours > 0) {
      console.log('\n⚠️ 데이터 품질 개선이 필요합니다:');
      if (totalNullHours > 0) {
        console.log(`  - ${totalNullHours}개의 스케줄에 근무시간이 입력되지 않았습니다.`);
      }
      if (totalInvalidHours > 0) {
        console.log(`  - ${totalInvalidHours}개의 스케줄에 잘못된 근무시간이 있습니다.`);
      }
    } else {
      console.log('\n✅ 모든 스케줄 데이터가 정상입니다!');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkScheduleAccuracy();
