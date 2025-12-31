/**
 * 데일리오버 버킷햇 (2965) - 컬러별 메인 이미지 캡처 스크립트
 * mp_maker 영역을 직접 캡처 후 WEBP로 저장
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(__dirname, '../../images/caps');

const hats = [
  {
    name: 'bucket-2965-black',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=2965&pc_id=23579930',
    note: '블랙 컬러, MASSGOO × MUZIIK 디자인'
  },
  {
    name: 'bucket-2965-white',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=2965&pc_id=23579922',
    note: '화이트 컬러, MASSGOO × MUZIIK 디자인'
  }
];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureHat(page, hat) {
  console.log(`\n📸 ${hat.name} 캡처 시작`);
  await page.goto(hat.url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  const makerLocator = page.locator('.mp_maker');
  await makerLocator.waitFor({ timeout: 20000 });

  const pngPath = path.join(OUTPUT_DIR, `${hat.name}.png`);
  const webpPath = path.join(OUTPUT_DIR, `${hat.name}.webp`);

  await makerLocator.screenshot({ path: pngPath });
  console.log(`   ✅ PNG 저장: ${pngPath}`);

  await sharp(pngPath).webp({ quality: 90 }).toFile(webpPath);
  console.log(`   ✅ WEBP 변환 완료: ${webpPath}`);

  // PNG는 용량 절감을 위해 삭제
  fs.unlinkSync(pngPath);
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    for (const hat of hats) {
      await captureHat(page, hat);
    }
  } catch (error) {
    console.error('❌ 버킷햇 캡처 실패:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n🎉 데일리오버 버킷햇 메인 이미지 캡처 완료');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}






