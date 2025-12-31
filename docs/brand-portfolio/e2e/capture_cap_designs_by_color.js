/**
 * 모자 색상별 디자인 캡쳐 스크립트
 * 마플 사이트에서 각 색상(네이비, 블랙, 베이지, 화이트)별로 로고가 적용된 모자 디자인 캡쳐
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 모자 색상 정보
const capColors = [
  { name: '네이비', value: 'navy', url: 'https://www.marpple.com/kr/product/detail?bp_id=2976&pc_id=23575351' },
  { name: '블랙', value: 'black', url: 'https://www.marpple.com/kr/product/detail?bp_id=2976&pc_id=23575350' },
  { name: '베이지', value: 'beige', url: 'https://www.marpple.com/kr/product/detail?bp_id=2976&pc_id=23575349' },
  { name: '화이트', value: 'white', url: 'https://www.marpple.com/kr/product/detail?bp_id=2976&pc_id=23575340' }
];

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/designs/caps');

/**
 * Self-Adaptive: 모자 이미지 요소 찾기
 */
async function findCapImage(page) {
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
    // 더 구체적인 선택자
    '[class*="product"] [class*="image"] img',
    '[class*="preview"] img',
    '[class*="canvas"]',
    // fallback
    'img[src*="product"]',
    'img[src*="cap"]',
    'img[src*="볼캡"]'
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

  // Canvas 요소 찾기 (마플은 Canvas를 사용할 수 있음)
  const canvas = await page.$('canvas');
  if (canvas) {
    return canvas;
  }

  return null;
}

/**
 * 색상별 모자 디자인 캡쳐
 */
async function captureCapDesignByColor(page, colorInfo) {
  try {
    console.log(`📸 캡쳐 중: ${colorInfo.name} 모자 디자인`);
    
    // 페이지 이동
    await page.goto(colorInfo.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // 페이지 및 디자인 로딩 대기

    // 색상 선택 (필요한 경우)
    try {
      const colorButton = await page.$(`[data-color="${colorInfo.value}"], [data-value="${colorInfo.value}"], button:has-text("${colorInfo.name}")`);
      if (colorButton) {
        await colorButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log(`색상 버튼 클릭 스킵: ${e.message}`);
    }

    // 모자 이미지 찾기
    const imageElement = await findCapImage(page);
    
    if (!imageElement) {
      console.warn(`⚠️  이미지를 찾을 수 없습니다: ${colorInfo.name}`);
      // 전체 제품 영역 스크린샷
      const screenshotPath = path.join(outputDir, `cap-design-${colorInfo.value}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
      console.log(`✅ 스크린샷 저장: ${screenshotPath}`);
      return screenshotPath;
    }

    // Canvas인 경우
    const tagName = await imageElement.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'canvas') {
      const screenshotPath = path.join(outputDir, `cap-design-${colorInfo.value}.png`);
      await imageElement.screenshot({ path: screenshotPath });
      console.log(`✅ Canvas 캡쳐 저장: ${screenshotPath}`);
      return screenshotPath;
    }

    // 이미지 요소인 경우
    const screenshotPath = path.join(outputDir, `cap-design-${colorInfo.value}.png`);
    await imageElement.screenshot({ path: screenshotPath });
    console.log(`✅ 이미지 저장: ${screenshotPath}`);
    return screenshotPath;

  } catch (error) {
    console.error(`❌ 오류 발생 (${colorInfo.name}):`, error.message);
    // 오류 발생 시 전체 페이지 스크린샷
    try {
      const screenshotPath = path.join(outputDir, `cap-design-${colorInfo.value}-error.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
      console.log(`⚠️  오류 스크린샷 저장: ${screenshotPath}`);
    } catch (e) {
      console.error(`❌ 스크린샷 저장 실패:`, e.message);
    }
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

  // Chrome Canary 경로 (macOS)
  const canaryPath = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저를 보이게 해서 디자인 확인
    executablePath: canaryPath, // Chrome Canary 사용
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  const results = {
    success: [],
    failed: []
  };

  // 각 색상별로 캡쳐
  for (const colorInfo of capColors) {
    const result = await captureCapDesignByColor(page, colorInfo);
    if (result) {
      results.success.push({ color: colorInfo.name, path: result });
    } else {
      results.failed.push({ color: colorInfo.name });
    }
    await page.waitForTimeout(2000); // 요청 간격
  }

  await browser.close();

  // 결과 요약
  console.log('\n📊 캡쳐 결과 요약:');
  console.log(`✅ 성공: ${results.success.length}개`);
  console.log(`❌ 실패: ${results.failed.length}개`);
  
  if (results.failed.length > 0) {
    console.log('\n실패한 색상:');
    results.failed.forEach(item => {
      console.log(`  - ${item.color}`);
    });
  }

  return results;
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, captureCapDesignByColor };

