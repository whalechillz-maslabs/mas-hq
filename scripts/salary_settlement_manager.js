const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

class SalarySettlementManager {
  constructor() {
    this.hourlyRate = 13000; // 허상원 시급
  }

  // 정산서 데이터 생성
  generateSettlementReport(employeeName, startDate, endDate) {
    return {
      company: 'MASGOLF',
      settlementDate: new Date().toLocaleDateString('ko-KR'),
      employeeName,
      period: `${startDate} ~ ${endDate}`,
      hourlyRate: this.hourlyRate,
      settlements: []
    };
  }

  // 스케줄에서 정산 데이터 계산
  async calculateSettlement(employeeName, startDate, endDate) {
    console.log(`=== ${employeeName} 정산 계산 (${startDate} ~ ${endDate}) ===`);
    
    // 직원 정보 조회
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', employeeName)
      .single();
      
    if (empError) {
      console.error('직원 정보 조회 실패:', empError);
      return null;
    }

    // 기간 내 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
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

    // 정산 데이터 계산
    const settlements = [];
    let totalHours = 0;
    let totalAmount = 0;

    Object.keys(scheduleByDate).sort().forEach(date => {
      const daySchedules = scheduleByDate[date];
      const dayHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      const dayAmount = dayHours * this.hourlyRate;
      
      totalHours += dayHours;
      totalAmount += dayAmount;

      settlements.push({
        date,
        dayOfWeek: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
        startTime: daySchedules[0].scheduled_start,
        endTime: daySchedules[daySchedules.length - 1].scheduled_end,
        hours: dayHours,
        amount: dayAmount,
        note: this.getWorkNote(dayHours)
      });
    });

    return {
      employee: employee,
      period: { startDate, endDate },
      settlements,
      summary: {
        totalDays: settlements.length,
        totalHours,
        totalAmount,
        hourlyRate: this.hourlyRate
      }
    };
  }

  // 근무 시간에 따른 비고 생성
  getWorkNote(hours) {
    if (hours >= 9) return '연장근무';
    if (hours >= 8.5) return '추가근무';
    if (hours >= 8) return '정상근무';
    return '단축근무';
  }

  // 정산서 출력
  printSettlementReport(settlementData) {
    const { employee, period, settlements, summary } = settlementData;
    
    console.log('\n=== 정산서 ===');
    console.log(`회사: MASGOLF`);
    console.log(`정산일: ${new Date().toLocaleDateString('ko-KR')}`);
    console.log(`근로자명: ${employee.name}`);
    console.log(`정산 기간: ${period.startDate} ~ ${period.endDate}`);
    console.log(`총 근무일수: ${summary.totalDays}일`);
    console.log(`시급: ${summary.hourlyRate.toLocaleString()}원`);
    console.log('');

    // 주차별 그룹화
    const weeklyGroups = this.groupByWeek(settlements);
    
    weeklyGroups.forEach((week, index) => {
      const weekNumber = index + 1;
      const weekHours = week.reduce((sum, s) => sum + s.hours, 0);
      const weekAmount = week.reduce((sum, s) => sum + s.amount, 0);
      
      console.log(`${weekNumber}주차 (${week[0].date} ~ ${week[week.length - 1].date})`);
      
      week.forEach(settlement => {
        console.log(`${settlement.date}\t${settlement.dayOfWeek}\t${settlement.startTime}-${settlement.endTime}\t${settlement.hours}시간\t${settlement.amount.toLocaleString()}원\t${settlement.note}`);
      });
      
      console.log(`${weekNumber}주차 소계\t${weekHours}시간\t${weekAmount.toLocaleString()}원`);
      console.log('');
    });

    console.log('총 합계');
    console.log(`총 근무시간: ${summary.totalHours}시간`);
    console.log(`총 지급액: ${summary.totalAmount.toLocaleString()}원`);
    console.log('');

    // 경고사항
    if (summary.totalHours > 80) {
      console.log('⚠️ 근무시간 급증 주의');
      console.log(`${period.startDate} ~ ${period.endDate} 기간: ${summary.totalHours}시간 (${summary.totalDays}일간)`);
      console.log(`일 평균: ${(summary.totalHours / summary.totalDays).toFixed(1)}시간`);
    }
  }

