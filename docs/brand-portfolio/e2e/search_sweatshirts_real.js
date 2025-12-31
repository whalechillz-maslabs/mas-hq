const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 마플에서 실제 존재하는 맨투맨 제품을 검색하는 스크립트
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
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log('🧭 마플 메인 페이지 접속 중...');
    await page.goto('https://www.marpple.com/kr', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 검색창에 "맨투맨" 입력
    console.log('🔍 맨투맨 검색 중...');
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="검색"]',
      'input[name*="search"]',
      '.search-input',
      '#search',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          searchInput = input;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (searchInput) {
      await searchInput.fill('맨투맨');
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    } else {
      // 직접 검색 URL로 이동
      console.log('⚠️ 검색창을 찾지 못해 직접 검색 URL로 이동...');
      await page.goto('https://www.marpple.com/kr/search?q=맨투맨', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);
    }

    console.log('📦 상품 목록에서 정보 수집 중...');
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: path.join(__dirname, '../../data/sweatshirts/search_result.png'), fullPage: true });

    // 상품 정보 수집
    const products = await page.evaluate(() => {
      const items = [];
      const seen = new Set();

      // 모든 링크 중 제품 상세 페이지 링크 찾기
      const allLinks = Array.from(document.querySelectorAll('a'));
      
      for (const link of allLinks) {
        const href = link.getAttribute('href');
        if (!href) continue;

        // 제품 상세 페이지 링크인지 확인
        if (!href.includes('/product/detail') && !href.includes('bp_id=')) continue;

        const url = href.startsWith('http') ? href : `https://www.marpple.com${href}`;
        if (seen.has(url)) continue;
        seen.add(url);

        // bp_id 추출
        const bpIdMatch = href.match(/bp_id=(\d+)/);
        if (!bpIdMatch) continue;
        const bpId = bpIdMatch[1];

        // 제품명 찾기
        const card = link.closest('article, li, div[class*="product"], div[class*="card"], div[class*="item"]') || link.parentElement?.parentElement;
        
        let title = '';
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

        // 리뷰 정보 찾기
        let reviewInfo = '';
        const reviewSelectors = ['.review', '.mp_product_review', '[class*="review"]', '[class*="rating"]'];
        for (const sel of reviewSelectors) {
          const elem = card?.querySelector(sel);
          if (elem?.textContent?.trim()) {
            reviewInfo = elem.textContent.trim();
            break;
          }
        }

        if (title && bpId) {
          items.push({
            name: title,
            url,
            bpId,
            price: price || '가격 정보 없음',
            reviewInfo: reviewInfo || '리뷰 정보 없음',
          });

          if (items.length >= 5) break; // 상위 5개만
        }
      }

      return items;
    });

    console.log(`📦 수집된 맨투맨 제품: ${products.length}개`);
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (bp_id: ${p.bpId})`);
    });

    // 상위 2개만 선택
    const top2 = products.slice(0, 2);

    // 각 제품의 상세 페이지로 이동해서 정보 확인
    const detailedProducts = [];
    for (const product of top2) {
      try {
        console.log(`\n🔍 ${product.name} 상세 페이지 확인 중...`);
        await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        const details = await page.evaluate(() => {
          const info = {
            name: '',
            price: '',
            material: '',
            sizeRange: '',
            reviewCount: '',
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

          // 소재 정보
          const materialText = document.body.innerText;
          const materialMatch = materialText.match(/(면\s*\d+%|폴리[에스터]*\s*\d+%|기모|스웨트)/i);
          if (materialMatch) {
            info.material = materialMatch[0];
          }

          // 사이즈 범위
          const sizeMatch = materialText.match(/([SMLX]+(?:\s*~\s*[SMLX\d]+)?|XS\s*~\s*\d+XL)/i);
          if (sizeMatch) {
            info.sizeRange = sizeMatch[0];
          }

          // 리뷰 수
          const reviewMatch = materialText.match(/(\d+)\s*개?\s*리뷰/i);
          if (reviewMatch) {
            info.reviewCount = reviewMatch[1];
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
    console.log(`📊 총 ${detailedProducts.length}개 제품 수집됨`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n⏳ 브라우저를 10초 후에 닫습니다. (확인용)');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}




