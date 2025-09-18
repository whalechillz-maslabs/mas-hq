import { test, expect } from '@playwright/test';

test.describe('수동 Slack 설정', () => {
  test('Slack API 페이지 접속 및 수동 설정', async ({ page }) => {
    // Slack API 페이지로 이동
    await page.goto('https://api.slack.com/apps');
    await page.waitForLoadState('networkidle');
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'manual-slack-api-page.png' });
    
    console.log('=== Slack 설정 가이드 ===');
    console.log('1. 브라우저에서 Slack에 로그인해주세요');
    console.log('2. "Create New App" 버튼을 클릭하세요');
    console.log('3. "From scratch"를 선택하세요');
    console.log('4. 앱 이름: "MASLABS 업무봇"');
    console.log('5. Workspace를 선택하세요');
    console.log('6. "Create App" 버튼을 클릭하세요');
    console.log('7. 왼쪽 메뉴에서 "Incoming Webhooks"를 클릭하세요');
    console.log('8. "Activate Incoming Webhooks"를 ON으로 설정하세요');
    console.log('9. "Add New Webhook to Workspace"를 클릭하세요');
    console.log('10. 채널 "#31-gg-업무전달-매장관리-환경개선"을 선택하세요');
    console.log('11. "Allow" 버튼을 클릭하세요');
    console.log('12. 생성된 Webhook URL을 복사하세요');
    console.log('========================');
    
    // 5분 대기 (수동 설정 시간)
    await page.waitForTimeout(300000);
    
    // 최종 스크린샷
    await page.screenshot({ path: 'manual-slack-final.png' });
    
    // Webhook URL이 있는지 확인
    const webhookInput = page.locator('input[readonly]');
    if (await webhookInput.isVisible()) {
      const webhookUrl = await webhookInput.inputValue();
      console.log('발견된 Webhook URL:', webhookUrl);
      
      // URL을 파일에 저장
      const fs = require('fs');
      fs.writeFileSync('discovered-webhook-url.txt', webhookUrl);
    }
  });
});
