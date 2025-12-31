/**
 * 캡쳐된 이미지 크롭 스크립트
 * 파우치 2종, 모자 4종, 티셔츠 1종을 크롭하여 디자인 섹션에 사용
 */

const fs = require('fs');
const path = require('path');

// 이미지 크롭을 위한 sharp 라이브러리 사용
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  sharp 라이브러리가 설치되어 있지 않습니다.');
  console.log('설치 중...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

const ordersDir = path.join(__dirname, '../../images/orders');
const outputDir = path.join(__dirname, '../../images/designs');

// 제품별 이미지 매핑 (시간순으로 정렬된 스크린샷)
// 사용자가 캡쳐한 순서에 따라 매핑 필요
const productMapping = {
  // 모자 4종 (시간순으로 추정)
  caps: [
    { input: '스크린샷 2025-11-25 오전 9.50.34.png', output: 'cap-order-navy.png', name: '네이비 모자' },
    { input: '스크린샷 2025-11-25 오전 9.50.41.png', output: 'cap-order-black.png', name: '블랙 모자' },
    { input: '스크린샷 2025-11-25 오전 9.50.49.png', output: 'cap-order-beige.png', name: '베이지 모자' },
    { input: '스크린샷 2025-11-25 오전 9.50.58.png', output: 'cap-order-white.png', name: '화이트 모자' }
  ],
  // 파우치 2종 (앞면/뒷면)
  pouches: [
    { input: '스크린샷 2025-11-25 오전 9.49.34.png', output: 'pouch-order-1-front.png', name: '파우치 1 앞면', crop: { x: 0, y: 0, width: 0.5, height: 1.0 } },
    { input: '스크린샷 2025-11-25 오전 9.49.34.png', output: 'pouch-order-1-back.png', name: '파우치 1 뒷면', crop: { x: 0.5, y: 0, width: 0.5, height: 1.0 } },
    { input: '스크린샷 2025-11-25 오전 9.49.48.png', output: 'pouch-order-2-front.png', name: '파우치 2 앞면', crop: { x: 0, y: 0, width: 0.5, height: 1.0 } },
    { input: '스크린샷 2025-11-25 오전 9.49.48.png', output: 'pouch-order-2-back.png', name: '파우치 2 뒷면', crop: { x: 0.5, y: 0, width: 0.5, height: 1.0 } }
  ],
  // 티셔츠 1종
  tees: [
    { input: '스크린샷 2025-11-25 오전 9.51.08.png', output: 'tee-order-1.png', name: '티셔츠' }
  ]
};

/**
 * 이미지 크롭 (제품 영역만 추출)
 */
async function cropImage(inputPath, outputPath, cropArea = null) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`이미지 크기: ${metadata.width}x${metadata.height}`);
    
    // cropArea가 비율로 주어진 경우 (0.0 ~ 1.0)
    if (cropArea && cropArea.width <= 1.0) {
      const left = Math.floor(metadata.width * cropArea.x);
      const top = Math.floor(metadata.height * cropArea.y);
      const width = Math.floor(metadata.width * cropArea.width);
      const height = Math.floor(metadata.height * cropArea.height);
      
      await image
        .extract({
          left: left,
          top: top,
          width: width,
          height: height
        })
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .toFile(outputPath);
    } else if (cropArea) {
      // cropArea가 픽셀 값으로 주어진 경우
      await image
        .extract({
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height
        })
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .toFile(outputPath);
    } else {
      // 전체 이미지를 리사이즈만
      await image
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .toFile(outputPath);
    }
    
    console.log(`✅ 크롭 완료: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    console.error(`❌ 크롭 실패 (${inputPath}):`, error.message);
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
  
  const results = {
    success: [],
    failed: []
  };
  
  // 모자 이미지 크롭
  console.log('\n🎩 모자 이미지 크롭 중...');
  for (const item of productMapping.caps) {
    const inputPath = path.join(ordersDir, item.input);
    const outputPath = path.join(outputDir, item.output);
    
    if (fs.existsSync(inputPath)) {
      const result = await cropImage(inputPath, outputPath);
      if (result) {
        results.success.push({ type: 'cap', name: item.name, path: result });
      } else {
        results.failed.push({ type: 'cap', name: item.name });
      }
    } else {
      console.warn(`⚠️  파일 없음: ${item.input}`);
      results.failed.push({ type: 'cap', name: item.name });
    }
  }
  
  // 파우치 이미지 크롭
  console.log('\n👜 파우치 이미지 크롭 중...');
  for (const item of productMapping.pouches) {
    const inputPath = path.join(ordersDir, item.input);
    const outputPath = path.join(outputDir, item.output);
    
    if (fs.existsSync(inputPath)) {
      const result = await cropImage(inputPath, outputPath, item.crop || null);
      if (result) {
        results.success.push({ type: 'pouch', name: item.name, path: result });
      } else {
        results.failed.push({ type: 'pouch', name: item.name });
      }
    } else {
      console.warn(`⚠️  파일 없음: ${item.input}`);
      results.failed.push({ type: 'pouch', name: item.name });
    }
  }
  
  // 티셔츠 이미지 크롭
  console.log('\n👕 티셔츠 이미지 크롭 중...');
  for (const item of productMapping.tees) {
    const inputPath = path.join(ordersDir, item.input);
    const outputPath = path.join(outputDir, item.output);
    
    if (fs.existsSync(inputPath)) {
      const result = await cropImage(inputPath, outputPath);
      if (result) {
        results.success.push({ type: 'tee', name: item.name, path: result });
      } else {
        results.failed.push({ type: 'tee', name: item.name });
      }
    } else {
      console.warn(`⚠️  파일 없음: ${item.input}`);
      results.failed.push({ type: 'tee', name: item.name });
    }
  }
  
  // 결과 요약
  console.log('\n📊 크롭 결과 요약:');
  console.log(`✅ 성공: ${results.success.length}개`);
  console.log(`❌ 실패: ${results.failed.length}개`);
  
  if (results.failed.length > 0) {
    console.log('\n실패한 항목:');
    results.failed.forEach(item => {
      console.log(`  - ${item.type}/${item.name}`);
    });
  }
  
  return results;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, cropImage };