  // 주차별 그룹화
  groupByWeek(settlements) {
    const weeks = [];
    let currentWeek = [];
    let currentWeekStart = null;

    settlements.forEach(settlement => {
      const date = new Date(settlement.date);
      const weekStart = this.getWeekStart(date);

      if (currentWeekStart === null || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) {
          weeks.push([...currentWeek]);
        }
        currentWeek = [settlement];
        currentWeekStart = weekStart;
      } else {
        currentWeek.push(settlement);
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

  // 정산 데이터를 데이터베이스에 저장
  async saveSettlement(settlementData, paymentStatus = 'pending') {
    const { employee, period, summary } = settlementData;
    
    const settlementRecord = {
      employee_id: employee.id,
      period_start: period.startDate,
      period_end: period.endDate,
      total_hours: summary.totalHours,
      hourly_rate: summary.hourlyRate,
      total_amount: summary.totalAmount,
      payment_status: paymentStatus,
      settlement_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('salary_settlements')
      .insert(settlementRecord)
      .select()
      .single();

    if (error) {
      console.error('정산 데이터 저장 실패:', error);
      return null;
    }

    console.log(`✅ 정산 데이터 저장 완료: ID ${data.id}`);
    return data;
  }

  // 지급 상태 업데이트
  async updatePaymentStatus(settlementId, status, paymentDate = null) {
    const updateData = {
      payment_status: status,
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('salary_settlements')
      .update(updateData)
      .eq('id', settlementId)
      .select()
      .single();

    if (error) {
      console.error('지급 상태 업데이트 실패:', error);
      return null;
    }

    console.log(`✅ 지급 상태 업데이트 완료: ${status}`);
    return data;
  }

  // 정산 내역 조회
  async getSettlementHistory(employeeName) {
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', employeeName)
      .single();
      
    if (empError) {
      console.error('직원 정보 조회 실패:', empError);
      return null;
    }

    const { data: settlements, error: settlementError } = await supabase
      .from('salary_settlements')
      .select('*')
      .eq('employee_id', employee.id)
      .order('settlement_date', { ascending: false });

    if (settlementError) {
      console.error('정산 내역 조회 실패:', settlementError);
      return null;
    }

    return settlements;
  }
}

// 스크립트 실행
if (require.main === module) {
  const manager = new SalarySettlementManager();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--calculate')) {
    const employeeName = args.find(arg => arg.startsWith('--employee='))?.split('=')[1] || '허상원';
    const startDate = args.find(arg => arg.startsWith('--start='))?.split('=')[1] || '2025-08-11';
    const endDate = args.find(arg => arg.startsWith('--end='))?.split('=')[1] || '2025-08-29';
    
    manager.calculateSettlement(employeeName, startDate, endDate)
      .then(data => {
        if (data) {
          manager.printSettlementReport(data);
        }
      })
      .catch(console.error);
  } else if (args.includes('--history')) {
    const employeeName = args.find(arg => arg.startsWith('--employee='))?.split('=')[1] || '허상원';
    
    manager.getSettlementHistory(employeeName)
      .then(settlements => {
        if (settlements) {
          console.log(`=== ${employeeName} 정산 내역 ===`);
          settlements.forEach(settlement => {
            console.log(`${settlement.period_start} ~ ${settlement.period_end}: ${settlement.total_hours}시간, ${settlement.total_amount.toLocaleString()}원 (${settlement.payment_status})`);
          });
        }
      })
      .catch(console.error);
  }
}

module.exports = { SalarySettlementManager };
