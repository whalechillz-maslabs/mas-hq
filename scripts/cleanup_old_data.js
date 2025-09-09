const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

class DataCleanup {
  constructor() {
    this.retentionPolicies = {
      schedules: 90,        // 90일 이상된 스케줄 삭제
      employee_tasks: 180,  // 180일 이상된 업무 기록 삭제
      daily_work_records: 365, // 1년 이상된 일일 근무 기록 삭제
      weekly_settlements: 730, // 2년 이상된 주간 정산 삭제
      salaries: 1095        // 3년 이상된 급여 기록 삭제
    };
  }

  // 구데이터 정리 실행
  async cleanupOldData() {
    console.log('=== 구데이터 정리 시작 ===');
    
    const results = {};
    
    try {
      // 1. 구 스케줄 정리
      console.log('\n1. 구 스케줄 정리 중...');
      const scheduleResult = await this.cleanupSchedules();
      results.schedules = scheduleResult;
      
      // 2. 구 업무 기록 정리
      console.log('\n2. 구 업무 기록 정리 중...');
      const taskResult = await this.cleanupEmployeeTasks();
      results.employee_tasks = taskResult;
      
      // 3. 구 일일 근무 기록 정리
      console.log('\n3. 구 일일 근무 기록 정리 중...');
      const workRecordResult = await this.cleanupDailyWorkRecords();
      results.daily_work_records = workRecordResult;
      
      // 4. 구 주간 정산 정리
      console.log('\n4. 구 주간 정산 정리 중...');
      const settlementResult = await this.cleanupWeeklySettlements();
      results.weekly_settlements = settlementResult;
      
      // 5. 구 급여 기록 정리
      console.log('\n5. 구 급여 기록 정리 중...');
      const salaryResult = await this.cleanupSalaries();
      results.salaries = salaryResult;
      
      // 결과 요약
      console.log('\n=== 정리 결과 요약 ===');
      let totalDeleted = 0;
      
      for (const [table, result] of Object.entries(results)) {
        if (result.success) {
          console.log(`✅ ${table}: ${result.deletedCount}개 삭제`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`❌ ${table}: 정리 실패 - ${result.error}`);
        }
      }
      
      console.log(`\n📊 총 삭제된 레코드: ${totalDeleted}개`);
      
      return results;
      
    } catch (error) {
      console.error('❌ 구데이터 정리 중 오류 발생:', error);
      throw error;
    }
  }

