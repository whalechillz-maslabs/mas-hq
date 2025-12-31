const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * 마플에서 "우당탕탕 성수 갱스터" 테마의 모든 디자인 이미지를 스크래핑하는 스크립트
 */

const OUTPUT_DIR = path.join(__dirname, '../../images/designs/seongsu_gangster');
const PRODUCT_URL = 'https://www.marpple.com/kr/product/detail?bp_id=8982';

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://www.marpple.com/',
      },
    });
    fs.writeFileSync(outputPath, response.data);
    return true;
  } catch (error) {
    console.error(`  ❌ 이미지 다운로드 실패 (${imageUrl}): ${error.message}`);
    return false;
  }
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: false, // 화면을 보면서 확인
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log('🧭 제품 페이지 접속 중...');
    await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log('🔍 "우당탕탕 성수 갱스터" 테마 디자인 찾는 중...');

    // 테마 모달 열기 시도 (여러 방법)
    try {
      // 방법 1: 텍스트로 찾기
      const themeButtons = [
        page.locator('text=우당탕탕 성수 갱스터').first(),
        page.locator('text=성수갱스터').first(),
        page.locator('text=테마 자세히 보기').first(),
        page.locator('[class*="theme"], [data-theme]').first(),
        page.locator('button:has-text("테마")').first(),
      ];

      let modalOpened = false;
      for (const btn of themeButtons) {
        try {
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(3000);
            console.log('✅ 테마 모달 열기 성공');
            modalOpened = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!modalOpened) {
        console.log('ℹ️ 테마 모달 버튼을 찾지 못했습니다. 페이지에서 직접 디자인 이미지 찾기 시도...');
      }
    } catch (error) {
      console.log('ℹ️ 테마 모달 열기 중 오류:', error.message);
    }

    // 디자인 이미지 수집
    console.log('📦 디자인 이미지 수집 중...');
    await page.waitForTimeout(5000);

    const designImages = await page.evaluate(() => {
      const images = [];
      const seen = new Set();

      // 모든 img 태그 찾기
      const allImages = Array.from(document.querySelectorAll('img'));

      console.log(`총 ${allImages.length}개의 이미지 태그 발견`);

      for (const img of allImages) {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
        if (!src) continue;

        // 이미지 URL 정규화
        let imageUrl = src;
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://www.marpple.com' + imageUrl;
        }

        // 중복 제거
        if (seen.has(imageUrl)) continue;
        seen.add(imageUrl);

        // 성수 갱스터 관련 이미지 필터링
        const alt = img.getAttribute('alt') || '';
        const parent = img.closest('div, article, li, section');
        const parentText = parent?.textContent || '';
        const parentClass = parent?.className || '';

        // 더 넓은 범위로 필터링 (모달 내 이미지, 디자인 이미지 등)
        const isRelevant = 
          imageUrl.includes('seongsu') ||
          imageUrl.includes('gangster') ||
          imageUrl.includes('갱스터') ||
          imageUrl.includes('성수') ||
          imageUrl.includes('udangtangtang') ||
          alt.includes('갱스터') ||
          alt.includes('성수') ||
          parentText.includes('우당탕탕') ||
          parentText.includes('성수 갱스터') ||
          parentText.includes('성수갱스터') ||
          parentClass.includes('theme') ||
          parentClass.includes('design') ||
          imageUrl.match(/design|theme|template|character/i) ||
          (imageUrl.match(/\.(png|jpg|jpeg|webp)/i) && 
           (img.naturalWidth > 100 || img.width > 100 || img.clientWidth > 100)); // 큰 이미지만

        if (isRelevant) {
          const width = img.naturalWidth || img.width || img.clientWidth || 0;
          const height = img.naturalHeight || img.height || img.clientHeight || 0;

          // 작은 아이콘 제외
          if (width > 50 && height > 50) {
            images.push({
              url: imageUrl,
              alt: alt,
              width: width,
              height: height,
              parentText: parentText.substring(0, 100),
            });
          }
        }
      }

      return images;
    });

    console.log(`📦 발견된 디자인 이미지: ${designImages.length}개`);

    // 추가로 테마 디자인 영역에서 이미지 찾기
    const themeDesigns = await page.evaluate(() => {
      const designs = [];
      const seen = new Set();

      // 테마 디자인 컨테이너 찾기
      const themeContainers = Array.from(document.querySelectorAll(
        '[class*="theme"], [class*="design"], [class*="template"], [data-theme]'
      ));

      for (const container of themeContainers) {
        const containerText = container.textContent || '';
        if (containerText.includes('우당탕탕') || containerText.includes('성수') || containerText.includes('갱스터')) {
          const images = container.querySelectorAll('img');
          for (const img of images) {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
            if (!src) continue;

            let imageUrl = src;
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://www.marpple.com' + imageUrl;
            }

            if (!seen.has(imageUrl)) {
              seen.add(imageUrl);
              designs.push({
                url: imageUrl,
                alt: img.getAttribute('alt') || '',
              });
            }
          }
        }
      }

      return designs;
    });

    console.log(`📦 테마 컨테이너에서 발견된 이미지: ${themeDesigns.length}개`);

    // 모든 이미지 URL 합치기
    const allImageUrls = new Set();
    designImages.forEach(img => allImageUrls.add(img.url));
    themeDesigns.forEach(img => allImageUrls.add(img.url));

    console.log(`\n📥 총 ${allImageUrls.size}개의 고유한 이미지 URL 발견`);

    // 이미지 다운로드
    let downloadCount = 0;
    const imageUrlsArray = Array.from(allImageUrls);

    for (let i = 0; i < imageUrlsArray.length; i++) {
      const imageUrl = imageUrlsArray[i];
      const extension = imageUrl.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'png';
      const filename = `seongsu-gangster-${String(i + 1).padStart(2, '0')}.${extension}`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      console.log(`\n📥 [${i + 1}/${imageUrlsArray.length}] 다운로드 중: ${filename}`);
      console.log(`   URL: ${imageUrl}`);

      const success = await downloadImage(imageUrl, outputPath);
      if (success) {
        downloadCount++;
        console.log(`   ✅ 저장 완료: ${outputPath}`);
      }

      // 요청 간 딜레이
      await page.waitForTimeout(500);
    }

    // 페이지 스크린샷도 저장 (참고용)
    const screenshotPath = path.join(OUTPUT_DIR, 'page-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 페이지 스크린샷 저장: ${screenshotPath}`);

    console.log(`\n✅ 완료! 총 ${downloadCount}개의 이미지 다운로드 완료`);
    console.log(`📁 저장 위치: ${OUTPUT_DIR}`);

    // 다운로드된 파일 목록 출력
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp'));
    console.log(`\n📋 다운로드된 파일 목록:`);
    files.forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${file}`);
    });

    console.log('\n⏳ 브라우저를 10초 후에 닫습니다. (확인용)');
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

