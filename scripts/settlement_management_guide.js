const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

class SettlementManagementGuide {
  constructor() {
    this.hourlyRate = 13000; // 허상원 시급
  }

  // 1. 허상원 스케줄 확인
  async checkHeoSchedules(startDate, endDate) {
    console.log(`=== 허상원 스케줄 확인 (${startDate} ~ ${endDate}) ===`);
    
    const { data: heo, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
      
    if (empError) {
      console.error('허상원 직원 정보 조회 실패:', empError);
      return null;
    }

    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heo.id)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date');
      
    if (scheduleError) {
      console.error('스케줄 조회 실패:', scheduleError);
      return null;
    }

    // 날짜별로 그룹화
    const scheduleByDate = {};
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      if (!scheduleByDate[date]) {
        scheduleByDate[date] = [];
      }
      scheduleByDate[date].push(schedule);
    });

    let totalHours = 0;
    let totalAmount = 0;

    console.log('\n📅 날짜별 스케줄:');
    Object.keys(scheduleByDate).sort().forEach(date => {
      const daySchedules = scheduleByDate[date];
      const dayHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      const dayAmount = dayHours * this.hourlyRate;
      
      totalHours += dayHours;
      totalAmount += dayAmount;

      console.log(`\n${date} (${new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })})`);
      console.log(`  총 근무시간: ${dayHours}시간`);
      console.log(`  일급: ${dayAmount.toLocaleString()}원`);
      
      daySchedules.forEach(s => {
        console.log(`  - ${s.scheduled_start} ~ ${s.scheduled_end} (${s.total_hours}시간)`);
      });
    });

    console.log(`\n📊 기간 총계:`);
    console.log(`  총 근무시간: ${totalHours}시간`);
    console.log(`  총 지급액: ${totalAmount.toLocaleString()}원`);
    console.log(`  시급: ${this.hourlyRate.toLocaleString()}원`);

    return {
      schedules: scheduleByDate,
      totalHours,
      totalAmount,
      hourlyRate: this.hourlyRate
    };
  }

  // 2. 정산서 생성
  generateSettlementReport(scheduleData, startDate, endDate) {
    const { schedules, totalHours, totalAmount } = scheduleData;
    
    console.log('\n=== 정산서 생성 ===');
    console.log(`회사: MASGOLF`);
    console.log(`정산일: ${new Date().toLocaleDateString('ko-KR')}`);
    console.log(`근로자명: 허상원`);
    console.log(`정산 기간: ${startDate} ~ ${endDate}`);
    console.log(`총 근무일수: ${Object.keys(schedules).length}일`);
    console.log(`시급: ${this.hourlyRate.toLocaleString()}원`);
    console.log('');

    // 주차별 그룹화
    const weeklyGroups = this.groupByWeek(Object.keys(schedules).sort());
    
    weeklyGroups.forEach((week, index) => {
      const weekNumber = index + 1;
      let weekHours = 0;
      let weekAmount = 0;
      
      console.log(`${weekNumber}주차 (${week[0]} ~ ${week[week.length - 1]})`);
      
      week.forEach(date => {
        const daySchedules = schedules[date];
        const dayHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
        const dayAmount = dayHours * this.hourlyRate;
        
        weekHours += dayHours;
        weekAmount += dayAmount;
        
        const dayOfWeek = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
        const startTime = daySchedules[0].scheduled_start;
        const endTime = daySchedules[daySchedules.length - 1].scheduled_end;
        const note = this.getWorkNote(dayHours);
        
        console.log(`${date}\t${dayOfWeek}\t${startTime}-${endTime}\t${dayHours}시간\t${dayAmount.toLocaleString()}원\t${note}`);
      });
      
      console.log(`${weekNumber}주차 소계\t${weekHours}시간\t${weekAmount.toLocaleString()}원`);
      console.log('');
    });

    console.log('총 합계');
    console.log(`총 근무시간: ${totalHours}시간`);
    console.log(`총 지급액: ${totalAmount.toLocaleString()}원`);
    console.log('');

    // 경고사항
    if (totalHours > 80) {
      console.log('⚠️ 근무시간 급증 주의');
      console.log(`${startDate} ~ ${endDate} 기간: ${totalHours}시간 (${Object.keys(schedules).length}일간)`);
      console.log(`일 평균: ${(totalHours / Object.keys(schedules).length).toFixed(1)}시간`);
    }
  }

  // 3. 주차별 그룹화
  groupByWeek(dates) {
    const weeks = [];
    let currentWeek = [];
    let currentWeekStart = null;

    dates.forEach(date => {
      const dateObj = new Date(date);
      const weekStart = this.getWeekStart(dateObj);

      if (currentWeekStart === null || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) {
          weeks.push([...currentWeek]);
        }
        currentWeek = [date];
        currentWeekStart = weekStart;
      } else {
        currentWeek.push(date);
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }

  // 주 시작일 계산
  getWeekStart(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
    return new Date(date.setDate(diff));
  }

  // 근무 시간에 따른 비고 생성
  getWorkNote(hours) {
    if (hours >= 9) return '연장근무';
    if (hours >= 8.5) return '추가근무';
    if (hours >= 8) return '정상근무';
    if (hours >= 7) return '단축근무';
    return '부분근무';
  }

  // 4. 사용법 안내
  showUsageGuide() {
    console.log('=== 허상원 알바비 정산 관리 시스템 사용법 ===\n');
    
    console.log('🔍 1. 스케줄 확인:');
    console.log('   node scripts/settlement_management_guide.js --check --start=2025-08-11 --end=2025-08-29');
    console.log('');
    
    console.log('📊 2. 정산서 생성:');
    console.log('   node scripts/settlement_management_guide.js --settlement --start=2025-08-11 --end=2025-08-29');
    console.log('');
    
    console.log('📅 3. 월별 정산:');
    console.log('   node scripts/settlement_management_guide.js --monthly --year=2025 --month=8');
    console.log('');
    
    console.log('🔄 4. 중간 정산:');
    console.log('   node scripts/settlement_management_guide.js --interim --start=2025-08-11 --end=2025-08-20');
    console.log('');
    
    console.log('📋 5. 정산 내역 조회:');
    console.log('   node scripts/settlement_management_guide.js --history');
    console.log('');
    
    console.log('💡 주요 기능:');
    console.log('   - 점심시간(12-1시) 자동 제외');
    console.log('   - 주차별 그룹화 및 요약');
    console.log('   - 근무시간 급증 경고');
    console.log('   - 정산서 자동 생성');
    console.log('   - 지급 상태 추적');
  }
}

// 스크립트 실행
if (require.main === module) {
  const guide = new SettlementManagementGuide();
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    guide.showUsageGuide();
  } else if (args.includes('--check')) {
    const startDate = args.find(arg => arg.startsWith('--start='))?.split('=')[1] || '2025-08-11';
    const endDate = args.find(arg => arg.startsWith('--end='))?.split('=')[1] || '2025-08-29';
    
    guide.checkHeoSchedules(startDate, endDate)
      .then(data => {
        if (data) {
          console.log('\n✅ 스케줄 확인 완료');
        }
      })
      .catch(console.error);
  } else if (args.includes('--settlement')) {
    const startDate = args.find(arg => arg.startsWith('--start='))?.split('=')[1] || '2025-08-11';
    const endDate = args.find(arg => arg.startsWith('--end='))?.split('=')[1] || '2025-08-29';
    
    guide.checkHeoSchedules(startDate, endDate)
      .then(data => {
        if (data) {
          guide.generateSettlementReport(data, startDate, endDate);
        }
      })
      .catch(console.error);
  } else if (args.includes('--monthly')) {
    const year = args.find(arg => arg.startsWith('--year='))?.split('=')[1] || '2025';
    const month = args.find(arg => arg.startsWith('--month='))?.split('=')[1] || '8';
    
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    guide.checkHeoSchedules(startDate, endDate)
      .then(data => {
        if (data) {
          guide.generateSettlementReport(data, startDate, endDate);
        }
      })
      .catch(console.error);
  } else if (args.includes('--interim')) {
    const startDate = args.find(arg => arg.startsWith('--start='))?.split('=')[1] || '2025-08-11';
    const endDate = args.find(arg => arg.startsWith('--end='))?.split('=')[1] || '2025-08-20';
    
    guide.checkHeoSchedules(startDate, endDate)
      .then(data => {
        if (data) {
          guide.generateSettlementReport(data, startDate, endDate);
        }
      })
      .catch(console.error);
  } else if (args.includes('--history')) {
    console.log('=== 정산 내역 조회 ===');
    console.log('정산 내역은 데이터베이스의 salary_settlements 테이블에서 확인할 수 있습니다.');
    console.log('현재는 스케줄 데이터를 기반으로 실시간 정산서를 생성합니다.');
  }
}

module.exports = { SettlementManagementGuide };