  // 구 스케줄 정리
  async cleanupSchedules() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.schedules);
    
    try {
      // 먼저 삭제할 레코드 수 확인
      const { count, error: countError } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .lt('date', cutoffDate.toISOString().split('T')[0]);
      
      if (countError) {
        return { success: false, error: countError.message, deletedCount: 0 };
      }
      
      if (count === 0) {
        return { success: true, error: null, deletedCount: 0 };
      }
      
      // 실제 삭제
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .lt('date', cutoffDate.toISOString().split('T')[0]);
      
      if (deleteError) {
        return { success: false, error: deleteError.message, deletedCount: 0 };
      }
      
      console.log(`  🗑️  ${count}개의 구 스케줄 삭제 (${cutoffDate.toISOString().split('T')[0]} 이전)`);
      return { success: true, error: null, deletedCount: count };
      
    } catch (error) {
      return { success: false, error: error.message, deletedCount: 0 };
    }
  }

  // 구 업무 기록 정리
  async cleanupEmployeeTasks() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.employee_tasks);
    
    try {
      const { count, error: countError } = await supabase
        .from('employee_tasks')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString());
      
      if (countError) {
        return { success: false, error: countError.message, deletedCount: 0 };
      }
      
      if (count === 0) {
        return { success: true, error: null, deletedCount: 0 };
      }
      
      const { error: deleteError } = await supabase
        .from('employee_tasks')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (deleteError) {
        return { success: false, error: deleteError.message, deletedCount: 0 };
      }
      
      console.log(`  🗑️  ${count}개의 구 업무 기록 삭제 (${cutoffDate.toISOString().split('T')[0]} 이전)`);
      return { success: true, error: null, deletedCount: count };
      
    } catch (error) {
      return { success: false, error: error.message, deletedCount: 0 };
    }
  }

  // 구 일일 근무 기록 정리
  async cleanupDailyWorkRecords() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.daily_work_records);
    
    try {
      // daily_performance_records 테이블이 존재하는지 확인
      const { count, error: countError } = await supabase
        .from('daily_performance_records')
        .select('*', { count: 'exact', head: true })
        .lt('date', cutoffDate.toISOString().split('T')[0]);
      
      if (countError) {
        console.log(`  ⚠️  daily_performance_records 테이블 없음: ${countError.message}`);
        return { success: true, error: null, deletedCount: 0 };
      }
      
      if (count === 0) {
        return { success: true, error: null, deletedCount: 0 };
      }
      
      const { error: deleteError } = await supabase
        .from('daily_performance_records')
        .delete()
        .lt('date', cutoffDate.toISOString().split('T')[0]);
      
      if (deleteError) {
        return { success: false, error: deleteError.message, deletedCount: 0 };
      }
      
      console.log(`  🗑️  ${count}개의 구 일일 근무 기록 삭제 (${cutoffDate.toISOString().split('T')[0]} 이전)`);
      return { success: true, error: null, deletedCount: count };
      
    } catch (error) {
      return { success: false, error: error.message, deletedCount: 0 };
    }
  }

  // 구 주간 정산 정리
  async cleanupWeeklySettlements() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.weekly_settlements);
    
    try {
      // weekly_settlements 테이블이 존재하는지 확인
      const { count, error: countError } = await supabase
        .from('weekly_settlements')
        .select('*', { count: 'exact', head: true })
        .lt('week_start_date', cutoffDate.toISOString().split('T')[0]);
      
      if (countError) {
        console.log(`  ⚠️  weekly_settlements 테이블 없음: ${countError.message}`);
        return { success: true, error: null, deletedCount: 0 };
      }
      
      if (count === 0) {
        return { success: true, error: null, deletedCount: 0 };
      }
      
      const { error: deleteError } = await supabase
        .from('weekly_settlements')
        .delete()
        .lt('week_start_date', cutoffDate.toISOString().split('T')[0]);
      
      if (deleteError) {
        return { success: false, error: deleteError.message, deletedCount: 0 };
      }
      
      console.log(`  🗑️  ${count}개의 구 주간 정산 삭제 (${cutoffDate.toISOString().split('T')[0]} 이전)`);
      return { success: true, error: null, deletedCount: count };
      
    } catch (error) {
      return { success: false, error: error.message, deletedCount: 0 };
    }
  }

  // 구 급여 기록 정리
  async cleanupSalaries() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.salaries);
    
    try {
      const { count, error: countError } = await supabase
        .from('salaries')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString());
      
      if (countError) {
        return { success: false, error: countError.message, deletedCount: 0 };
      }
      
      if (count === 0) {
        return { success: true, error: null, deletedCount: 0 };
      }
      
      const { error: deleteError } = await supabase
        .from('salaries')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (deleteError) {
        return { success: false, error: deleteError.message, deletedCount: 0 };
      }
      
      console.log(`  🗑️  ${count}개의 구 급여 기록 삭제 (${cutoffDate.toISOString().split('T')[0]} 이전)`);
      return { success: true, error: null, deletedCount: count };
      
    } catch (error) {
      return { success: false, error: error.message, deletedCount: 0 };
    }
  }
}

// 스크립트가 직접 실행될 때만 정리 실행
if (require.main === module) {
  const cleanup = new DataCleanup();
  cleanup.cleanupOldData().catch(console.error);
}

module.exports = { DataCleanup };
