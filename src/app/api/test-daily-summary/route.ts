import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 오늘 날짜 (한국 시간 기준)
    const koreaDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const today = koreaDate.toISOString().split('T')[0];
    
    // 이번 달 시작일과 종료일
    const startOfMonth = new Date(koreaDate.getFullYear(), koreaDate.getMonth(), 1);
    const endOfMonth = new Date(koreaDate.getFullYear(), koreaDate.getMonth() + 1, 0);
    
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];
    
    console.log(`📊 일일 요약 테스트 중... (${today})`);
    
    // 업무 데이터 가져오기
    const { data: allTasks, error: tasksError } = await supabase
      .from('employee_tasks')
      .select(`
        *,
        operation_type:operation_types(code, name, points),
        employee:employees(name, employee_id)
      `)
      .gte('task_date', startDate)
      .lte('task_date', endDate);
    
    if (tasksError) {
      console.error('업무 데이터 로드 실패:', tasksError);
      return NextResponse.json({ error: '데이터 로드 실패' }, { status: 500 });
    }
    
    // 팀원별 통계 계산
    const employeeStats = new Map();
    
    allTasks?.forEach(task => {
      const employeeId = task.employee_id;
      const employeeName = task.employee?.name || '알 수 없음';
      const employeeCode = task.employee?.employee_id || '';
      
      if (!employeeStats.has(employeeId)) {
        employeeStats.set(employeeId, {
          name: employeeName,
          employee_id: employeeCode,
          totalSales: 0,
          totalPoints: 0,
          totalTasks: 0,
          masgolfSales: 0,
          masgolfPoints: 0,
          masgolfTasks: 0,
          singsingolfSales: 0,
          singsingolfPoints: 0,
          singsingolfTasks: 0
        });
      }
      
      const stats = employeeStats.get(employeeId);
      const opCode = task.operation_type?.code || '';
      const points = task.operation_type?.points || 0;
      const sales = task.sales_amount || 0;
      
      // 전체 통계
      stats.totalSales += sales;
      stats.totalPoints += points;
      stats.totalTasks += 1;
      
      // 마스골프 통계
      if (['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9'].includes(opCode) ||
          (opCode === 'OP10' && (task.op10Category === 'masgolf' || !task.op10Category))) {
        stats.masgolfSales += sales;
        stats.masgolfPoints += points;
        stats.masgolfTasks += 1;
      }
      
      // 싱싱골프 통계
      if (['OP11', 'OP12'].includes(opCode) ||
          (opCode === 'OP10' && task.op10Category === 'singsingolf')) {
        stats.singsingolfSales += sales;
        stats.singsingolfPoints += points;
        stats.singsingolfTasks += 1;
      }
    });
    
    // 순위 계산
    const rankings = {
      sales: Array.from(employeeStats.values())
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 3),
      points: Array.from(employeeStats.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3),
      tasks: Array.from(employeeStats.values())
        .sort((a, b) => b.totalTasks - a.totalTasks)
        .slice(0, 3)
    };
    
    // 협업 성과 계산
    const collaborationStats = {
      masgolf: {
        sales: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.masgolfSales, 0),
        points: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.masgolfPoints, 0),
        tasks: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.masgolfTasks, 0)
      },
      singsingolf: {
        sales: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.singsingolfSales, 0),
        points: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.singsingolfPoints, 0),
        tasks: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.singsingolfTasks, 0)
      }
    };
    
    // 신규 상담 통계
    const newConsultations = allTasks?.filter(task => {
      const opCode = task.operation_type?.code || '';
      return (opCode === 'OP5' || opCode === 'OP12') && task.customer_type === 'new';
    }).length || 0;
    
    return NextResponse.json({
      success: true,
      date: today,
      period: `${startDate} ~ ${endDate}`,
      totalTasks: allTasks?.length || 0,
      employeeCount: employeeStats.size,
      rankings,
      collaborationStats,
      newConsultations,
      employeeStats: Array.from(employeeStats.values())
    });
    
  } catch (error) {
    console.error('일일 요약 테스트 실패:', error);
    return NextResponse.json(
      { error: '일일 요약 테스트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
