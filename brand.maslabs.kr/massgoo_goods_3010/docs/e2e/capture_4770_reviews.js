/**
 * 코튼플레이 더블헤비코튼 티셔츠 4770 리뷰 이미지 캡처 스크립트
 * 리뷰 이미지 최대 20개 가져오기
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 코튼플레이 더블헤비코튼 티셔츠 제품 정보
const doubleHeavyCottonTee = {
  id: '4770',
  name: 'double-heavy-cotton-tee',
  productUrl: 'https://www.marpple.com/kr/product/detail?bp_id=4770',
  reviewUrl: 'https://www.marpple.com/kr/product/detail?bp_id=4770#review',
  reviewFilenames: []
};

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/tees');

/**
 * 이미지 다운로드
 */
async function downloadImage(imageUrl, outputPath) {
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');
  
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(imageUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      client.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        
        fileStream.on('error', reject);
      }).on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * PNG를 WEBP로 변환
 */
async function convertToWebp(pngPath, webpPath) {
  try {
    await sharp(pngPath)
      .webp({ quality: 85 })
      .toFile(webpPath);
    return true;
  } catch (error) {
    console.error(`변환 실패: ${error.message}`);
    return false;
  }
}

/**
 * 리뷰 이미지 찾기 (최대 20개)
 */
async function findReviewImages(page) {
  const reviewSelectors = [
    '.ReviewImage img',
    '.review-image img',
    '.review_image img',
    '.omp-cell__review-image img',
    '[data-rune="ReviewImage"] img',
    '.review img[src*="http"]',
    '.omp-cell__review img[src*="http"]',
    '.product-review img[src*="http"]',
    '.best-review img[src*="http"]',
    '.review-list img[src*="http"]',
    'img[src*="review"]',
    'img[src*="marpple"][src*="image"]'
  ];

  const reviewImages = [];
  const seenUrls = new Set();

  for (const selector of reviewSelectors) {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        let src = await element.getAttribute('src') || await element.getAttribute('data-src');
        if (src && 
            (src.includes('http') || src.startsWith('//')) && 
            !src.includes('avatar') && 
            !src.includes('profile') &&
            !src.includes('placeholder')) {
          
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = 'https://www.marpple.com' + src;
          
          // 중복 제거
          const baseUrl = src.split('?')[0];
          if (seenUrls.has(baseUrl)) continue;
          seenUrls.add(baseUrl);
          
          const boundingBox = await element.boundingBox();
          if (boundingBox && boundingBox.width >= 200 && boundingBox.height >= 200) {
            reviewImages.push({ element, src });
          }
        }
      }
    } catch (e) {
      continue;
    }
  }

  return reviewImages.slice(0, 20); // 최대 20개
}

/**
 * 메인 실행 함수
 */
async function main() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ 출력 디렉토리 생성: ${outputDir}`);
  }

  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    console.log('🚀 코튼플레이 더블헤비코튼 티셔츠 4770 리뷰 이미지 캡처 시작...\n');

    // 리뷰 이미지 가져오기
    console.log('📸 리뷰 이미지 가져오기...');
    console.log(`   URL: ${doubleHeavyCottonTee.reviewUrl}`);
    
    await page.goto(doubleHeavyCottonTee.reviewUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(5000);
    
    // 포토리뷰 토글 켜기 (있는 경우)
    try {
      const photoReviewToggle = await page.$('input[type="checkbox"][aria-label*="포토리뷰"], .toggle-switch, input[type="checkbox"]');
      if (photoReviewToggle) {
        const isChecked = await photoReviewToggle.isChecked();
        if (!isChecked) {
          await photoReviewToggle.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch (e) {
      console.log('   포토리뷰 토글을 찾을 수 없습니다.');
    }
    
    // 리뷰 섹션으로 스크롤
    await page.evaluate(() => {
      const reviewSection = document.querySelector('[id*="review"], .review-section, .product-review');
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await page.waitForTimeout(3000);
    
    // 페이지를 여러 번 스크롤하여 모든 리뷰 이미지 로드
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
    }
    
    const reviewImages = await findReviewImages(page);
    
    if (reviewImages.length > 0) {
      console.log(`   발견된 리뷰 이미지: ${reviewImages.length}개`);
      
      for (let i = 0; i < reviewImages.length; i++) {
        const reviewImg = reviewImages[i];
        const tempPngPath = path.join(outputDir, `tees-4770-review-${i + 1}-temp.png`);
        const webpPath = path.join(outputDir, `tees-4770-review-${i + 1}.webp`);
        doubleHeavyCottonTee.reviewFilenames.push(`tees-4770-review-${i + 1}.webp`);
        
        try {
          await downloadImage(reviewImg.src, tempPngPath);
          console.log(`✅ 리뷰 이미지 ${i + 1} 다운로드 완료 (PNG)`);
          
          // WEBP로 변환
          const converted = await convertToWebp(tempPngPath, webpPath);
          if (converted) {
            console.log(`✅ WEBP 변환 완료: tees-4770-review-${i + 1}.webp`);
            // 임시 PNG 파일 삭제
            if (fs.existsSync(tempPngPath)) {
              fs.unlinkSync(tempPngPath);
            }
          } else {
            // 변환 실패 시 PNG 파일명 변경
            const pngPath = path.join(outputDir, `tees-4770-review-${i + 1}.png`);
            fs.renameSync(tempPngPath, pngPath);
            console.log(`⚠️  WEBP 변환 실패, PNG로 저장됨: tees-4770-review-${i + 1}.png`);
          }
        } catch (error) {
          console.log(`   리뷰 이미지 ${i + 1} 다운로드 실패: ${error.message}`);
        }
        
        // 요청 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log(`⚠️  리뷰 이미지를 찾지 못했습니다.`);
    }

  } catch (error) {
    console.error(`❌ 캡처 실패:`, error.message);
  } finally {
    await browser.close();
  }

  console.log('\n--- 코튼플레이 더블헤비코튼 티셔츠 4770 리뷰 이미지 캡처 완료 ---');
  console.log(`리뷰 이미지: ${doubleHeavyCottonTee.reviewFilenames.length}개`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findReviewImages };






