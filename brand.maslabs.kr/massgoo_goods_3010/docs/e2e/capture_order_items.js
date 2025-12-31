/**
 * 주문번호별 제품 이미지 캡쳐 스크립트
 * 주문번호(pc_id)를 사용하여 직접 제품 페이지로 접근하여 캡쳐
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 주문 정보
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

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/orders');

/**
 * Self-Adaptive: 제품 이미지 요소 찾기
 */
async function findProductImage(page) {
  const selectors = [
    // 마플 제품 이미지 선택자들
    '.product-preview img',
    '.product-image img',
    '.preview-image img',
    '.design-preview img',
    '.canvas-container img',
    'canvas',
    '.product-display img',
    '.customization-preview img',
    '.order-item-image img',
    // 더 구체적인 선택자
    '[class*="product"] [class*="image"] img',
    '[class*="preview"] img',
    '[class*="canvas"]',
    // fallback
    'img[src*="product"]',
    'img[src*="order"]'
  ];

  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'canvas') {
          return element;
        }
        const src = await element.getAttribute('src');
        if (src && (src.includes('http') || src.includes('data:'))) {
          return element;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Canvas 요소 찾기
  const canvas = await page.$('canvas');
  if (canvas) {
    return canvas;
  }

  return null;
}

/**
 * 로그인 필요 여부 확인
 */
