const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

const choiId = 'e998a540-51bf-4380-bcb1-86fb36ec7eb8';

async function debugChoiData() {
  try {
    console.log('🔍 최형호 데이터 디버깅 시작...');
    
    // 1. 직원 정보 확인
    console.log('\n1️⃣ 직원 정보 확인:');
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', choiId)
      .single();

    if (empError) {
      console.error('❌ 직원 정보 조회 실패:', empError);
    } else {
      console.log('✅ 직원 정보:', employee);
    }

    // 2. 전체 8월 스케줄 확인
    console.log('\n2️⃣ 8월 전체 스케줄 확인:');
    const { data: allSchedules, error: allError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiId)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });

    if (allError) {
      console.error('❌ 스케줄 조회 실패:', allError);
    } else {
      console.log(`✅ 8월 스케줄 수: ${allSchedules.length}개`);
      allSchedules.forEach(schedule => {
        console.log(`- ${schedule.schedule_date}: ${schedule.scheduled_start}-${schedule.scheduled_end} [${schedule.status}]`);
      });
    }

    // 3. 승인된 스케줄만 확인
    console.log('\n3️⃣ 승인된 스케줄만 확인:');
    const { data: approvedSchedules, error: approvedError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiId)
      .eq('status', 'approved')
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });

    if (approvedError) {
      console.error('❌ 승인된 스케줄 조회 실패:', approvedError);
    } else {
      console.log(`✅ 승인된 스케줄 수: ${approvedSchedules.length}개`);
    }

    // 4. 8월 24일~31일 스케줄 확인 (화면에 보이는 날짜)
    console.log('\n4️⃣ 8월 24일~31일 스케줄 확인:');
    const { data: endMonthSchedules, error: endError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiId)
      .gte('schedule_date', '2025-08-24')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });

    if (endError) {
      console.error('❌ 8월 말 스케줄 조회 실패:', endError);
    } else {
      console.log(`✅ 8월 24일~31일 스케줄 수: ${endMonthSchedules.length}개`);
      if (endMonthSchedules.length > 0) {
        endMonthSchedules.forEach(schedule => {
          console.log(`- ${schedule.schedule_date}: ${schedule.scheduled_start}-${schedule.scheduled_end} [${schedule.status}]`);
        });
      }
    }

    // 5. 최형호의 다른 월 스케줄 확인
    console.log('\n5️⃣ 최형호의 다른 월 스케줄 확인:');
    const { data: otherSchedules, error: otherError } = await supabase
      .from('schedules')
      .select('schedule_date, status')
      .eq('employee_id', choiId)
      .order('schedule_date', { ascending: true });

    if (otherError) {
      console.error('❌ 다른 월 스케줄 조회 실패:', otherError);
    } else {
      console.log(`✅ 최형호 전체 스케줄 수: ${otherSchedules.length}개`);
      const monthGroups = {};
      otherSchedules.forEach(schedule => {
        const month = schedule.schedule_date.substring(0, 7); // YYYY-MM
        if (!monthGroups[month]) {
          monthGroups[month] = { total: 0, approved: 0 };
        }
        monthGroups[month].total++;
        if (schedule.status === 'approved') {
          monthGroups[month].approved++;
        }
      });
      
      Object.keys(monthGroups).forEach(month => {
        const group = monthGroups[month];
        console.log(`- ${month}: 총 ${group.total}개 (승인 ${group.approved}개)`);
      });
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

debugChoiData();
