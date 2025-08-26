const { createClient } = require('@supabase/supabase-js');

// 로컬 Supabase 설정
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 로컬 데이터 복원
async function restoreLocalData() {
  try {
    console.log('로컬 데이터 복원 중...\n');
    
    // 1. 부서 데이터 추가
    console.log('부서 데이터 추가 중...');
    const departments = [
      { id: 'cd1bf40d-6d5f-48ad-8256-9469eb8692db', name: '경영지원팀', code: 'MGMT', description: '경영 및 행정 지원' },
      { id: '8354d709-a44f-499e-909f-d5ec1a8048c7', name: '개발팀', code: 'DEV', description: '소프트웨어 개발' },
      { id: '2a060f6d-69c1-44d6-942b-0743e46bdca7', name: '디자인팀', code: 'DESIGN', description: '디자인 및 UI/UX' },
      { id: 'ce3a48cc-dc02-4c50-97ce-a0b91b996380', name: '마케팅팀', code: 'MARKETING', description: '마케팅 및 홍보' },
      { id: '0af79f9f-7c9c-4686-a889-1699f0024228', name: '본사', code: 'HQ', description: '본사 직원' },
      { id: 'b01ab0e6-66ee-4a8d-818e-1e167effb597', name: '마스팀', code: 'MAS', description: '마스팀 운영' },
      { id: 'b0bff302-f3c9-4086-b814-db8a2f871b11', name: '싱싱팀', code: 'SING', description: '싱싱팀 운영' }
    ];
    
    for (const dept of departments) {
      const { error } = await supabase
        .from('departments')
        .upsert(dept, { onConflict: 'id' });
      
      if (error) {
        console.error(`${dept.name} 부서 추가 오류:`, error);
      } else {
        console.log(`${dept.name} 부서 추가 완료`);
      }
    }
    
    // 2. 역할 데이터 추가
    console.log('\n역할 데이터 추가 중...');
    const roles = [
      { id: 'b724ff0c-01f8-4aa4-866f-ac67a616af32', name: 'admin', description: '시스템 관리자', permissions: { all: true } },
      { id: '60989e55-424d-40cc-a812-1d142aa1899f', name: 'manager', description: '매니저/팀장', permissions: { tasks: true, salaries: true, employees: true, schedules: true } },
      { id: '031acab2-dd14-41d1-bfa2-920cc9a20110', name: 'team_lead', description: '팀 리더', permissions: { team_tasks: true, team_reports: true, team_schedules: true } },
      { id: 'fb0642fb-0384-4319-ab26-e5d954871d4b', name: 'employee', description: '일반 직원', permissions: { self: true, view_schedules: true } },
      { id: '5d42886e-6446-4142-b657-1d45ed508267', name: 'part_time', description: '파트타임 직원', permissions: { self: true, view_schedules: true } }
    ];
    
    for (const role of roles) {
      const { error } = await supabase
        .from('roles')
        .upsert(role, { onConflict: 'id' });
      
      if (error) {
        console.error(`${role.name} 역할 추가 오류:`, error);
      } else {
        console.log(`${role.name} 역할 추가 완료`);
      }
    }
    
    // 3. 직원 데이터 추가
    console.log('\n직원 데이터 추가 중...');
    const employees = [
      {
        id: '513726f9-d1ff-4fd8-92a0-49ae128ad8e9',
        employee_id: 'MASLABS-001',
        email: 'admin@maslabs.kr',
        name: '시스템 관리자',
        phone: '010-6669-9000',
        password_hash: '66699000',
        department_id: '0af79f9f-7c9c-4686-a889-1699f0024228', // 본사
        role_id: 'b724ff0c-01f8-4aa4-866f-ac67a616af32', // admin
        hire_date: '2025-08-19',
        employment_type: 'full_time',
        status: 'active',
        pin_code: '1234'
      },
      {
        id: '7cef08a3-3222-46de-825f-5325bbf10c5a',
        employee_id: 'MASLABS-002',
        email: 'lee.eunjung@maslabs.kr',
        name: '이은정(STE)',
        phone: '010-3243-3099',
        password_hash: '32433099',
        department_id: 'cd1bf40d-6d5f-48ad-8256-9469eb8692db', // 경영지원팀
        role_id: '60989e55-424d-40cc-a812-1d142aa1899f', // manager
        hire_date: '2025-01-01',
        employment_type: 'full_time',
        status: 'active',
        pin_code: '1234'
      },
      {
        id: '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc',
        employee_id: 'MASLABS-004',
        email: 'park.jin@maslabs.kr',
        name: '박진(JIN)',
        phone: '010-9132-4337',
        password_hash: '91324337',
        department_id: 'b01ab0e6-66ee-4a8d-818e-1e167effb597', // 마스팀
        role_id: '5d42886e-6446-4142-b657-1d45ed508267', // part_time
        hire_date: '2025-07-29',
        employment_type: 'full_time',
        hourly_rate: 12000.00,
        status: 'active',
        nickname: 'JIN',
        pin_code: '1234'
      }
    ];
    
    for (const emp of employees) {
      const { error } = await supabase
        .from('employees')
        .upsert(emp, { onConflict: 'id' });
      
      if (error) {
        console.error(`${emp.name} 직원 추가 오류:`, error);
      } else {
        console.log(`${emp.name} 직원 추가 완료`);
      }
    }
    
    // 4. 스케줄 데이터 추가 (수정된 제약 조건으로 여러 시간대 가능)
    console.log('\n스케줄 데이터 추가 중...');
    const schedules = [
      // 시스템 관리자 스케줄 (8월 25일)
      {
        employee_id: '513726f9-d1ff-4fd8-92a0-49ae128ad8e9',
        schedule_date: '2025-08-25',
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: '513726f9-d1ff-4fd8-92a0-49ae128ad8e9',
        schedule_date: '2025-08-25',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      
      // 시스템 관리자 스케줄 (8월 26일)
      {
        employee_id: '513726f9-d1ff-4fd8-92a0-49ae128ad8e9',
        schedule_date: '2025-08-26',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: '513726f9-d1ff-4fd8-92a0-49ae128ad8e9',
        schedule_date: '2025-08-26',
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: '513726f9-d1ff-4fd8-92a0-49ae128ad8e9',
        schedule_date: '2025-08-26',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      
      // 이은정 스케줄 (8월 25일)
      {
        employee_id: '7cef08a3-3222-46de-825f-5325bbf10c5a',
        schedule_date: '2025-08-25',
        scheduled_start: '10:00:00',
        scheduled_end: '11:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: '7cef08a3-3222-46de-825f-5325bbf10c5a',
        schedule_date: '2025-08-25',
        scheduled_start: '11:00:00',
        scheduled_end: '12:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: '7cef08a3-3222-46de-825f-5325bbf10c5a',
        schedule_date: '2025-08-25',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      
      // 박진 스케줄 (8월 26일)
      {
        employee_id: '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc',
        schedule_date: '2025-08-26',
        scheduled_start: '10:00:00',
        scheduled_end: '11:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc',
        schedule_date: '2025-08-26',
        scheduled_start: '11:00:00',
        scheduled_end: '12:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc',
        schedule_date: '2025-08-26',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      }
    ];
    
    for (const schedule of schedules) {
      const { error } = await supabase
        .from('schedules')
        .insert(schedule);
      
      if (error) {
        console.error(`스케줄 추가 오류 (${schedule.schedule_date} ${schedule.scheduled_start}):`, error.message);
      } else {
        console.log(`스케줄 추가 완료: ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
      }
    }
    
    console.log('\n로컬 데이터 복원 완료!');
    
  } catch (error) {
    console.error('데이터 복원 중 오류 발생:', error);
  }
}

restoreLocalData();
