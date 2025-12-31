const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * 단일 이미지 처리 스크립트
 * 사용법: node docs/e2e/process_single_image.js <이미지경로>
 */

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

async function main() {
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.error('❌ 사용법: node process_single_image.js <이미지경로>');
    console.error('예: node process_single_image.js images/designs/marpple-design/b-piano.png');
    process.exit(1);
  }

  const fullPath = path.isAbsolute(imagePath) 
    ? imagePath 
    : path.join(__dirname, '../../', imagePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${fullPath}`);
    process.exit(1);
  }

  await ensureDir(OUTPUT_DIR);

  try {
    const result = await processImage(fullPath);
    console.log(`\n✅ 처리 완료!`);
    console.log(`📁 출력 폴더: ${OUTPUT_DIR}`);
    console.log(`📋 생성된 파일:`);
    console.log(`  - 크롭: ${path.basename(result.cropped)}`);
    console.log(`  - 투명 배경 PNG: ${path.basename(result.final)}`);
    console.log(`  - 투명 배경 WEBP: ${path.basename(result.webp)}`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}




