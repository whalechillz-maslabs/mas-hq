/**
 * 로고 AI 파일을 PNG로 변환
 * massgoo_text-logo_black.ai, muziik_italic_logo.ai → PNG
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const logoDir = path.join(__dirname, '../../logo');
const outputDir = path.join(__dirname, '../../images/designs/logos');

// 변환할 로고 파일 목록
const logoFiles = [
  { input: 'massgoo_text-logo_black.ai', output: 'massgoo-text-logo-black.png', name: 'MASSGOO 텍스트 로고 (블랙)' },
  { input: 'muziik_italic_logo.ai', output: 'muziik-italic-logo.png', name: 'MUZIIK 이탤릭 로고' }
];

/**
 * AI 파일을 PNG로 변환 (Illustrator가 설치되어 있다고 가정)
 * 실제로는 AI 파일을 직접 읽을 수 없으므로, 사용자가 수동으로 PNG로 변환하거나
 * 다른 도구를 사용해야 할 수 있습니다.
 */
async function convertAiToPng(inputPath, outputPath) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  try {
    // AI 파일은 직접 읽을 수 없으므로, 파일이 존재하는지 확인만
    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️  파일 없음: ${path.basename(inputPath)}`);
      return false;
    }

    // AI 파일을 PNG로 변환하려면 Illustrator나 다른 도구가 필요
    // 여기서는 파일 존재 확인만 하고, 실제 변환은 사용자가 수동으로 해야 함
    console.log(`📄 AI 파일 확인: ${path.basename(inputPath)}`);
    console.log(`💡 AI 파일을 PNG로 변환하려면 Illustrator나 온라인 변환 도구를 사용하세요.`);
    console.log(`💡 또는 이미 PNG 파일이 있다면 images/designs/logos/ 폴더에 직접 복사하세요.`);
    
    return false;
  } catch (error) {
    console.error(`❌ 변환 실패 (${path.basename(inputPath)}):`, error.message);
    return false;
  } finally {
    await browser.close();
  }
}

/**
 * 로고 파일 처리
 */
async function processLogos() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 디렉토리 생성: ${outputDir}`);
  }

  console.log('\n🎨 로고 파일 PNG 변환 시작...\n');

  for (const logo of logoFiles) {
    const inputPath = path.join(logoDir, logo.input);
    const outputPath = path.join(outputDir, logo.output);

    console.log(`\n📝 처리 중: ${logo.name}`);
    console.log(`   입력: ${logo.input}`);
    console.log(`   출력: ${logo.output}`);

    // 이미 PNG 파일이 있는지 확인
    if (fs.existsSync(outputPath)) {
      console.log(`✅ 이미 존재: ${logo.output}`);
      continue;
    }

    // AI 파일 확인
    if (fs.existsSync(inputPath)) {
      await convertAiToPng(inputPath, outputPath);
    } else {
      console.warn(`⚠️  파일 없음: ${logo.input}`);
    }
  }

  console.log('\n📊 변환 결과:');
  console.log(`✅ 완료된 파일:`);
  for (const logo of logoFiles) {
    const outputPath = path.join(outputDir, logo.output);
    if (fs.existsSync(outputPath)) {
      console.log(`   - ${logo.output}`);
    }
  }
}

// 실행
if (require.main === module) {
  processLogos().catch(console.error);
}

module.exports = { processLogos };






