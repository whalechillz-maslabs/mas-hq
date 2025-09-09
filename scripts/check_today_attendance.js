const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkTodayAttendance() {
  console.log('🔍 오늘 출근 체크한 사람 확인 중...');
  
  try {
    // 오늘 날짜 계산
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    console.log('📅 오늘 날짜:', todayString);
    
    // 1. daily_work_records 테이블 확인
    console.log('\n1. daily_work_records 테이블에서 오늘 출근 체크 확인...');
    const { data: todayWorkRecords, error: workError } = await supabase
      .from('daily_work_records')
      .select(`
        *,
        employees!inner(name, employee_id, employment_type)
      `)
      .eq('work_date', todayString)
      .order('check_in_time', { ascending: true });
    
    if (workError) {
      console.log('❌ daily_work_records 테이블 조회 실패:', workError.message);
      console.log('   → daily_work_records 테이블이 존재하지 않습니다');
    } else {
      console.log('✅ daily_work_records 테이블에서 오늘 출근 체크 (총 ' + todayWorkRecords.length + '명):');
      
      if (todayWorkRecords.length === 0) {
        console.log('⚠️ 오늘 출근 체크한 사람이 없습니다');
      } else {
        todayWorkRecords.forEach((record, index) => {
          console.log(`\n  📋 출근 체크 ${index + 1}:`);
          console.log('    - 이름:', record.employees.name);
          console.log('    - 직원ID:', record.employees.employee_id);
          console.log('    - 고용형태:', record.employees.employment_type);
          console.log('    - 출근시간:', record.check_in_time);
          console.log('    - 퇴근시간:', record.check_out_time || '미퇴근');
          console.log('    - 근무시간:', record.work_hours + '시간');
          console.log('    - 위치:', record.location || '미지정');
        });
      }
    }
    
    // 2. employee_tasks 테이블에서 오늘 업무 기록 확인
    console.log('\n2. employee_tasks 테이블에서 오늘 업무 기록 확인...');
    const { data: todayTasks, error: taskError } = await supabase
      .from('employee_tasks')
      .select(`
        *,
        employees!inner(name, employee_id, employment_type)
      `)
      .eq('task_date', todayString)
      .order('created_at', { ascending: true });
    
    if (taskError) {
      console.log('❌ employee_tasks 테이블 조회 실패:', taskError.message);
    } else {
      console.log('✅ employee_tasks 테이블에서 오늘 업무 기록 (총 ' + todayTasks.length + '개):');
      
      if (todayTasks.length === 0) {
        console.log('⚠️ 오늘 업무 기록이 없습니다');
      } else {
        // 직원별로 그룹화
        const tasksByEmployee = {};
        todayTasks.forEach(task => {
          const employeeName = task.employees.name;
          if (!tasksByEmployee[employeeName]) {
            tasksByEmployee[employeeName] = {
              employee_id: task.employees.employee_id,
              employment_type: task.employees.employment_type,
              tasks: []
            };
          }
          tasksByEmployee[employeeName].tasks.push(task);
        });
        
        Object.keys(tasksByEmployee).forEach(employeeName => {
          const employeeData = tasksByEmployee[employeeName];
          console.log(`\n  👤 ${employeeName} (${employeeData.employee_id}):`);
          console.log('    - 고용형태:', employeeData.employment_type);
          console.log('    - 오늘 업무 수:', employeeData.tasks.length + '개');
          
          employeeData.tasks.forEach((task, index) => {
            console.log(`    - 업무 ${index + 1}: ${task.title} (${task.achievement_status})`);
          });
        });
      }
    }
    
    // 3. schedules 테이블에서 오늘 스케줄 확인
    console.log('\n3. schedules 테이블에서 오늘 스케줄 확인...');
    const { data: todaySchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employees!inner(name, employee_id, employment_type)
      `)
      .eq('date', todayString)
      .order('start_time', { ascending: true });
    
    if (scheduleError) {
      console.log('❌ schedules 테이블 조회 실패:', scheduleError.message);
    } else {
      console.log('✅ schedules 테이블에서 오늘 스케줄 (총 ' + todaySchedules.length + '개):');
      
      if (todaySchedules.length === 0) {
        console.log('⚠️ 오늘 스케줄이 없습니다');
      } else {
        todaySchedules.forEach((schedule, index) => {
          console.log(`\n  📅 스케줄 ${index + 1}:`);
          console.log('    - 이름:', schedule.employees.name);
          console.log('    - 직원ID:', schedule.employees.employee_id);
          console.log('    - 고용형태:', schedule.employees.employment_type);
          console.log('    - 시작시간:', schedule.start_time);
          console.log('    - 종료시간:', schedule.end_time);
          console.log('    - 근무시간:', schedule.work_hours + '시간');
        });
      }
    }
    
    // 4. 결론
    console.log('\n📊 오늘 출근 체크 현황 요약:');
    
    if (workError) {
      console.log('❌ daily_work_records 테이블이 없어서 정확한 출근 체크 정보를 확인할 수 없습니다');
      console.log('💡 employee_tasks 테이블의 업무 기록으로 활동 여부를 추정할 수 있습니다');
      
      if (todayTasks.length > 0) {
        const activeEmployees = [...new Set(todayTasks.map(task => task.employees.name))];
        console.log('✅ 오늘 활동한 직원 (업무 기록 기준):', activeEmployees.join(', '));
      } else {
        console.log('⚠️ 오늘 활동한 직원이 없습니다 (업무 기록 기준)');
      }
    } else {
      if (todayWorkRecords.length > 0) {
        const checkedInEmployees = todayWorkRecords.map(record => record.employees.name);
        console.log('✅ 오늘 출근 체크한 직원:', checkedInEmployees.join(', '));
      } else {
        console.log('⚠️ 오늘 출근 체크한 직원이 없습니다');
      }
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  checkTodayAttendance().catch(console.error);
}

module.exports = { checkTodayAttendance };
