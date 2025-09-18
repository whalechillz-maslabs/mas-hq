// Node.js 내장 fetch 사용

async function testSlackAPI() {
  try {
    console.log('🔍 슬랙 API 직접 테스트 시작...');
    
    // 테스트 데이터
    const testData = {
      task: {
        id: 'test-123',
        title: '테스트 CS 응대 - Playwright',
        customer_name: '테스트고객',
        notes: 'Playwright 자동화 테스트',
        sales_amount: 100000,
        operation_type: {
          code: 'OP5',
          name: 'CS 응대 (제품안내, 시타보조)',
          points: 8
        }
      },
      employee: {
        id: 'test-employee',
        name: '테스트 사용자',
        employee_id: 'TEST001'
      },
      op10Category: 'common',
      isUpdate: false
    };
    
    console.log('📤 전송할 데이터:', JSON.stringify(testData, null, 2));
    
    // API 호출
    const response = await fetch('https://www.maslabs.kr/api/slack/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 응답 상태:', response.status);
    console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📨 응답 내용:', result);
    
    if (response.ok) {
      console.log('✅ 슬랙 API 호출 성공!');
      console.log('📨 01-ma-op 채널에 메시지가 전송되었는지 확인해주세요.');
    } else {
      console.log('❌ 슬랙 API 호출 실패');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

testSlackAPI();
