import { NextRequest, NextResponse } from 'next/server';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_CHANNEL_ID = 'C04DEABHEM8'; // 지정된 채널 ID

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, employee } = body;

    if (!SLACK_WEBHOOK_URL) {
      console.error('SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
      return NextResponse.json({ error: 'Slack 설정이 필요합니다.' }, { status: 500 });
    }

    // Slack 메시지 포맷 (간단한 텍스트 메시지로 테스트)
    const message = {
      text: `📋 새로운 OP10 업무 등록
      
**업무 유형:** ${task.operation_type?.code} - ${task.operation_type?.name}
**작성자:** ${employee.name} (${employee.employee_id})
**업무명:** ${task.title || '-'}
**업무 내용:** ${task.notes ? (task.notes.length > 200 ? task.notes.substring(0, 200) + '...' : task.notes) : '-'}
**고객명:** ${task.customer_name || '-'}
**포인트:** ${task.operation_type?.points || 0}점

MASLABS 업무 관리 시스템`
    };

    // Slack으로 메시지 전송
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return NextResponse.json({ success: true, message: 'Slack 알림이 전송되었습니다.' });

  } catch (error) {
    console.error('Slack 알림 전송 실패:', error);
    return NextResponse.json(
      { error: 'Slack 알림 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
