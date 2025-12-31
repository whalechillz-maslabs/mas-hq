const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * 캐릭터 이미지 처리 스크립트
 * 1. 캐릭터 부분만 자르기 (자동 크롭)
 * 2. 투명 배경으로 변경
 * 3. PNG 투명 배경 및 SVG 변환 시도
 */

const INPUT_DIR = path.join(__dirname, '../../images/designs/marpple-design/final');
const OUTPUT_DIR = path.join(__dirname, '../../images/designs/marpple-design/processed');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 이미지에서 투명/흰색 배경을 감지하여 캐릭터 영역만 자동으로 크롭
 */
async function autoCropCharacter(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  // 이미지를 RGBA로 변환하여 픽셀 데이터 가져오기
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // 투명도 또는 흰색 배경 감지하여 실제 콘텐츠 영역 찾기
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = channels === 4 ? data[idx + 3] : 255;

      // 투명 픽셀이 아니고, 흰색이 아닌 픽셀 찾기 (캐릭터 부분)
      const isWhite = r > 240 && g > 240 && b > 240;
      const isTransparent = a < 10;
      
      if (!isTransparent && !isWhite) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // 여유 공간 추가 (10px)
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  console.log(`  📐 크롭 영역: x=${minX}, y=${minY}, width=${cropWidth}, height=${cropHeight}`);

  return {
    left: minX,
    top: minY,
    width: cropWidth,
    height: cropHeight,
  };
}

/**
 * 배경을 투명하게 만들기 (흰색/밝은 색을 투명으로)
 */
async function removeBackground(imagePath, outputPath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // 이미지를 RGBA로 변환
  let buffer = await image
    .ensureAlpha()
    .raw()
    .toBuffer();

  const width = metadata.width;
  const height = metadata.height;
  const channels = 4; // RGBA

  // 흰색/밝은 배경을 투명하게 변경
  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    const a = buffer[i + 3];

    // 흰색에 가까운 픽셀을 투명하게 (임계값 조정 가능)
    const brightness = (r + g + b) / 3;
    const isWhite = r > 240 && g > 240 && b > 240;
    
    if (isWhite || brightness > 245) {
      buffer[i + 3] = 0; // 알파를 0으로 (완전 투명)
    }
  }

  // 처리된 이미지 저장
  await sharp(buffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);

  console.log(`  ✅ 투명 배경 처리 완료: ${path.basename(outputPath)}`);
}

/**
 * 이미지 처리 메인 함수
 */
async function processImage(inputPath) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  console.log(`\n🖼️  처리 중: ${filename}`);

  try {
    // 1. 자동 크롭
    console.log('  1️⃣ 자동 크롭 중...');
    const cropArea = await autoCropCharacter(inputPath);
    
    const croppedPath = path.join(OUTPUT_DIR, `${filename}-cropped.png`);
    await sharp(inputPath)
      .extract(cropArea)
      .png()
      .toFile(croppedPath);
    console.log(`  ✅ 크롭 완료: ${path.basename(croppedPath)}`);

    // 2. 투명 배경 처리
    console.log('  2️⃣ 투명 배경 처리 중...');
    const transparentPath = path.join(OUTPUT_DIR, `${filename}-transparent.png`);
    await removeBackground(croppedPath, transparentPath);

    // 3. WEBP 변환 (투명 배경 지원)
    console.log('  3️⃣ WEBP 변환 중...');
    const webpPath = path.join(OUTPUT_DIR, `${filename}.webp`);
    await sharp(transparentPath)
      .webp({ quality: 90, lossless: true })
      .toFile(webpPath);
    console.log(`  ✅ WEBP 변환 완료: ${path.basename(webpPath)}`);

    // 4. 최종 PNG (투명 배경)
    const finalPngPath = path.join(OUTPUT_DIR, `${filename}.png`);
    await sharp(transparentPath)
      .png()
      .toFile(finalPngPath);
    console.log(`  ✅ 최종 PNG 저장: ${path.basename(finalPngPath)}`);

    return {
      original: inputPath,
      cropped: croppedPath,
      transparent: transparentPath,
      webp: webpPath,
      final: finalPngPath,
    };
  } catch (error) {
    console.error(`  ❌ 처리 실패: ${error.message}`);
    throw error;
  }
}

/**
 * SVG 변환 (Potrace 사용 - 설치 필요)
 * 참고: potrace는 별도 설치가 필요하므로, 일단 PNG 투명 배경으로 제공
 */
async function convertToSVG(imagePath, outputPath) {
  // Potrace를 사용하려면 potrace 바이너리가 필요
  // 일단 PNG 투명 배경으로 제공하고, 필요시 수동으로 SVG 변환 도구 사용
  console.log(`  ℹ️ SVG 변환은 별도 도구가 필요합니다. PNG 투명 배경 파일을 사용하세요.`);
  console.log(`  💡 추천: 온라인 도구 (remove.bg, vectorizer.io) 또는 Illustrator의 Image Trace 사용`);
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .map(file => path.join(INPUT_DIR, file));

  if (files.length === 0) {
    console.log('❌ 처리할 PNG 파일을 찾지 못했습니다.');
    return;
  }

  console.log(`📦 총 ${files.length}개 파일 처리 시작\n`);

  const results = [];
  for (const file of files) {
    try {
      const result = await processImage(file);
      results.push(result);
    } catch (error) {
      console.error(`❌ ${path.basename(file)} 처리 실패:`, error.message);
    }
  }

  console.log(`\n✅ 처리 완료: ${results.length}개 파일`);
  console.log(`📁 출력 폴더: ${OUTPUT_DIR}`);
  console.log(`\n📋 생성된 파일:`);
  results.forEach((result, i) => {
    const name = path.basename(result.original, '.png');
    console.log(`  ${i + 1}. ${name}:`);
    console.log(`     - 크롭: ${path.basename(result.cropped)}`);
    console.log(`     - 투명 배경 PNG: ${path.basename(result.final)}`);
    console.log(`     - 투명 배경 WEBP: ${path.basename(result.webp)}`);
  });

  console.log(`\n💡 SVG 변환 팁:`);
  console.log(`   - Adobe Illustrator: Image Trace 기능 사용`);
  console.log(`   - 온라인 도구: vectorizer.io, autotracer.org`);
  console.log(`   - Potrace: 명령줄 도구 (별도 설치 필요)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}




