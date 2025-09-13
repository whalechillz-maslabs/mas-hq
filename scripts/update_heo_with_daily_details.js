const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 일별 상세 데이터 생성 함수
function generateDailyDetails(workPeriod, workHours, hourlyRate) {
  const dailyDetails = [];
  
  // 근무기간을 파싱하여 일별 데이터 생성
  const [startDate, endDate] = workPeriod.split('~');
  const start = new Date(`2025-${startDate.replace('/', '-')}`);
  const end = new Date(`2025-${endDate.replace('/', '-')}`);
  
  // 근무일수 계산
  const workDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const hoursPerDay = workHours / workDays;
  
  // 각 날짜별로 데이터 생성
  for (let i = 0; i < workDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    
    // 주말 제외 (토요일=6, 일요일=0)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dailyDetails.push({
        date: currentDate.toISOString().split('T')[0],
        hours: hoursPerDay,
        hourly_rate: hourlyRate,
        daily_wage: hoursPerDay * hourlyRate
      });
    }
  }
  
  return dailyDetails;
}

async function updateHeoPayslipsWithDailyDetails() {
  console.log('📋 허상원 급여명세서에 일별상세 내용 추가 중...');
  
  try {
    // 허상원의 모든 급여명세서 조회
    const { data: payslips, error: fetchError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832')
      .order('period', { ascending: true });

    if (fetchError) {
      console.error('❌ 허상원 급여명세서 조회 실패:', fetchError);
      return;
    }

    // 각 급여명세서별 일별상세 데이터 매핑
    const payslipDetails = {
      '2025-06-1': { workPeriod: '6/19~6/30', workHours: 27, workDays: 6 },
      '2025-07-1': { workPeriod: '7/2~7/11', workHours: 44.5, workDays: 7 },
      '2025-07-2': { workPeriod: '7/14~7/25', workHours: 46, workDays: 7 },
      '2025-07-3': { workPeriod: '7/28~7/30', workHours: 21, workDays: 3 },
      '2025-08-1': { workPeriod: '8/1~8/8', workHours: 33.5, workDays: 5 },
      '2025-08-2': { workPeriod: '8/11~8/29', workHours: 87.5, workDays: 12 }
    };

    // 각 급여명세서 업데이트
    for (const payslip of payslips) {
      const detail = payslipDetails[payslip.period];
      if (!detail) {
        console.log(`⚠️ ${payslip.period}에 대한 상세 정보가 없습니다.`);
        continue;
      }

      // 일별상세 데이터 생성
      const dailyDetails = generateDailyDetails(detail.workPeriod, detail.workHours, 13000);

      // 급여명세서 업데이트
      const { error: updateError } = await supabase
        .from('payslips')
        .update({
          daily_details: dailyDetails
        })
        .eq('id', payslip.id);

      if (updateError) {
        console.error(`❌ ${payslip.period} 급여명세서 업데이트 실패:`, updateError);
        continue;
      }

      console.log(`✅ ${payslip.period} 급여명세서 일별상세 추가 완료`);
      console.log(`   📊 근무기간: ${detail.workPeriod}`);
      console.log(`   ⏰ 총 근무시간: ${detail.workHours}시간`);
      console.log(`   📅 일별 상세: ${dailyDetails.length}일`);
      
      // 일별상세 내용 미리보기 (처음 3일)
      dailyDetails.slice(0, 3).forEach((day, index) => {
        console.log(`     ${index + 1}. ${day.date}: ${day.hours}시간 × ${day.hourly_rate.toLocaleString()}원 = ${day.daily_wage.toLocaleString()}원`);
      });
      if (dailyDetails.length > 3) {
        console.log(`     ... 외 ${dailyDetails.length - 3}일`);
      }
    }

    console.log('\n🎉 허상원 급여명세서 일별상세 내용 추가 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateHeoPayslipsWithDailyDetails();
