const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 데이터 파싱 및 이전
async function migrateData() {
  try {
    console.log('데이터 이전을 시작합니다...');
    
    // 기존 departments 확인
    console.log('기존 departments 확인 중...');
    const { data: existingDepts, error: deptQueryError } = await supabase
      .from('departments')
      .select('*');

    if (deptQueryError) {
      console.error('departments 조회 오류:', deptQueryError);
      return;
    }

    console.log('기존 departments:', existingDepts?.length || 0);

    // 기존 roles 확인
    console.log('기존 roles 확인 중...');
    const { data: existingRoles, error: roleQueryError } = await supabase
      .from('roles')
      .select('*');

    if (roleQueryError) {
      console.error('roles 조회 오류:', roleQueryError);
      return;
    }

    console.log('기존 roles:', existingRoles?.length || 0);
    console.log('기존 roles:', existingRoles);

    // 기존 employees 확인
    console.log('기존 employees 확인 중...');
    const { data: existingEmps, error: empQueryError } = await supabase
      .from('employees')
      .select('*');

    if (empQueryError) {
      console.error('employees 조회 오류:', empQueryError);
      return;
    }

    console.log('기존 employees:', existingEmps?.length || 0);

    // 기존 schedules 확인
    console.log('기존 schedules 확인 중...');
    const { data: existingSchedules, error: scheduleQueryError } = await supabase
      .from('schedules')
      .select('*');

    if (scheduleQueryError) {
      console.error('schedules 조회 오류:', scheduleQueryError);
      return;
    }

    console.log('기존 schedules:', existingSchedules?.length || 0);

    // 경영지원팀 department 찾기
    const mgmtDept = existingDepts?.find(dept => dept.name === '경영지원팀' || dept.code === 'MGMT');
    const mgmtDeptId = mgmtDept?.id;

    if (!mgmtDeptId) {
      console.error('경영지원팀을 찾을 수 없습니다.');
      return;
    }

    console.log('경영지원팀 ID:', mgmtDeptId);

    // manager role 찾기
    const managerRole = existingRoles?.find(role => role.name === 'manager');
    const managerRoleId = managerRole?.id;

    if (!managerRoleId) {
      console.error('manager role을 찾을 수 없습니다.');
      return;
    }

    console.log('Manager Role ID:', managerRoleId);

    // 이은정 데이터가 없으면 추가
    const eunjungExists = existingEmps?.some(emp => emp.employee_id === 'MASLABS-002');
    
    if (!eunjungExists) {
      console.log('이은정 데이터 추가 중...');
      
      // 이은정 employee 데이터 추가 (원격 스키마에 맞춤)
      const eunjungData = {
        id: '7cef08a3-3222-46de-825f-5325bbf10c5a',
        employee_id: 'MASLABS-002',
        email: 'lee.eunjung@maslabs.kr',
        name: '이은정(STE)',
        phone: '010-3243-3099',
        hire_date: '2025-08-20',
        department_id: mgmtDeptId,
        role_id: managerRoleId,
        position_id: null,
        monthly_salary: 3500000,
        employment_type: 'full_time',
        status: 'active',
        pin_code: '1234'
      };

      const { data: empResult, error: empError } = await supabase
        .from('employees')
        .insert(eunjungData);

      if (empError) {
        console.error('이은정 employee 추가 오류:', empError);
      } else {
        console.log('이은정 employee 추가 완료');
      }
    } else {
      console.log('이은정 데이터가 이미 존재합니다.');
    }

    // 이은정의 8월 20일 스케줄이 없으면 추가
    const eunjungScheduleExists = existingSchedules?.some(schedule => 
      schedule.employee_id === '7cef08a3-3222-46de-825f-5325bbf10c5a' && 
      schedule.schedule_date === '2025-08-20'
    );

    if (!eunjungScheduleExists) {
      console.log('이은정 8월 20일 스케줄 추가 중...');
      
      const scheduleData = {
        employee_id: '7cef08a3-3222-46de-825f-5325bbf10c5a',
        schedule_date: '2025-08-20',
        scheduled_start: '10:00:00',
        scheduled_end: '17:00:00',
        actual_start: null,
        actual_end: null,
        status: 'scheduled'
      };

      const { data: scheduleResult, error: scheduleError } = await supabase
        .from('schedules')
        .insert(scheduleData);

      if (scheduleError) {
        console.error('이은정 스케줄 추가 오류:', scheduleError);
      } else {
        console.log('이은정 스케줄 추가 완료');
      }
    } else {
      console.log('이은정 8월 20일 스케줄이 이미 존재합니다.');
    }

    console.log('데이터 이전이 완료되었습니다!');

  } catch (error) {
    console.error('데이터 이전 중 오류 발생:', error);
  }
}

migrateData();
