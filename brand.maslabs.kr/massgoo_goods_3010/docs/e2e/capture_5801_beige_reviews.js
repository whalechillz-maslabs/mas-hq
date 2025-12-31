/**
 * 엣지 라인 베이직 볼캡 (5801) 베이지 색상 리뷰 이미지 캡처 스크립트
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 엣지 라인 베이직 볼캡 제품 정보
const edgeLineCap = {
  id: '5801',
  name: 'edge-line-basic-ballcap-beige',
  productUrl: 'https://www.marpple.com/kr/product/detail?bp_id=5801',
  reviewUrl: 'https://www.marpple.com/kr/product/detail?bp_id=5801#review',
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
 * 리뷰 이미지 찾기 (최대 6개)
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

  return reviewImages.slice(0, 6); // 최대 6개만
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
    console.log('🚀 엣지 라인 베이직 볼캡 (5801) 리뷰 이미지 캡처 시작...\n');

    // 리뷰 이미지 가져오기
    console.log('📸 리뷰 이미지 가져오기...');
    console.log(`   URL: ${edgeLineCap.reviewUrl}`);
    
    await page.goto(edgeLineCap.reviewUrl, { 
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
    
    // 페이지를 더 스크롤하여 모든 리뷰 이미지 로드
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    const reviewImages = await findReviewImages(page);
    
    if (reviewImages.length > 0) {
      console.log(`   발견된 리뷰 이미지: ${reviewImages.length}개`);
      
      for (let i = 0; i < reviewImages.length; i++) {
        const reviewImg = reviewImages[i];
        const filename = `caps-5801-beige-review-${i + 1}.png`;
        edgeLineCap.reviewFilenames.push(filename);
        
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

  console.log('\n--- 엣지 라인 베이직 볼캡 (5801) 리뷰 이미지 캡처 완료 ---');
  console.log(`리뷰 이미지: ${edgeLineCap.reviewFilenames.length}개`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findReviewImages };

