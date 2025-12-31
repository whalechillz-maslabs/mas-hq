/**
 * 맨투맨 제품 이미지 캡처 스크립트
 * 특양면 헤리 맨투맨 (3165)과 스페셜 인터록 오버핏 맨투맨 (8913) 이미지 캡처
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 제품 정보
const products = [
  { 
    id: '3165', 
    name: 'special-cotton-terry-sweatshirt',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=3165',
    filename: 'sweatshirt-3165.webp'
  },
  { 
    id: '8913', 
    name: 'special-interlock-overfit-sweatshirt',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=8913',
    filename: 'sweatshirt-8913.webp'
  }
];

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/sweatshirts');

// 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
    console.log(`   ✅ WEBP 변환 완료: ${webpPath}`);
    // PNG 파일 삭제
    fs.unlinkSync(pngPath);
  } catch (error) {
    console.error(`   ⚠️ WEBP 변환 실패: ${error.message}`);
  }
}

/**
 * 제품 메인 이미지 찾기
 */
async function findProductImage(page) {
  const selectors = [
    '.swiper-slide-active img',
    '.product-image img',
    '.product-main-image img',
    '.product-detail-image img',
    '.product-photo img',
    'img[class*="product"]',
    'img[alt*="맨투맨"]',
    'img[alt*="스웨트"]',
    '.swiper-wrapper img',
    '.product-gallery img'
  ];

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        let src = await element.getAttribute('src');
        if (!src) {
          src = await element.getAttribute('data-src');
        }
        
        if (src && 
            (src.includes('http') || src.startsWith('//')) && 
            !src.includes('placeholder') && 
            !src.includes('logo') &&
            !src.includes('banner') &&
            !src.includes('icon') &&
            !src.includes('button') &&
            !src.includes('avatar') &&
            !src.includes('profile') &&
            (src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('image'))) {
          
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = 'https://www.marpple.com' + src;
          }
          
          const boundingBox = await element.boundingBox();
          if (boundingBox && 
              boundingBox.width >= 200 &&
              boundingBox.height >= 200) {
            return src;
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
  // 리뷰 섹션으로 스크롤
  try {
    await page.evaluate(() => {
      const reviewSection = document.querySelector('#review') || document.querySelector('.review-section');
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('   리뷰 섹션 스크롤 실패, 계속 진행...');
  }

  const reviewSelectors = [
    '.ReviewImage img',
    '.review-image img',
    '.review-photo img',
    '.review-content img',
    '[class*="Review"] img',
    '[class*="review"] img'
  ];

  const reviewImages = [];
  const seenUrls = new Set();

  for (const selector of reviewSelectors) {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        let src = await element.getAttribute('src');
        if (!src) {
          src = await element.getAttribute('data-src');
        }
        
        if (src && 
            (src.includes('http') || src.startsWith('//')) && 
            !src.includes('placeholder') && 
            !src.includes('logo') &&
            !src.includes('avatar') &&
            (src.includes('.jpg') || src.includes('.png') || src.includes('.webp'))) {
          
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = 'https://www.marpple.com' + src;
          }
          
          // URL base로 중복 제거
          const urlBase = src.split('?')[0];
          if (!seenUrls.has(urlBase)) {
            seenUrls.add(urlBase);
            
            const boundingBox = await element.boundingBox();
            if (boundingBox && 
                boundingBox.width >= 200 &&
                boundingBox.height >= 200) {
              reviewImages.push(src);
            }
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
 * 제품 페이지 캡처
 */
async function captureProductImage(product) {
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
    console.log(`\n📸 ${product.name} 이미지 캡처 시작...`);
    console.log(`   URL: ${product.url}`);

    // 페이지 로드
    await page.goto(product.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // 페이지 로드 대기
    await page.waitForTimeout(5000);
    
    // 이미지 로드 대기
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('   네트워크 대기 타임아웃, 계속 진행...');
    });

    // 여러 번 스크롤하여 지연 로딩 이미지 로드
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForTimeout(1000);
    }

    // 메인 제품 이미지 찾기
    const mainImageUrl = await findProductImage(page);
    
    if (mainImageUrl) {
      console.log(`   메인 이미지 URL 발견: ${mainImageUrl}`);
      const mainImagePath = path.join(outputDir, product.filename);
      
      try {
        await downloadImage(mainImageUrl, mainImagePath);
        console.log(`   ✅ 메인 이미지 저장 완료: ${product.filename}`);
      } catch (error) {
        console.error(`   ❌ 메인 이미지 다운로드 실패: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️ 메인 이미지를 찾지 못했습니다.`);
    }
    
    // 리뷰 이미지 찾기
    const reviewImages = await findReviewImages(page);
    
    if (reviewImages.length > 0) {
      console.log(`   리뷰 이미지 ${reviewImages.length}개 발견`);
      
      for (let i = 0; i < reviewImages.length; i++) {
        const reviewImageUrl = reviewImages[i];
        const reviewFilename = `sweatshirt-${product.id}-review-${i + 1}.webp`;
        const reviewImagePath = path.join(outputDir, reviewFilename);
        
        try {
          await downloadImage(reviewImageUrl, reviewImagePath);
          console.log(`   ✅ 리뷰 이미지 ${i + 1} 저장 완료`);
        } catch (error) {
          console.error(`   ❌ 리뷰 이미지 ${i + 1} 다운로드 실패: ${error.message}`);
        }
      }
    } else {
      console.log(`   ⚠️ 리뷰 이미지를 찾지 못했습니다.`);
    }

  } catch (error) {
    console.error(`   ❌ 에러 발생: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 맨투맨 제품 이미지 캡처 시작...\n');
  
  for (const product of products) {
    await captureProductImage(product);
    await new Promise(resolve => setTimeout(resolve, 3000)); // 제품 간 대기
  }
  
  console.log('\n✅ 모든 이미지 캡처 완료!');
}

main().catch(console.error);




