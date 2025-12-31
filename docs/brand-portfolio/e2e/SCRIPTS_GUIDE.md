# 마플 제품 이미지 캡처 스크립트 작성 가이드

## 개요
이 문서는 마플(Marpple) 제품 페이지에서 이미지를 자동으로 캡처하는 Playwright 스크립트의 작성 방법을 설명합니다.

## 핵심 원칙

### 1. Self-Adaptive Automation
- **다중 선택자 전략**: 여러 선택자를 순차적으로 시도하여 안정성 확보
- **Fallback 메커니즘**: 각 단계에서 실패 시 대체 방법 제공
- **에러 복구**: 실패해도 다음 단계 계속 진행

### 2. 이미지 품질 보장
- **크기 필터링**: 최소 200x200px 이상의 이미지만 수집
- **중복 제거**: URL base를 기준으로 중복 이미지 제거
- **형식 최적화**: PNG → WEBP 자동 변환으로 용량 최적화

### 3. 안정적인 페이지 로딩
- **단계별 대기**: 각 단계마다 충분한 대기 시간
- **스크롤 전략**: 여러 번 스크롤하여 지연 로딩 이미지 로드
- **네트워크 대기**: `networkidle` 상태 대기

## 스크립트 템플릿

### 기본 템플릿

```javascript
/**
 * [제품명] [제품ID] 리뷰 이미지 캡처 스크립트
 * 리뷰 이미지 최대 N개 가져오기
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 제품 정보
const product = {
  id: '제품ID',
  name: '제품명',
  productUrl: 'https://www.marpple.com/kr/product/detail?bp_id=제품ID',
  reviewUrl: 'https://www.marpple.com/kr/product/detail?bp_id=제품ID#review',
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
 * 리뷰 이미지 찾기 (Self-Adaptive)
 */
async function findReviewImages(page, maxCount = 20) {
  // 우선순위별 선택자 목록
  const reviewSelectors = [
    '.ReviewImage img',                    // 마플 리뷰 이미지 클래스
    '.review-image img',                   // 일반 리뷰 이미지
    '.review_image img',                   // 언더스코어 버전
    '.omp-cell__review-image img',         // OMP 리뷰 이미지
    '[data-rune="ReviewImage"] img',       // 데이터 속성 기반
    '.review img[src*="http"]',            // 리뷰 섹션 내 이미지
    '.omp-cell__review img[src*="http"]',  // OMP 리뷰 셀 이미지
    '.product-review img[src*="http"]',     // 제품 리뷰 이미지
    '.best-review img[src*="http"]',       // 베스트 리뷰 이미지
    '.review-list img[src*="http"]',       // 리뷰 리스트 이미지
    'img[src*="review"]',                  // URL에 review 포함
    'img[src*="marpple"][src*="image"]'    // 마플 이미지 CDN
  ];

  const reviewImages = [];
  const seenUrls = new Set();

  // 각 선택자 시도
  for (const selector of reviewSelectors) {
    try {
      const elements = await page.$$(selector);
      for (const element of elements) {
        // src 또는 data-src 확인 (지연 로딩 대응)
        let src = await element.getAttribute('src') || await element.getAttribute('data-src');
        
        if (src && 
            (src.includes('http') || src.startsWith('//')) && 
            !src.includes('avatar') &&      // 아바타 제외
            !src.includes('profile') &&      // 프로필 이미지 제외
            !src.includes('placeholder')) { // 플레이스홀더 제외
          
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = 'https://www.marpple.com' + src;
          }
          
          // 중복 제거 (쿼리 파라미터 제외한 base URL 기준)
          const baseUrl = src.split('?')[0];
          if (seenUrls.has(baseUrl)) continue;
          seenUrls.add(baseUrl);
          
          // 이미지 크기 확인 (정상적인 사이즈만)
          const boundingBox = await element.boundingBox();
          if (boundingBox && 
              boundingBox.width >= 200 && 
              boundingBox.height >= 200) {
            reviewImages.push({ element, src });
          }
        }
      }
    } catch (e) {
      // 선택자 실패 시 다음 선택자 시도
      continue;
    }
  }

  // 최대 개수 제한
  return reviewImages.slice(0, maxCount);
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

  // 브라우저 실행 (Stealth 모드)
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',  // 자동화 감지 방지
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
    console.log(`🚀 ${product.name} 리뷰 이미지 캡처 시작...\n`);

    // 1. 리뷰 페이지 접근
    console.log('📸 리뷰 이미지 가져오기...');
    console.log(`   URL: ${product.reviewUrl}`);
    
    await page.goto(product.reviewUrl, { 
      waitUntil: 'domcontentloaded',  // DOM 로드 완료 대기
      timeout: 60000 
    });
    
    await page.waitForTimeout(5000);  // 초기 로딩 대기
    
    // 2. 포토리뷰 토글 활성화 (있는 경우)
    try {
      const photoReviewToggle = await page.$(
        'input[type="checkbox"][aria-label*="포토리뷰"], .toggle-switch, input[type="checkbox"]'
      );
      if (photoReviewToggle) {
        const isChecked = await photoReviewToggle.isChecked();
        if (!isChecked) {
          await photoReviewToggle.click();
          await page.waitForTimeout(2000);  // 토글 후 대기
        }
      }
    } catch (e) {
      console.log('   포토리뷰 토글을 찾을 수 없습니다.');
    }
    
    // 3. 리뷰 섹션으로 스크롤
    await page.evaluate(() => {
      const reviewSection = document.querySelector(
        '[id*="review"], .review-section, .product-review'
      );
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await page.waitForTimeout(3000);
    
    // 4. 페이지를 여러 번 스크롤하여 모든 리뷰 이미지 로드
    // 지연 로딩 이미지를 위해 여러 번 스크롤
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);  // 스크롤 후 이미지 로드 대기
    }
    
    // 5. 리뷰 이미지 찾기
    const reviewImages = await findReviewImages(page, 20);
    
    if (reviewImages.length > 0) {
      console.log(`   발견된 리뷰 이미지: ${reviewImages.length}개`);
      
      // 6. 각 이미지 다운로드 및 변환
      for (let i = 0; i < reviewImages.length; i++) {
        const reviewImg = reviewImages[i];
        const tempPngPath = path.join(outputDir, `caps-${product.id}-review-${i + 1}-temp.png`);
        const webpPath = path.join(outputDir, `caps-${product.id}-review-${i + 1}.webp`);
        product.reviewFilenames.push(`caps-${product.id}-review-${i + 1}.webp`);
        
        try {
          // PNG로 다운로드
          await downloadImage(reviewImg.src, tempPngPath);
          console.log(`✅ 리뷰 이미지 ${i + 1} 다운로드 완료 (PNG)`);
          
          // WEBP로 변환
          const converted = await convertToWebp(tempPngPath, webpPath);
          if (converted) {
            console.log(`✅ WEBP 변환 완료: caps-${product.id}-review-${i + 1}.webp`);
            // 임시 PNG 파일 삭제
            if (fs.existsSync(tempPngPath)) {
              fs.unlinkSync(tempPngPath);
            }
          } else {
            // 변환 실패 시 PNG 파일명 변경
            const pngPath = path.join(outputDir, `caps-${product.id}-review-${i + 1}.png`);
            fs.renameSync(tempPngPath, pngPath);
            console.log(`⚠️  WEBP 변환 실패, PNG로 저장됨: caps-${product.id}-review-${i + 1}.png`);
          }
        } catch (error) {
          console.log(`   리뷰 이미지 ${i + 1} 다운로드 실패: ${error.message}`);
        }
        
        // 요청 간 딜레이 (서버 부하 방지)
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

  console.log(`\n--- ${product.name} 리뷰 이미지 캡처 완료 ---`);
  console.log(`리뷰 이미지: ${product.reviewFilenames.length}개`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findReviewImages };
```

## 주요 함수 설명

### 1. `downloadImage(imageUrl, outputPath)`
- **기능**: 이미지 URL에서 파일 다운로드
- **특징**: 
  - HTTP/HTTPS 자동 감지
  - 에러 처리 포함
  - 스트림 방식으로 메모리 효율적

### 2. `convertToWebp(pngPath, webpPath)`
- **기능**: PNG 이미지를 WEBP로 변환
- **특징**:
  - `sharp` 라이브러리 사용
  - 품질 85%로 균형잡힌 압축
  - 변환 실패 시 false 반환

### 3. `findReviewImages(page, maxCount)`
- **기능**: 페이지에서 리뷰 이미지 찾기
- **Self-Adaptive 전략**:
  - 다중 선택자 시도
  - 중복 제거 (URL base 기준)
  - 크기 필터링 (최소 200x200px)
  - 지연 로딩 이미지 대응 (`data-src` 확인)

## 실행 흐름

```
1. 브라우저 실행 (Stealth 모드)
   ↓
2. 리뷰 페이지 접근
   ↓
3. 포토리뷰 토글 활성화
   ↓
4. 리뷰 섹션으로 스크롤
   ↓
5. 여러 번 스크롤하여 이미지 로드
   ↓
6. 리뷰 이미지 찾기 (Self-Adaptive)
   ↓
7. 각 이미지 다운로드 (PNG)
   ↓
8. WEBP로 변환
   ↓
9. 임시 PNG 파일 삭제
   ↓
10. 완료
```

## 선택자 우선순위

1. **구체적인 클래스**: `.ReviewImage img`, `.omp-cell__review-image img`
2. **데이터 속성**: `[data-rune="ReviewImage"] img`
3. **일반적인 클래스**: `.review-image img`, `.review img`
4. **URL 패턴**: `img[src*="review"]`, `img[src*="marpple"]`

## 필터링 기준

### 포함 조건
- HTTP/HTTPS URL
- 최소 크기: 200x200px
- 이미지 확장자 포함 (.jpg, .png, .webp)

### 제외 조건
- `avatar` 포함 URL
- `profile` 포함 URL
- `placeholder` 포함 URL
- 너무 작은 이미지 (< 200px)

## 최적화 팁

1. **이미지 개수 제한**: 필요한 만큼만 가져오기 (성능 향상)
2. **WEBP 변환**: 용량 절감 및 로딩 속도 개선
3. **요청 간 딜레이**: 서버 부하 방지
4. **에러 처리**: 일부 실패해도 나머지 계속 진행

## 문제 해결 체크리스트

- [ ] 포토리뷰 토글이 활성화되었는가?
- [ ] 페이지 스크롤이 충분히 이루어졌는가?
- [ ] 선택자 목록에 새로운 선택자가 필요한가?
- [ ] 이미지 크기 필터 기준이 적절한가?
- [ ] 네트워크 타임아웃이 충분한가?






