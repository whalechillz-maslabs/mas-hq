# E2E 자동화 스크립트 가이드

## 개요
마플(Marpple) 제품 페이지에서 이미지를 자동으로 캡처하고 처리하는 Playwright 기반 스크립트 모음입니다.

## 주요 스크립트 분류

### 1. 리뷰 이미지 캡처 스크립트 (Review Image Capture)

#### 베이직 볼캡 (2976)
- **파일**: `capture_beige_cap_reviews.js`
- **기능**: 베이지 볼캡 썸네일 1개 + 리뷰 이미지 10개 캡처
- **실행**: `npm run capture:beige-reviews`
- **출력**: 
  - `caps-2976-beige-thumbnail.png`
  - `caps-2976-beige-review-1.png` ~ `caps-2976-beige-review-10.png`

#### 엣지 라인 베이직 볼캡 (5801)
- **파일**: `capture_5801_beige_reviews.js`
- **기능**: 리뷰 이미지 6개 캡처 (WEBP 변환)
- **실행**: `npm run capture:5801-beige-reviews`
- **출력**: 
  - `caps-5801-beige-review-1.webp` ~ `caps-5801-beige-review-6.webp`

#### 베이직 야구모자 (대량형) (7125)
- **파일**: `capture_7125_review.js`
- **기능**: 리뷰 이미지 1개 캡처 (WEBP 변환)
- **실행**: `npm run capture:7125-review`
- **출력**: 
  - `caps-7125-beige-review-1.webp`

#### 베이직 야구모자 (단품) (3080)
- **파일**: `capture_3080_reviews.js`
- **기능**: 리뷰 이미지 최대 20개 캡처 (WEBP 변환)
- **실행**: `npm run capture:3080-reviews`
- **출력**: 
  - `caps-3080-review-1.webp` ~ `caps-3080-review-20.webp`

#### 캐주얼 볼캡 (2891)
- **파일**: `capture_2891_reviews.js`
- **기능**: 리뷰 이미지 최대 20개 캡처 (WEBP 변환)
- **실행**: `npm run capture:2891-reviews`
- **출력**: 
  - `caps-2891-review-1.webp` ~ `caps-2891-review-20.webp`

### 2. 제품 이미지 캡처 스크립트 (Product Image Capture)

#### 모자 제품 이미지 캡처
- **파일**: `capture_cap_product_images.js`
- **기능**: 각 모자 제품의 메인 이미지 및 썸네일 캡처
- **실행**: `npm run capture:cap-products`
- **출력**: 
  - `caps-{product-id}.png`
  - `caps-{product-id}-thumbnail.png`
  - `caps-{product-id}-cropped.png`

### 3. 이미지 변환 스크립트 (Image Conversion)

#### 5801 리뷰 이미지 WEBP 변환
- **파일**: `convert_5801_reviews_to_webp.js`
- **기능**: PNG 리뷰 이미지를 WEBP로 변환
- **실행**: `npm run convert:5801-reviews`

## 공통 스크립트 작성 패턴

### 1. 기본 구조

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 제품 정보
const product = {
  id: '제품ID',
  name: '제품명',
  productUrl: '제품 상세 페이지 URL',
  reviewUrl: '리뷰 페이지 URL',
  reviewFilenames: []
};

// 이미지 저장 경로
const outputDir = path.join(__dirname, '../../images/caps');
```

### 2. 이미지 다운로드 함수

```javascript
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
```

### 3. PNG → WEBP 변환 함수

```javascript
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
```

### 4. 리뷰 이미지 찾기 함수 (Self-Adaptive)

```javascript
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
          
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = 'https://www.marpple.com' + src;
          
          // 중복 제거 (base URL 기준)
          const baseUrl = src.split('?')[0];
          if (seenUrls.has(baseUrl)) continue;
          seenUrls.add(baseUrl);
          
          // 이미지 크기 확인 (정상적인 사이즈만)
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

  return reviewImages.slice(0, 20); // 최대 개수 제한
}
```

### 5. 메인 실행 함수 패턴

```javascript
async function main() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
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
    // 1. 리뷰 페이지 접근
    await page.goto(reviewUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(5000);
    
    // 2. 포토리뷰 토글 활성화
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
    
    // 3. 리뷰 섹션으로 스크롤
    await page.evaluate(() => {
      const reviewSection = document.querySelector('[id*="review"], .review-section, .product-review');
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await page.waitForTimeout(3000);
    
    // 4. 페이지를 여러 번 스크롤하여 모든 리뷰 이미지 로드
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
    }
    
    // 5. 리뷰 이미지 찾기 및 다운로드
    const reviewImages = await findReviewImages(page);
    
    for (let i = 0; i < reviewImages.length; i++) {
      const tempPngPath = path.join(outputDir, `caps-{id}-review-${i + 1}-temp.png`);
      const webpPath = path.join(outputDir, `caps-{id}-review-${i + 1}.webp`);
      
      // 다운로드
      await downloadImage(reviewImages[i].src, tempPngPath);
      
      // WEBP 변환
      const converted = await convertToWebp(tempPngPath, webpPath);
      if (converted) {
        fs.unlinkSync(tempPngPath); // 임시 PNG 삭제
      }
      
      // 요청 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error(`❌ 캡처 실패:`, error.message);
  } finally {
    await browser.close();
  }
}
```

## 핵심 전략 (Self-Adaptive Automation)

### 1. 다중 선택자 전략
- 여러 선택자를 순차적으로 시도하여 안정성 확보
- 우선순위: 구체적인 선택자 → 일반적인 선택자

### 2. 중복 제거
- URL의 base 부분(쿼리 파라미터 제외)을 기준으로 중복 제거
- `Set` 자료구조 활용

### 3. 이미지 크기 필터링
- 너무 작은 이미지(아바타, 아이콘 등) 제외
- 최소 크기: 200x200px

### 4. 지연 로딩 이미지 처리
- `data-src` 속성도 확인
- 페이지 스크롤을 통한 이미지 로드 유도

### 5. 에러 처리
- 각 단계에서 try-catch로 에러 처리
- 실패해도 다음 단계 계속 진행

### 6. 이미지 형식 변환
- PNG로 다운로드 후 WEBP로 변환
- 변환 실패 시 PNG 유지
- 임시 파일 자동 삭제

## 실행 방법

### 개별 스크립트 실행
```bash
npm run capture:beige-reviews      # 베이직 볼캡 리뷰
npm run capture:5801-beige-reviews # 엣지 라인 베이직 볼캡 리뷰
npm run capture:7125-review        # 베이직 야구모자 (대량형) 리뷰
npm run capture:3080-reviews      # 베이직 야구모자 (단품) 리뷰
npm run capture:2891-reviews       # 캐주얼 볼캡 리뷰
npm run capture:cap-products      # 모자 제품 이미지
```

### 전체 실행
```bash
npm run capture:all
```

## 출력 디렉토리 구조

```
images/
└── caps/
    ├── caps-2976.webp
    ├── caps-2976-beige-review-1.png ~ 10.png
    ├── caps-5801.webp
    ├── caps-5801-beige-review-1.webp ~ 5.webp
    ├── caps-7125.webp
    ├── caps-7125-beige-review-1.webp
    ├── caps-3080.webp
    ├── caps-3080-review-1.webp ~ 20.webp
    ├── caps-2891.webp
    └── caps-2891-review-1.webp ~ 20.webp
```

## 주의사항

1. **타임아웃 설정**: 네트워크가 느린 경우 타임아웃을 늘려야 할 수 있습니다.
2. **요청 간 딜레이**: 서버 부하를 줄이기 위해 이미지 다운로드 간 1초 딜레이를 둡니다.
3. **이미지 크기**: 너무 작은 이미지는 제외되므로, 필요시 최소 크기 기준을 조정하세요.
4. **WEBP 변환**: `sharp` 라이브러리가 필요하며, 변환 실패 시 PNG로 저장됩니다.

## 문제 해결

### 리뷰 이미지를 찾지 못하는 경우
1. 포토리뷰 토글이 활성화되었는지 확인
2. 페이지 스크롤이 충분히 이루어졌는지 확인
3. 선택자 목록에 새로운 선택자 추가

### 이미지 다운로드 실패
1. 네트워크 연결 확인
2. URL 형식 확인 (상대 경로 → 절대 경로 변환)
3. 타임아웃 시간 증가

### WEBP 변환 실패
1. `sharp` 라이브러리 설치 확인: `npm install sharp`
2. PNG 파일이 정상적으로 다운로드되었는지 확인
3. 변환 실패 시 PNG 파일이 유지됩니다
