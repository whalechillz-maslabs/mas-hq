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

async function generateHeoSettlement() {
  try {
    console.log('🧾 허상원 정산서 생성 시작');
    
    // 1. 허상원 직원 정보 조회
    const { data: heoEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    if (employeeError) {
      console.error('❌ 허상원 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 2. 허상원 8월 스케줄 데이터 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 허상원 스케줄 조회 실패:', scheduleError);
      return;
    }
    
    // 3. 허상원 시급 데이터 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: false });
    
    if (wageError) {
      console.error('❌ 허상원 시급 데이터 조회 실패:', wageError);
      return;
    }
    
    // 4. 정산 계산
    let totalHours = 0;
    let totalAmount = 0;
    const dailyDetails = [];
    
    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.schedule_date);
      const currentWage = wages.find(wage => 
        new Date(wage.effective_start_date) <= scheduleDate &&
        (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
      );
      
      if (currentWage) {
        const dailyAmount = schedule.total_hours * currentWage.base_wage;
        totalHours += schedule.total_hours;
        totalAmount += dailyAmount;
        
        dailyDetails.push({
          date: schedule.schedule_date,
          startTime: schedule.scheduled_start,
          endTime: schedule.scheduled_end,
          hours: schedule.total_hours,
          hourlyRate: currentWage.base_wage,
          amount: dailyAmount,
          note: schedule.employee_note
        });
      }
    });
    
    // 5. 정산서 데이터 생성
    const settlementData = {
      employee_id: heoEmployee.id,
      employee_name: heoEmployee.name,
      employee_code: heoEmployee.employee_id,
      period: '2025-08-11 ~ 2025-08-13',
      total_hours: totalHours,
      base_salary: totalAmount,
      overtime_pay: 0,
      incentive: 0,
      tax_amount: 0,
      net_salary: totalAmount,
      daily_details: dailyDetails,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    
    console.log('📊 정산서 데이터:');
    console.log('  - 직원:', settlementData.employee_name, `(${settlementData.employee_code})`);
    console.log('  - 기간:', settlementData.period);
    console.log('  - 총 근무시간:', settlementData.total_hours, '시간');
    console.log('  - 총 금액:', settlementData.net_salary.toLocaleString(), '원');
    
    console.log('📅 일별 상세 내역:');
    dailyDetails.forEach((detail, index) => {
      console.log(`  ${index + 1}. ${detail.date}: ${detail.hours}시간 × ${detail.hourlyRate.toLocaleString()}원 = ${detail.amount.toLocaleString()}원`);
      console.log(`     시간: ${detail.startTime} ~ ${detail.endTime}`);
      console.log(`     노트: ${detail.note}`);
    });
    
    // 6. 정산서 HTML 생성
    const htmlContent = generateSettlementHTML(settlementData);
    
    // 7. HTML 파일 저장
    const filename = `heo_settlement_${new Date().toISOString().split('T')[0]}.html`;
    fs.writeFileSync(filename, htmlContent);
    console.log(`✅ 정산서 HTML 파일 생성: ${filename}`);
    
    // 8. 데이터베이스에 정산서 저장 (payslips 테이블)
    const payslipData = {
      employee_id: heoEmployee.id,
      period: '2025-08',
      employment_type: 'part_time',
      base_salary: totalAmount,
      overtime_pay: 0,
      incentive: 0,
      point_bonus: 0,
      total_earnings: totalAmount,
      tax_amount: 0,
      net_salary: totalAmount,
      total_hours: totalHours,
      hourly_rate: 13000,
      daily_details: dailyDetails.map(detail => ({
        date: detail.date,
        hours: detail.hours,
        daily_wage: detail.amount,
        hourly_wage: detail.hourlyRate
      })),
      status: 'issued',
      issued_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: savedPayslip, error: payslipError } = await supabase
      .from('payslips')
      .insert([payslipData])
      .select();
    
    if (payslipError) {
      console.error('❌ 정산서 데이터베이스 저장 실패:', payslipError);
    } else {
      console.log('✅ 정산서 데이터베이스 저장 성공:', savedPayslip[0].id);
      console.log('📄 정산서 ID:', savedPayslip[0].id);
      console.log('🔗 정산서 조회 URL: https://www.maslabs.kr/payslips');
    }
    
    console.log('🎉 허상원 정산서 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

function generateSettlementHTML(data) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>허상원 정산서</title>
    <style>
        body {
            font-family: 'Malgun Gothic', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            color: black;
        }
        .settlement-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border: 1px solid #ddd;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 24px;
        }
        .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
        }
        .employee-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .info-item {
            text-align: center;
        }
        .info-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .info-value {
            color: #666;
        }
        .summary {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #e8f4fd;
            border-radius: 5px;
        }
        .summary h3 {
            margin-top: 0;
            color: #333;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 3px;
        }
        .summary-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .details {
            margin-bottom: 30px;
        }
        .details h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .details-table th,
        .details-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .details-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .details-table tr:hover {
            background-color: #f5f5f5;
        }
        .total {
            text-align: right;
            margin-top: 20px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; padding: 0; }
            .settlement-container { border: none; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="settlement-container">
        <div class="header">
            <h1>MASLABS 정산서</h1>
            <h2>${data.period}</h2>
        </div>
        
        <div class="employee-info">
            <div class="info-item">
                <div class="info-label">직원명</div>
                <div class="info-value">${data.employee_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">직원코드</div>
                <div class="info-value">${data.employee_code}</div>
            </div>
            <div class="info-item">
                <div class="info-label">정산기간</div>
                <div class="info-value">${data.period}</div>
            </div>
        </div>
        
        <div class="summary">
            <h3>정산 요약</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">총 근무시간</div>
                    <div class="summary-value">${data.total_hours}시간</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">기본급</div>
                    <div class="summary-value">${data.base_salary.toLocaleString()}원</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">총 지급액</div>
                    <div class="summary-value">${data.net_salary.toLocaleString()}원</div>
                </div>
            </div>
        </div>
        
        <div class="details">
            <h3>일별 상세 내역</h3>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>근무시간</th>
                        <th>시급</th>
                        <th>금액</th>
                        <th>비고</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.daily_details.map(detail => `
                        <tr>
                            <td>${detail.date}</td>
                            <td>${detail.startTime} ~ ${detail.endTime}<br><small>(${detail.hours}시간)</small></td>
                            <td>${detail.hourlyRate.toLocaleString()}원</td>
                            <td>${detail.amount.toLocaleString()}원</td>
                            <td>${detail.note || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="total">
            <div class="total-amount">총 지급액: ${data.net_salary.toLocaleString()}원</div>
        </div>
        
        <div class="footer">
            <p>본 정산서는 MASLABS 시스템에서 자동 생성되었습니다.</p>
            <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
        </div>
    </div>
</body>
</html>
  `;
}

generateHeoSettlement();
