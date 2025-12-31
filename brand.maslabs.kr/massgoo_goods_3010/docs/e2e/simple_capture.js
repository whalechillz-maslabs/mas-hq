/**
 * 간단한 캡쳐 스크립트
 * 주문 상세 페이지의 썸네일 이미지만 캡쳐
 * 자동화 감지를 최소화
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const orderInfo = {
  orderNumber: '3218372',
  orderUrl: 'https://www.marpple.com/kr/order/detail/3218372',
  items: [
    { orderNo: '19571501', name: '가죽 클러치백 (파우치 1)', type: 'pouch' },
    { orderNo: '19571413', name: '가죽 클러치백 (파우치 2)', type: 'pouch' },
    { orderNo: '19570752', name: '베이직 볼캡 (네이비)', type: 'cap', color: 'navy' },
    { orderNo: '19570751', name: '베이직 볼캡 (블랙)', type: 'cap', color: 'black' },
    { orderNo: '19570747', name: '베이직 볼캡 (베이지)', type: 'cap', color: 'beige' },
    { orderNo: '19570743', name: '베이직 볼캡 (화이트)', type: 'cap', color: 'white' }
  ]
};

const outputDir = path.join(__dirname, '../../images/orders');

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const chromeBetaPath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
  const os = require('os');
  const userDataDir = path.join(os.tmpdir(), 'playwright-chrome-beta-' + Date.now());
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  console.log('✅ 브라우저 실행 중...');
  console.log('📋 다음 단계:');
  console.log('   1. 브라우저 창에서 로그인해주세요');
  console.log('   2. 주문 상세 페이지가 열리면 Enter 키를 눌러주세요');
  console.log('   3. 각 주문번호 행의 이미지를 수동으로 확인해주세요');
  
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: chromeBetaPath,
    viewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = context.pages()[0] || await context.newPage();
  
  await page.goto(orderInfo.orderUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  
  // 사용자 입력 대기
  await new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('\n로그인 완료 후 Enter 키를 눌러주세요: ', () => {
      rl.close();
      resolve();
    });
  });
  
  // 주문 상세 페이지 전체 캡쳐
  console.log('\n📸 주문 상세 페이지 캡쳐 중...');
  const screenshotPath = path.join(outputDir, 'order-detail-full.png');
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true
  });
  console.log(`✅ 전체 페이지 캡쳐 저장: ${screenshotPath}`);
  
  console.log('\n💡 각 주문번호의 제품 이미지는 수동으로 캡쳐해주세요:');
  orderInfo.items.forEach(item => {
    console.log(`   - ${item.name} (${item.orderNo})`);
  });
  
  console.log('\n✅ 브라우저는 열려있습니다. 수동으로 캡쳐해주세요.');
  // 브라우저를 닫지 않고 유지
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };






