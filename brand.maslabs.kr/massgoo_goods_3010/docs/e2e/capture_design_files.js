/**
 * 디자인 파일 캡쳐 스크립트
 * 로고 및 디자인 파일을 이미지로 변환
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 디자인 파일 경로
const logoDir = path.join(__dirname, '../../logo');
const designOutputDir = path.join(__dirname, '../../images/designs');

// 디자인 파일 목록
const designFiles = {
  cap: [
    { name: '폰트로고 가로 150mm_모자.svg', type: 'svg' },
    { name: '폰트로고 가로 150mm_모자_원본.svg', type: 'svg' },
    { name: '폰트로고 가로 150mm_모자.ai', type: 'ai' }
  ],
  pouch: [
    { name: 'Massgoo타올.svg', type: 'svg' },
    { name: 'Rectangle 48.svg', type: 'svg' },
    { name: 'Rectangle 51.svg', type: 'svg' }
  ],
  tee: [
    { name: '폰트로고 가로 150mm_모자.svg', type: 'svg' },
    { name: 'Massgoo타올.svg', type: 'svg' }
  ]
};

/**
 * SVG 파일을 이미지로 변환
 */
async function convertSvgToImage(svgPath, outputPath, width = 1200, height = 800) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  try {
    // SVG 파일 읽기
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    
    // HTML 페이지 생성
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            svg {
              max-width: 100%;
              max-height: 100%;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;

    await page.setContent(html);
    await page.waitForTimeout(1000);
    
    // SVG 요소 찾기 및 스크린샷
    const svgElement = await page.$('svg');
    if (svgElement) {
      await svgElement.screenshot({ path: outputPath });
      console.log(`✅ SVG 변환 완료: ${path.basename(outputPath)}`);
    } else {
      // SVG가 없으면 전체 페이지 스크린샷
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`✅ 페이지 스크린샷 저장: ${path.basename(outputPath)}`);
    }

  } catch (error) {
    console.error(`❌ SVG 변환 실패 (${path.basename(svgPath)}):`, error.message);
  } finally {
    await browser.close();
  }
}

/**
 * PNG 파일 복사
 */
async function copyPngFile(pngPath, outputPath) {
  try {
    fs.copyFileSync(pngPath, outputPath);
    console.log(`✅ PNG 복사 완료: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ PNG 복사 실패:`, error.message);
  }
}

/**
 * 디자인 파일 처리
 */
async function processDesignFiles() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(designOutputDir)) {
    fs.mkdirSync(designOutputDir, { recursive: true });
  }

  const results = {
    success: [],
    failed: []
  };

  // 모자 디자인
  console.log('\n🎩 모자 디자인 파일 처리...');
  for (const file of designFiles.cap) {
    const filePath = path.join(logoDir, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  파일 없음: ${file.name}`);
      continue;
    }

    const outputName = `cap-design-${file.name.replace(/\.[^.]+$/, '.png')}`;
    const outputPath = path.join(designOutputDir, outputName);

    try {
      if (file.type === 'svg') {
        await convertSvgToImage(filePath, outputPath, 1200, 600);
        results.success.push({ type: 'cap', file: file.name, output: outputName });
      } else if (file.type === 'png') {
        await copyPngFile(filePath, outputPath);
        results.success.push({ type: 'cap', file: file.name, output: outputName });
      } else {
        console.warn(`⚠️  지원하지 않는 파일 형식: ${file.type}`);
      }
    } catch (error) {
      results.failed.push({ type: 'cap', file: file.name, error: error.message });
    }
  }

  // 파우치 디자인
  console.log('\n👜 파우치 디자인 파일 처리...');
  for (const file of designFiles.pouch) {
    const filePath = path.join(logoDir, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  파일 없음: ${file.name}`);
      continue;
    }

    const outputName = `pouch-design-${file.name.replace(/\.[^.]+$/, '.png')}`;
    const outputPath = path.join(designOutputDir, outputName);

    try {
      if (file.type === 'svg') {
        await convertSvgToImage(filePath, outputPath, 1200, 800);
        results.success.push({ type: 'pouch', file: file.name, output: outputName });
      } else if (file.type === 'png') {
        await copyPngFile(filePath, outputPath);
        results.success.push({ type: 'pouch', file: file.name, output: outputName });
      }
    } catch (error) {
      results.failed.push({ type: 'pouch', file: file.name, error: error.message });
    }
  }

  // 티셔츠 디자인
  console.log('\n👕 티셔츠 디자인 파일 처리...');
  for (const file of designFiles.tee) {
    const filePath = path.join(logoDir, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  파일 없음: ${file.name}`);
      continue;
    }

    const outputName = `tee-design-${file.name.replace(/\.[^.]+$/, '.png')}`;
    const outputPath = path.join(designOutputDir, outputName);

    try {
      if (file.type === 'svg') {
        await convertSvgToImage(filePath, outputPath, 1200, 800);
        results.success.push({ type: 'tee', file: file.name, output: outputName });
      } else if (file.type === 'png') {
        await copyPngFile(filePath, outputPath);
        results.success.push({ type: 'tee', file: file.name, output: outputName });
      }
    } catch (error) {
      results.failed.push({ type: 'tee', file: file.name, error: error.message });
    }
  }

  // 결과 요약
  console.log('\n📊 디자인 파일 처리 결과:');
  console.log(`✅ 성공: ${results.success.length}개`);
  console.log(`❌ 실패: ${results.failed.length}개`);

  return results;
}

// 실행
if (require.main === module) {
  processDesignFiles().catch(console.error);
}

module.exports = { processDesignFiles, convertSvgToImage };






