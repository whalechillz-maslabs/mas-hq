// Node.js 내장 fetch 사용

async function testDailySummary() {
  try {
    console.log('🔍 일일 요약 API 테스트 시작...');
    
    // 테스트 API 호출
    const response = await fetch('https://www.maslabs.kr/api/test-daily-summary');
    
    console.log('📡 응답 상태:', response.status);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 일일 요약 API 호출 성공!');
      console.log('📊 요약 데이터:');
      console.log(`📅 날짜: ${result.date}`);
      console.log(`📈 기간: ${result.period}`);
      console.log(`📋 총 업무: ${result.totalTasks}건`);
      console.log(`👥 팀원 수: ${result.employeeCount}명`);
      console.log(`📞 신규 상담: ${result.newConsultations}건`);
      
      console.log('\n🏆 순위:');
      console.log('💰 매출 1위:', result.rankings.sales[0] ? `${result.rankings.sales[0].name} - ₩${result.rankings.sales[0].totalSales.toLocaleString()}` : '데이터 없음');
      console.log('🎯 포인트 1위:', result.rankings.points[0] ? `${result.rankings.points[0].name} - ${result.rankings.points[0].totalPoints}점` : '데이터 없음');
      console.log('📋 업무 건수 1위:', result.rankings.tasks[0] ? `${result.rankings.tasks[0].name} - ${result.rankings.tasks[0].totalTasks}건` : '데이터 없음');
      
      console.log('\n🤝 협업 성과:');
      console.log('🏌️ 마스골프:', `매출 ₩${result.collaborationStats.masgolf.sales.toLocaleString()}, 포인트 ${result.collaborationStats.masgolf.points}점, 업무 ${result.collaborationStats.masgolf.tasks}건`);
      console.log('⛳ 싱싱골프:', `매출 ₩${result.collaborationStats.singsingolf.sales.toLocaleString()}, 포인트 ${result.collaborationStats.singsingolf.points}점, 업무 ${result.collaborationStats.singsingolf.tasks}건`);
      
    } else {
      console.log('❌ 일일 요약 API 호출 실패');
      console.log('오류:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

testDailySummary();
