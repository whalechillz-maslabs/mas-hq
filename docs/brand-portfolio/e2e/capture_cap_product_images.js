/**
 * 모자 제품 이미지 캡처 스크립트
 * 각 모자 제품 페이지에서 상세 이미지를 캡처
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 제품 정보
const products = [
  { 
    id: '5801', 
    name: 'edge-line-basic-ballcap',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=5801',
    filename: 'caps-5801.png'
  },
  { 
    id: '7125', 
    name: 'basic-baseball-cap-bulk',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=7125',
    filename: 'caps-7125.png'
  },
  { 
    id: '3080', 
    name: 'basic-baseball-cap-single',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=3080',
    filename: 'caps-3080.png'
  },
  { 
    id: '2891', 
    name: 'casual-ballcap',
    url: 'https://www.marpple.com/kr/product/detail?bp_id=2891',
    filename: 'caps-2891.png'
  }
];

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/caps');

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
    'img[alt*="썸네일"]'
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
 * 후기 이미지 찾기
 */
async function findReviewImages(page) {
  const reviewSelectors = [
    '.ReviewImage img',
    '.review-image img',
    '.review_image img',
    '.omp-cell__review-image img',
    '[data-rune="ReviewImage"] img',
    '.review img[src*="http"]'
  ];

  const reviewImages = [];

  for (const selector of reviewSelectors) {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        let src = await element.getAttribute('src') || await element.getAttribute('data-src');
        if (src && 
            (src.includes('http') || src.startsWith('//')) && 
            !src.includes('avatar') && 
            !src.includes('profile')) {
          
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = 'https://www.marpple.com' + src;
          
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

  // 중복 제거
  const uniqueImages = [];
  const seenUrls = new Set();
  for (const img of reviewImages) {
    const baseUrl = img.src.split('?')[0]; // 쿼리 파라미터 제거
    if (!seenUrls.has(baseUrl)) {
      seenUrls.add(baseUrl);
      uniqueImages.push(img);
    }
  }

  return uniqueImages.slice(0, 5); // 최대 5개만
}

/**
 * Self-Adaptive: 제품 이미지 요소 찾기 (정상적인 사이즈의 제품 이미지만)
 */
async function findProductImages(page) {
  const selectors = [
    // 마플 제품 메인 이미지 선택자들 (우선순위 순)
    '.swiper-slide-active img',
    '.swiper-slide img[src*="http"]',
    '.product-gallery img[src*="http"]',
    '.product-image img[src*="http"]',
    '.product-preview img[src*="http"]',
    'img[src*="marpple"][src*="product"]',
    'img[src*="marpple"][src*="image"]',
    'img[src*="cdn"][src*="product"]',
    'main img[src*="http"][src*=".jpg"]',
    'main img[src*="http"][src*=".png"]',
    'main img[src*="http"][src*=".webp"]'
  ];

  const validImages = [];

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        let src = await element.getAttribute('src');
        if (!src) {
          src = await element.getAttribute('data-src'); // lazy loading 이미지
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
          
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = 'https://www.marpple.com' + src;
          }
          
          // 이미지 크기 확인 (정상적인 사이즈만)
          const boundingBox = await element.boundingBox();
          if (boundingBox && 
              boundingBox.width >= 200 && 
              boundingBox.height >= 200) {
            
            // 실제 이미지 크기 확인
            let naturalWidth = 0;
            let naturalHeight = 0;
            try {
              naturalWidth = await element.evaluate(el => el.naturalWidth || el.width || 0);
              naturalHeight = await element.evaluate(el => el.naturalHeight || el.height || 0);
            } catch (e) {
              // naturalWidth/Height를 가져올 수 없는 경우 boundingBox 사용
              naturalWidth = boundingBox.width;
              naturalHeight = boundingBox.height;
            }
            
            // 실제 이미지 크기가 정상 범위인지 확인
            if (naturalWidth >= 200 && naturalHeight >= 200) {
              validImages.push({
                element: element,
                src: src,
                width: naturalWidth,
                height: naturalHeight,
                boundingBox: boundingBox
              });
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }

  // 크기순으로 정렬 (큰 이미지 우선)
  validImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  console.log(`   발견된 이미지: ${validImages.length}개`);
  if (validImages.length > 0) {
    console.log(`   최적 이미지: ${validImages[0].width}x${validImages[0].height}px`);
  }
  
  return validImages.length > 0 ? validImages[0] : null;
}

/**
 * 제품 페이지에서 이미지 다운로드
 */
async function downloadImage(imageUrl, outputPath) {
  const https = require('https');
  const http = require('http');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(imageUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
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
  });
}

/**
 * 제품 페이지 캡처
 */
async function captureProductImage(product) {
  const browser = await chromium.launch({ 
    headless: true, // 자동화를 위해 headless: true
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

    // 1. 썸네일 이미지 찾기 (첫 번째로)
    const thumbnailInfo = await findThumbnailImage(page);
    const imagesToDownload = [];
    
    if (thumbnailInfo) {
      console.log(`   썸네일 이미지 발견: ${thumbnailInfo.src}`);
      imagesToDownload.push({
        url: thumbnailInfo.src,
        filename: product.filename.replace('.png', '-thumbnail.png'),
        type: 'thumbnail'
      });
    }
    
    // 2. 메인 제품 이미지 찾기
    const imageInfo = await findProductImages(page);
    
    if (imageInfo && imageInfo.src) {
      const imageUrl = imageInfo.src;
      console.log(`   메인 이미지 URL 발견: ${imageUrl}`);
      imagesToDownload.push({
        url: imageUrl,
        filename: product.filename,
        type: 'main',
        width: imageInfo.width,
        height: imageInfo.height
      });
    }
    
    // 3. 후기 이미지 찾기
    const reviewImages = await findReviewImages(page);
    if (reviewImages.length > 0) {
      console.log(`   후기 이미지 ${reviewImages.length}개 발견`);
      reviewImages.forEach((reviewImg, index) => {
        imagesToDownload.push({
          url: reviewImg.src,
          filename: product.filename.replace('.png', `-review-${index + 1}.png`),
          type: 'review'
        });
      });
    }
    
    // 이미지 다운로드
    for (const imgData of imagesToDownload) {
      try {
        const outputPath = path.join(outputDir, imgData.filename);
        await downloadImage(imgData.url, outputPath);
        const sizeInfo = imgData.width ? ` (${imgData.width}x${imgData.height}px)` : '';
        console.log(`✅ ${imgData.type} 이미지 다운로드 완료: ${imgData.filename}${sizeInfo}`);
      } catch (downloadError) {
        console.log(`   ${imgData.type} 이미지 다운로드 실패: ${downloadError.message}`);
      }
    }
    
    // 메인 이미지가 있으면 크롭 이미지도 저장
    if (imageInfo && imageInfo.src) {
      
      // 크롭된 이미지도 저장 (다른 이름으로)
      try {
        const croppedFilename = product.filename.replace('.png', '-cropped.png');
        const croppedPath = path.join(outputDir, croppedFilename);
        
        // 이미지 요소의 bounding box로 크롭
        const boundingBox = await imageInfo.element.boundingBox();
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
          const viewport = page.viewportSize();
          const clip = {
            x: Math.max(0, Math.floor(boundingBox.x)),
            y: Math.max(0, Math.floor(boundingBox.y)),
            width: Math.min(Math.floor(boundingBox.width), viewport.width - Math.floor(boundingBox.x)),
            height: Math.min(Math.floor(boundingBox.height), viewport.height - Math.floor(boundingBox.y))
          };
          
          // 클립 영역이 유효한지 확인
          if (clip.width > 0 && clip.height > 0 && 
              clip.x + clip.width <= viewport.width && 
              clip.y + clip.height <= viewport.height) {
            await page.screenshot({
              path: croppedPath,
              clip: clip
            });
            console.log(`✅ 크롭된 이미지 저장: ${croppedFilename} (${clip.width}x${clip.height}px)`);
          } else {
            // 클립 영역이 유효하지 않으면 요소만 스크린샷
            await imageInfo.element.screenshot({ path: croppedPath });
            console.log(`✅ 크롭된 이미지 저장 (요소만): ${croppedFilename}`);
          }
        } else {
          // boundingBox를 가져올 수 없으면 요소만 스크린샷
          await imageInfo.element.screenshot({ path: croppedPath });
          console.log(`✅ 크롭된 이미지 저장 (요소만): ${croppedFilename}`);
        }
      } catch (cropError) {
        console.log(`   크롭 이미지 저장 실패: ${cropError.message}`);
      }
    } else {
      console.log(`⚠️  정상 사이즈 이미지를 찾지 못했습니다.`);
      
      // 대체 방법: 제품 이미지 영역만 캡처
      try {
        const productImageArea = await page.$('.product-image, .product-gallery, .swiper-container, .swiper-wrapper');
        if (productImageArea) {
          const outputPath = path.join(outputDir, product.filename);
          await productImageArea.screenshot({ path: outputPath });
          console.log(`✅ 제품 이미지 영역 캡처: ${product.filename}`);
        } else {
          throw new Error('제품 이미지 영역을 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error(`❌ 이미지 캡처 실패:`, error.message);
      }
    }

  } catch (error) {
    console.error(`❌ ${product.name} 캡처 실패:`, error.message);
  } finally {
    await browser.close();
  }
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

  console.log('🚀 모자 제품 이미지 캡처 시작...\n');

  // 각 제품 이미지 캡처
  for (const product of products) {
    await captureProductImage(product);
    // 요청 간 딜레이
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n--- 모자 제품 이미지 캡처 완료 ---');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { captureProductImage, findProductImages };

