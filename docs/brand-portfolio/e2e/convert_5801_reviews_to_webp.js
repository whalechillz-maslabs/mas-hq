/**
 * caps-5801-beige-review PNG 파일들을 WEBP로 변환
 * 6개 중 5개만 변환 (1-5)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const capsDir = path.join(__dirname, '../../images/caps');

async function convertToWebp() {
  console.log('🔄 caps-5801-beige-review PNG → WEBP 변환 시작...\n');

  // 1-5번만 변환
  for (let i = 1; i <= 5; i++) {
    const pngPath = path.join(capsDir, `caps-5801-beige-review-${i}.png`);
    const webpPath = path.join(capsDir, `caps-5801-beige-review-${i}.webp`);

    try {
      if (fs.existsSync(pngPath)) {
        await sharp(pngPath)
          .webp({ quality: 85 })
          .toFile(webpPath);
        console.log(`✅ ${i}번 변환 완료: caps-5801-beige-review-${i}.webp`);
      } else {
        console.log(`⚠️  파일 없음: caps-5801-beige-review-${i}.png`);
      }
    } catch (error) {
      console.error(`❌ ${i}번 변환 실패:`, error.message);
    }
  }

  // 6번 파일 삭제 (사용하지 않음)
  const png6Path = path.join(capsDir, 'caps-5801-beige-review-6.png');
  if (fs.existsSync(png6Path)) {
    try {
      fs.unlinkSync(png6Path);
      console.log(`\n🗑️  caps-5801-beige-review-6.png 삭제 완료`);
    } catch (error) {
      console.error(`❌ 6번 파일 삭제 실패:`, error.message);
    }
  }

  console.log('\n--- 변환 완료 ---');
}

if (require.main === module) {
  convertToWebp().catch(console.error);
}

module.exports = { convertToWebp };






