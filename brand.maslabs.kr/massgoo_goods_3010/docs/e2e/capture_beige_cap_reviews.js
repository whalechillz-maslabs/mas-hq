/**
 * 베이지 볼캡 썸네일 및 리뷰 이미지 캡처 스크립트
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 베이지 볼캡 제품 정보
const beigeCap = {
  id: '2976',
  pc_id: '23575353', // 베이지 색상
  name: 'basic-ballcap-beige',
  productUrl: 'https://www.marpple.com/kr/product/detail?bp_id=2976&pc_id=23575353',
  reviewUrl: 'https://www.marpple.com/kr/product/detail?bp_id=2976#review',
  thumbnailFilename: 'caps-2976-beige-thumbnail.png',
  reviewFilenames: []
};

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/caps');

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
 * 썸네일 이미지 찾기
 */
async function findThumbnailImage(page) {
  const thumbnailSelectors = [
    '.product-thumbnail img',
    '.thumbnail img',
    '.product-preview-thumb img',
    '.swiper-thumbs img',
    '.product-image-thumb img',
    'img[class*="thumb"]',
    '.swiper-slide-active img'
  ];

  for (const selector of thumbnailSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        let src = await element.getAttribute('src') || await element.getAttribute('data-src');
        if (src && (src.includes('http') || src.startsWith('//'))) {
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = 'https://www.marpple.com' + src;
          
          const boundingBox = await element.boundingBox();
          if (boundingBox && boundingBox.width >= 100 && boundingBox.height >= 100) {
            return { element, src };
          }
        }
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

/**
 * 리뷰 이미지 찾기
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
    '.product-review img[src*="http"]'
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

  return reviewImages.slice(0, 10); // 최대 10개
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
    console.log('🚀 베이지 볼캡 이미지 캡처 시작...\n');

    // 1. 썸네일 이미지 가져오기
    console.log('📸 썸네일 이미지 가져오기...');
    console.log(`   URL: ${beigeCap.productUrl}`);
    
    await page.goto(beigeCap.productUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('   네트워크 대기 타임아웃, 계속 진행...');
    });

    const thumbnailInfo = await findThumbnailImage(page);
    
    if (thumbnailInfo) {
      try {
        const outputPath = path.join(outputDir, beigeCap.thumbnailFilename);
        await downloadImage(thumbnailInfo.src, outputPath);
        console.log(`✅ 썸네일 이미지 다운로드 완료: ${beigeCap.thumbnailFilename}`);
      } catch (error) {
        console.log(`   썸네일 다운로드 실패: ${error.message}`);
        // 다운로드 실패 시 스크린샷 사용
        try {
          const outputPath = path.join(outputDir, beigeCap.thumbnailFilename);
          await thumbnailInfo.element.screenshot({ path: outputPath });
          console.log(`✅ 썸네일 이미지 스크린샷 저장: ${beigeCap.thumbnailFilename}`);
        } catch (screenshotError) {
          console.log(`   썸네일 스크린샷 실패: ${screenshotError.message}`);
        }
      }
    } else {
      console.log(`⚠️  썸네일 이미지를 찾지 못했습니다. 메인 이미지를 썸네일로 사용합니다.`);
      // 메인 제품 이미지를 썸네일로 사용
      try {
        const mainImageSelectors = [
          '.swiper-slide-active img',
          '.product-gallery img',
          '.product-image img',
          'main img[src*="http"][src*=".jpg"]',
          'main img[src*="http"][src*=".png"]'
        ];
        
        for (const selector of mainImageSelectors) {
          const element = await page.$(selector);
          if (element) {
            let src = await element.getAttribute('src') || await element.getAttribute('data-src');
            if (src && (src.includes('http') || src.startsWith('//'))) {
              if (src.startsWith('//')) src = 'https:' + src;
              else if (src.startsWith('/')) src = 'https://www.marpple.com' + src;
              
              const outputPath = path.join(outputDir, beigeCap.thumbnailFilename);
              await downloadImage(src, outputPath);
              console.log(`✅ 메인 이미지를 썸네일로 저장: ${beigeCap.thumbnailFilename}`);
              break;
            }
          }
        }
      } catch (error) {
        console.log(`   메인 이미지 썸네일 저장 실패: ${error.message}`);
      }
    }

    // 2. 리뷰 이미지 가져오기
    console.log('\n📸 리뷰 이미지 가져오기...');
    console.log(`   URL: ${beigeCap.reviewUrl}`);
    
    await page.goto(beigeCap.reviewUrl, { 
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
    
    const reviewImages = await findReviewImages(page);
    
    if (reviewImages.length > 0) {
      console.log(`   발견된 리뷰 이미지: ${reviewImages.length}개`);
      
      for (let i = 0; i < reviewImages.length; i++) {
        const reviewImg = reviewImages[i];
        const filename = `caps-2976-beige-review-${i + 1}.png`;
        beigeCap.reviewFilenames.push(filename);
        
        try {
          const outputPath = path.join(outputDir, filename);
          await downloadImage(reviewImg.src, outputPath);
          console.log(`✅ 리뷰 이미지 ${i + 1} 다운로드 완료: ${filename}`);
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

  console.log('\n--- 베이지 볼캡 이미지 캡처 완료 ---');
  console.log(`썸네일: ${beigeCap.thumbnailFilename}`);
  console.log(`리뷰 이미지: ${beigeCap.reviewFilenames.length}개`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findThumbnailImage, findReviewImages };

