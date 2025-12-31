const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 마플에서 실제 맨투맨 제품을 찾는 스크립트
 * headless: false로 실행하여 사용자가 직접 확인할 수 있도록 함
 */

const OUTPUT_PATH = path.join(__dirname, '../../data/sweatshirts/top_sweatshirts.json');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: false, // 화면을 보면서 확인
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log('🧭 마플 메인 페이지 접속 중...');
    await page.goto('https://www.marpple.com/kr', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 검색창 찾기
    console.log('🔍 검색창 찾는 중...');
    await page.waitForTimeout(2000);

    // 여러 방법으로 검색 시도
    try {
      // 방법 1: 검색창에 직접 입력
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="상품"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('맨투맨');
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
        console.log('✅ 검색 실행 완료');
      } else {
        // 방법 2: 직접 검색 URL로 이동
        console.log('⚠️ 검색창을 찾지 못해 직접 검색 URL로 이동...');
        await page.goto('https://www.marpple.com/kr/search?q=맨투맨', { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
    } catch (error) {
      console.log('⚠️ 검색 중 오류, 직접 URL로 이동:', error.message);
      await page.goto('https://www.marpple.com/kr/search?q=맨투맨', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForTimeout(5000);

    console.log('📦 상품 목록에서 정보 수집 중...');
    console.log('⏳ 페이지가 완전히 로드될 때까지 기다립니다...');
    await page.waitForTimeout(5000);

    // 스크롤해서 더 많은 상품 로드
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(3000);

    // 상품 정보 수집
    const products = await page.evaluate(() => {
      const items = [];
      const seen = new Set();

      // 모든 링크 찾기
      const allLinks = Array.from(document.querySelectorAll('a[href*="/product/detail"], a[href*="bp_id="]'));
      
      console.log(`총 ${allLinks.length}개의 제품 링크 발견`);

      for (const link of allLinks) {
        const href = link.getAttribute('href');
        if (!href) continue;

        const url = href.startsWith('http') ? href : `https://www.marpple.com${href}`;
        if (seen.has(url)) continue;
        seen.add(url);

        // bp_id 추출
        const bpIdMatch = href.match(/bp_id=(\d+)/);
        if (!bpIdMatch) continue;
        const bpId = bpIdMatch[1];

        // 제품명 찾기
        let title = '';
        const card = link.closest('article, li, div[class*="product"], div[class*="card"], div[class*="item"]') || 
                     link.parentElement?.parentElement || 
                     link.parentElement;

        const titleSelectors = ['h3', 'h2', 'h4', '.title', '.product-name', '.mp_product_title', '[class*="title"]', '[class*="name"]'];
        for (const sel of titleSelectors) {
          const elem = card?.querySelector(sel);
          if (elem?.textContent?.trim()) {
            title = elem.textContent.trim();
            break;
          }
        }
        if (!title) {
          title = link.textContent?.trim() || '';
        }

        // 가격 찾기
        let price = '';
        const priceSelectors = ['.price', '.mp_product_price', '[class*="price"]', '[data-price]'];
        for (const sel of priceSelectors) {
          const elem = card?.querySelector(sel);
          if (elem?.textContent?.trim()) {
            price = elem.textContent.trim();
            break;
          }
        }

        if (title && bpId && title.length > 0) {
          items.push({
            name: title,
            url,
            bpId,
            price: price || '가격 정보 없음',
          });

          if (items.length >= 10) break; // 상위 10개만
        }
      }

      return items;
    });

    console.log(`\n📦 수집된 맨투맨 제품: ${products.length}개`);
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (bp_id: ${p.bpId})`);
      console.log(`     URL: ${p.url}`);
    });

    if (products.length === 0) {
      console.log('\n⚠️ 제품을 찾지 못했습니다. 페이지 스크린샷을 확인하세요.');
      await page.screenshot({ path: path.join(__dirname, '../../data/sweatshirts/search_page.png'), fullPage: true });
      console.log('📸 스크린샷 저장: data/sweatshirts/search_page.png');
    } else {
      // 상위 2개 제품의 상세 페이지 확인
      const top2 = products.slice(0, 2);
      const detailedProducts = [];

      for (const product of top2) {
        try {
          console.log(`\n🔍 ${product.name} 상세 페이지 확인 중...`);
          await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(4000);

          const details = await page.evaluate(() => {
            const info = {
              name: '',
              price: '',
              material: '',
              sizeRange: '',
              reviewCount: '',
              description: '',
            };

            // 제품명
            const nameSelectors = ['h1', '.product-title', '.mp_product_title', '[class*="title"]'];
            for (const sel of nameSelectors) {
              const elem = document.querySelector(sel);
              if (elem?.textContent?.trim()) {
                info.name = elem.textContent.trim();
                break;
              }
            }

            // 가격
            const priceSelectors = ['.price', '.mp_product_price', '[class*="price"]'];
            for (const sel of priceSelectors) {
              const elem = document.querySelector(sel);
              if (elem?.textContent?.trim()) {
                info.price = elem.textContent.trim();
                break;
              }
            }

            // 전체 텍스트에서 정보 추출
            const bodyText = document.body.innerText || '';

            // 소재 정보
            const materialPatterns = [
              /(면\s*\d+%|폴리[에스터]*\s*\d+%|기모|스웨트|코튼)/i,
              /(소재[:\s]*[^\n]+)/i,
            ];
            for (const pattern of materialPatterns) {
              const match = bodyText.match(pattern);
              if (match) {
                info.material = match[0].substring(0, 100);
                break;
              }
            }

            // 사이즈 범위
            const sizePatterns = [
              /([SMLX]+(?:\s*~\s*[SMLX\d]+)?)/i,
              /(XS\s*~\s*\d+XL)/i,
              /(사이즈[:\s]*[^\n]+)/i,
            ];
            for (const pattern of sizePatterns) {
              const match = bodyText.match(pattern);
              if (match) {
                info.sizeRange = match[0].substring(0, 50);
                break;
              }
            }

            // 리뷰 수
            const reviewMatch = bodyText.match(/(\d+)\s*개?\s*리뷰/i);
            if (reviewMatch) {
              info.reviewCount = reviewMatch[1];
            }

            // 설명
            const descSelectors = ['.product-description', '.description', '[class*="desc"]'];
            for (const sel of descSelectors) {
              const elem = document.querySelector(sel);
              if (elem?.textContent?.trim()) {
                info.description = elem.textContent.trim().substring(0, 200);
                break;
              }
            }

            return info;
          });

          detailedProducts.push({
            ...product,
            ...details,
          });

          console.log(`  ✅ ${product.name} 정보 수집 완료`);
        } catch (error) {
          console.log(`  ⚠️ ${product.name} 상세 페이지 확인 실패: ${error.message}`);
          detailedProducts.push(product); // 기본 정보라도 저장
        }
      }

      await ensureDir(path.dirname(OUTPUT_PATH));

      fs.writeFileSync(
        OUTPUT_PATH,
        JSON.stringify(
          {
            fetched_at: new Date().toISOString(),
            items: detailedProducts,
          },
          null,
          2,
        ),
      );

      console.log(`\n✅ 맨투맨 후보 정보 저장 완료: ${OUTPUT_PATH}`);
      console.log(`📊 총 ${detailedProducts.length}개 제품 상세 정보 수집됨`);
    }

    console.log('\n⏳ 브라우저를 30초 후에 닫습니다. (확인용)');
    await page.waitForTimeout(30000);
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