async function checkLoginRequired(page) {
  try {
    const currentUrl = page.url();
    
    // 로그인 페이지인지 확인
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      return true;
    }
    
    // 로그인 버튼이나 로그인 링크가 있는지 확인
    const loginIndicators = [
      'button:has-text("로그인")',
      'a:has-text("로그인")',
      'button:has-text("Login")',
      'a:has-text("Login")',
      '.login-button',
      '[class*="login"]'
    ];
    
    for (const selector of loginIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && (text.includes('로그인') || text.includes('Login'))) {
            return true;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 주문 상세 페이지에서 주문번호에 해당하는 썸네일 이미지 캡쳐
 */
async function captureOrderItem(page, itemInfo) {
  try {
    console.log(`📸 캡쳐 중: ${itemInfo.name} (주문번호: ${itemInfo.orderNo})`);
    
    // 주문 상세 페이지로 이동
    await page.goto(orderInfo.orderUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // 주문번호 텍스트를 포함하는 행 찾기
    console.log('🔍 주문번호 행 찾는 중...');
    
    // 주문번호가 포함된 테이블 행 또는 카드 찾기
    const orderNoSelectors = [
      `tr:has-text("${itemInfo.orderNo}")`,
      `[class*="order"]:has-text("${itemInfo.orderNo}")`,
      `[class*="item"]:has-text("${itemInfo.orderNo}")`,
      `div:has-text("${itemInfo.orderNo}")`
    ];
    
    let orderRow = null;
    for (const selector of orderNoSelectors) {
      try {
        orderRow = await page.$(selector);
        if (orderRow) {
          console.log(`주문번호 행 찾음: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!orderRow) {
      console.log(`⚠️  주문번호 행을 찾을 수 없습니다.`);
      console.log(`💡 주문 상세 페이지에서 주문번호 "${itemInfo.orderNo}"가 보이는지 확인해주세요.`);
      return null;
    }
    
    // 해당 행 내에서 이미지 찾기
    const imageSelectors = [
      'img',
      '.product-image img',
      '.thumbnail img',
      '[class*="image"] img',
      'canvas'
    ];
    
    let imageElement = null;
    for (const selector of imageSelectors) {
      try {
        imageElement = await orderRow.$(selector);
        if (imageElement) {
          const src = await imageElement.getAttribute('src');
          if (src && (src.includes('http') || src.includes('data:') || src.includes('blob:'))) {
            console.log(`이미지 찾음: ${selector}`);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!imageElement) {
      // 이미지가 없으면 해당 행 전체를 캡쳐
      console.log('⚠️  이미지를 찾을 수 없습니다. 행 전체를 캡쳐합니다.');
      const screenshotPath = path.join(outputDir, `order-${itemInfo.orderNo}.png`);
      await orderRow.screenshot({ path: screenshotPath });
      console.log(`✅ 행 캡쳐 저장: ${screenshotPath}`);
      return screenshotPath;
    }
    
    // 이미지 캡쳐
    const tagName = await imageElement.evaluate(el => el.tagName.toLowerCase());
    const screenshotPath = path.join(outputDir, `order-${itemInfo.orderNo}.png`);
    
    if (tagName === 'canvas') {
      await imageElement.screenshot({ path: screenshotPath });
      console.log(`✅ Canvas 캡쳐 저장: ${screenshotPath}`);
    } else {
      await imageElement.screenshot({ path: screenshotPath });
      console.log(`✅ 이미지 저장: ${screenshotPath}`);
    }
    
    return screenshotPath;

  } catch (error) {
    console.error(`❌ 오류 발생 (${itemInfo.name}):`, error.message);
    return null;
  }
}


/**
 * 메인 실행 함수
 */
async function main() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Chrome Beta 경로 (macOS)
  const chromeBetaPath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
  
  // 프로필 디렉토리 사용 (매번 새로 생성하여 충돌 방지)
  const os = require('os');
  const userDataDir = path.join(os.tmpdir(), 'playwright-chrome-beta-' + Date.now());
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  console.log('✅ 브라우저 프로필 생성 (로그인 필요)');
  
  // launchPersistentContext를 사용하여 프로필 사용
  // 기존 브라우저가 실행 중이면 실패할 수 있으므로 try-catch로 처리
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // 브라우저를 보이게 해서 확인
      executablePath: chromeBetaPath, // Chrome Beta 사용
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled', // 스텔스 모드
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-automation', // 자동화 배너 제거
        '--disable-infobars', // 정보 바 제거
        '--exclude-switches=enable-automation', // 자동화 스위치 제외
        '--disable-default-apps'
      ],
      // 자동화 확장 프로그램 비활성화
      ignoreDefaultArgs: ['--enable-automation'],
      useAutomationExtension: false
    });
  } catch (error) {
    if (error.message.includes('ProcessSingleton') || error.message.includes('profile')) {
      console.log('⚠️  브라우저가 이미 실행 중입니다.');
      console.log('💡 기존 브라우저를 닫고 다시 실행하거나,');
      console.log('   브라우저에서 주문 상세 페이지를 열어두고 스크립트를 실행해주세요.');
      console.log('\n기존 브라우저를 사용하려면:');
      console.log('1. 브라우저에서 주문 상세 페이지 열기: https://www.marpple.com/kr/order/detail/3218372');
      console.log('2. 스크립트를 다시 실행하세요.');
      process.exit(1);
    }
    throw error;
  }

  const page = context.pages()[0] || await context.newPage();
  
  // 웹드라이버 감지 방지 스크립트 추가 (강화)
  await page.addInitScript(() => {
    // webdriver 속성 완전 제거
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
    
    // Chrome 객체 추가
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
    
    // Permissions API 모킹
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Plugins 추가
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    
    // Languages 추가
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ko-KR', 'ko', 'en-US', 'en']
    });
    
    // 자동화 관련 속성 제거
    delete navigator.__proto__.webdriver;
    
    // AutomationControlled 제거
    Object.defineProperty(navigator, 'webdriver', {
      configurable: true,
      get: () => false
    });
  });
  
  // 자동화 배너 제거를 위한 추가 스크립트 (이미 addInitScript로 추가됨)
  
  console.log('✅ 브라우저 실행 완료.');
  console.log('🌐 주문 상세 페이지로 이동 중...');
  
  // 주문 상세 페이지로 직접 이동
  try {
    await page.goto(orderInfo.orderUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      console.log('\n⚠️  로그인이 필요합니다.');
      console.log('브라우저 창에서 로그인해주세요.');
      console.log('로그인 완료 후 Enter 키를 눌러주세요...');
      
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
      
      // 다시 주문 상세 페이지로 이동
      await page.goto(orderInfo.orderUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
    }
    
    console.log('✅ 주문 상세 페이지 확인됨!');
  } catch (error) {
    console.error('❌ 페이지 로드 오류:', error.message);
    console.log('브라우저 창에서 수동으로 주문 상세 페이지를 열어주세요.');
    await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('주문 상세 페이지가 열렸으면 Enter 키를 눌러주세요: ', () => {
        rl.close();
        resolve();
      });
    });
  }
  
  console.log('\n✅ 캡쳐 시작...\n');

  const results = {
    success: [],
    failed: []
  };

  // 각 주문번호별로 캡쳐
  for (const itemInfo of orderInfo.items) {
    const result = await captureOrderItem(page, itemInfo);
    if (result) {
      results.success.push({ item: itemInfo.name, orderNo: itemInfo.orderNo, path: result });
    } else {
      results.failed.push({ item: itemInfo.name, orderNo: itemInfo.orderNo });
    }
    await page.waitForTimeout(2000); // 요청 간격
  }

    // 브라우저를 닫지 않고 유지 (재사용을 위해)
    console.log('\n✅ 캡쳐 완료! 브라우저는 열려있습니다.');
    // await context.close(); // 주석 처리하여 브라우저 유지

  // 결과 요약
  console.log('\n📊 캡쳐 결과 요약:');
  console.log(`✅ 성공: ${results.success.length}개`);
  console.log(`❌ 실패: ${results.failed.length}개`);
  
  if (results.failed.length > 0) {
    console.log('\n실패한 제품:');
    results.failed.forEach(item => {
      console.log(`  - ${item.item} (${item.orderNo})`);
    });
  }

  return results;
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, captureOrderItem };

