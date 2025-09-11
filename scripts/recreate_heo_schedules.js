const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 정산서 데이터 (사용자 제공)
const settlementData = {
  "2025-08-11": { hours: 7.5, amount: 97500, note: "연장근무" },
  "2025-08-12": { hours: 8, amount: 104000, note: "화요일근무" },
  "2025-08-13": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-18": { hours: 6.5, amount: 84500, note: "연장근무" },
  "2025-08-19": { hours: 7, amount: 91000, note: "화요일근무" },
  "2025-08-20": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-21": { hours: 8, amount: 104000, note: "추가근무" },
  "2025-08-25": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-26": { hours: 8.5, amount: 110500, note: "화요일근무" },
  "2025-08-27": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-28": { hours: 7, amount: 91000, note: "추가근무" },
  "2025-08-29": { hours: 7, amount: 91000, note: "연장근무" }
};

// 시간 계산 함수
function calculateHours(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10;
}

async function recreateHeoSchedules() {
  console.log('=== 허상원 스케줄 재입력 (점심시간 제외) ===');
  
  // 허상원 직원 정보 확인
  const { data: heo, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('name', '허상원')
    .single();
    
  if (empError) {
    console.error('허상원 직원 정보 조회 실패:', empError);
    return;
  }
  
  console.log('허상원 정보:', {
    name: heo.name,
    employee_id: heo.employee_id,
    id: heo.id
  });
  
  const targetDates = Object.keys(settlementData).sort();
  
  console.log(`\n재입력할 날짜 수: ${targetDates.length}개\n`);
  
  for (const date of targetDates) {
    const settlement = settlementData[date];
    console.log(`📅 ${date} (${settlement.note}) - 목표: ${settlement.hours}시간`);
    
    // 정산서 시간에 맞춰 스케줄 생성
    let morningEnd, afternoonStart, afternoonEnd;
    
    // 정산서 시간에 따라 오전/오후 시간 배분
    if (settlement.hours === 7.5) {
      // 7.5시간: 9-12 (3시간) + 13-17:30 (4.5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '17:30:00';
    } else if (settlement.hours === 8) {
      // 8시간: 9-12 (3시간) + 13-18 (5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '18:00:00';
    } else if (settlement.hours === 6.5) {
      // 6.5시간: 9-12 (3시간) + 13-16:30 (3.5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '16:30:00';
    } else if (settlement.hours === 7) {
      // 7시간: 9-12 (3시간) + 13-17 (4시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '17:00:00';
    } else if (settlement.hours === 8.5) {
      // 8.5시간: 9-12 (3시간) + 13-18:30 (5.5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '18:30:00';
    }
    
    // 오전 스케줄 생성 (9:00 - 12:00)
    const morningSchedule = {
      employee_id: heo.id,
      schedule_date: date,
      scheduled_start: '09:00:00',
      scheduled_end: morningEnd,
      status: 'approved',
      employee_note: '오전 근무',
      total_hours: calculateHours('09:00:00', morningEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오후 스케줄 생성 (13:00 - 종료시간)
    const afternoonSchedule = {
      employee_id: heo.id,
      schedule_date: date,
      scheduled_start: afternoonStart,
      scheduled_end: afternoonEnd,
      status: 'approved',
      employee_note: '오후 근무',
      total_hours: calculateHours(afternoonStart, afternoonEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오전 스케줄 삽입
    const { data: morningData, error: morningError } = await supabase
      .from('schedules')
      .insert(morningSchedule)
      .select()
      .single();
      
    if (morningError) {
      console.error(`오전 스케줄 삽입 실패:`, morningError);
    } else {
      console.log(`  ✅ 오전: 09:00-${morningEnd} (${morningSchedule.total_hours}시간)`);
    }
    
    // 오후 스케줄 삽입
    const { data: afternoonData, error: afternoonError } = await supabase
      .from('schedules')
      .insert(afternoonSchedule)
      .select()
      .single();
      
    if (afternoonError) {
      console.error(`오후 스케줄 삽입 실패:`, afternoonError);
    } else {
      console.log(`  ✅ 오후: ${afternoonStart}-${afternoonEnd} (${afternoonSchedule.total_hours}시간)`);
    }
    
    const totalHours = morningSchedule.total_hours + afternoonSchedule.total_hours;
    console.log(`  📊 총 근무시간: ${totalHours}시간 (목표: ${settlement.hours}시간)`);
    
    if (Math.abs(totalHours - settlement.hours) > 0.1) {
      console.log(`  ⚠️ 시간 차이: ${totalHours - settlement.hours}시간`);
    } else {
      console.log(`  ✅ 시간 일치`);
    }
    
    console.log('');
  }
  
  console.log('=== 허상원 스케줄 재입력 완료 ===');
}

recreateHeoSchedules().catch(console.error);

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 정산서 데이터 (사용자 제공)
const settlementData = {
  "2025-08-11": { hours: 7.5, amount: 97500, note: "연장근무" },
  "2025-08-12": { hours: 8, amount: 104000, note: "화요일근무" },
  "2025-08-13": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-18": { hours: 6.5, amount: 84500, note: "연장근무" },
  "2025-08-19": { hours: 7, amount: 91000, note: "화요일근무" },
  "2025-08-20": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-21": { hours: 8, amount: 104000, note: "추가근무" },
  "2025-08-25": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-26": { hours: 8.5, amount: 110500, note: "화요일근무" },
  "2025-08-27": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-28": { hours: 7, amount: 91000, note: "추가근무" },
  "2025-08-29": { hours: 7, amount: 91000, note: "연장근무" }
};

// 시간 계산 함수
function calculateHours(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10;
}

async function recreateHeoSchedules() {
  console.log('=== 허상원 스케줄 재입력 (점심시간 제외) ===');
  
  // 허상원 직원 정보 확인
  const { data: heo, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('name', '허상원')
    .single();
    
  if (empError) {
    console.error('허상원 직원 정보 조회 실패:', empError);
    return;
  }
  
  console.log('허상원 정보:', {
    name: heo.name,
    employee_id: heo.employee_id,
    id: heo.id
  });
  
  const targetDates = Object.keys(settlementData).sort();
  
  console.log(`\n재입력할 날짜 수: ${targetDates.length}개\n`);
  
  for (const date of targetDates) {
    const settlement = settlementData[date];
    console.log(`📅 ${date} (${settlement.note}) - 목표: ${settlement.hours}시간`);
    
    // 정산서 시간에 맞춰 스케줄 생성
    let morningEnd, afternoonStart, afternoonEnd;
    
    // 정산서 시간에 따라 오전/오후 시간 배분
    if (settlement.hours === 7.5) {
      // 7.5시간: 9-12 (3시간) + 13-17:30 (4.5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '17:30:00';
    } else if (settlement.hours === 8) {
      // 8시간: 9-12 (3시간) + 13-18 (5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '18:00:00';
    } else if (settlement.hours === 6.5) {
      // 6.5시간: 9-12 (3시간) + 13-16:30 (3.5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '16:30:00';
    } else if (settlement.hours === 7) {
      // 7시간: 9-12 (3시간) + 13-17 (4시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '17:00:00';
    } else if (settlement.hours === 8.5) {
      // 8.5시간: 9-12 (3시간) + 13-18:30 (5.5시간)
      morningEnd = '12:00:00';
      afternoonStart = '13:00:00';
      afternoonEnd = '18:30:00';
    }
    
    // 오전 스케줄 생성 (9:00 - 12:00)
    const morningSchedule = {
      employee_id: heo.id,
      schedule_date: date,
      scheduled_start: '09:00:00',
      scheduled_end: morningEnd,
      status: 'approved',
      employee_note: '오전 근무',
      total_hours: calculateHours('09:00:00', morningEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오후 스케줄 생성 (13:00 - 종료시간)
    const afternoonSchedule = {
      employee_id: heo.id,
      schedule_date: date,
      scheduled_start: afternoonStart,
      scheduled_end: afternoonEnd,
      status: 'approved',
      employee_note: '오후 근무',
      total_hours: calculateHours(afternoonStart, afternoonEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오전 스케줄 삽입
    const { data: morningData, error: morningError } = await supabase
      .from('schedules')
      .insert(morningSchedule)
      .select()
      .single();
      
    if (morningError) {
      console.error(`오전 스케줄 삽입 실패:`, morningError);
    } else {
      console.log(`  ✅ 오전: 09:00-${morningEnd} (${morningSchedule.total_hours}시간)`);
    }
    
    // 오후 스케줄 삽입
    const { data: afternoonData, error: afternoonError } = await supabase
      .from('schedules')
      .insert(afternoonSchedule)
      .select()
      .single();
      
    if (afternoonError) {
      console.error(`오후 스케줄 삽입 실패:`, afternoonError);
    } else {
      console.log(`  ✅ 오후: ${afternoonStart}-${afternoonEnd} (${afternoonSchedule.total_hours}시간)`);
    }
    
    const totalHours = morningSchedule.total_hours + afternoonSchedule.total_hours;
    console.log(`  📊 총 근무시간: ${totalHours}시간 (목표: ${settlement.hours}시간)`);
    
    if (Math.abs(totalHours - settlement.hours) > 0.1) {
      console.log(`  ⚠️ 시간 차이: ${totalHours - settlement.hours}시간`);
    } else {
      console.log(`  ✅ 시간 일치`);
    }
    
    console.log('');
  }
  
  console.log('=== 허상원 스케줄 재입력 완료 ===');
}

recreateHeoSchedules().catch(console.error);
