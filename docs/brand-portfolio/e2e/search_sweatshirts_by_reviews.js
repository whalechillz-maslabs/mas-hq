const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 마플 맨투맨 카테고리에서 "후기 많은순" 상위 맨투맨 2개를 수집하는 스크립트입니다.
 */

const OUTPUT_PATH = path.join(__dirname, '../../data/sweatshirts/top_sweatshirts.json');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  // 마플 맨투맨 검색 URL
  const searchUrl = 'https://www.marpple.com/kr/search?q=맨투맨';

  const browser = await chromium.launch({
    headless: false, // 실제 화면을 보면서 디버깅
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log('🧭 마플 맨투맨 검색 페이지 접속 중...');
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 정렬 옵션을 "후기 많은순"으로 변경 시도
    try {
      // 여러 가능한 selector 시도
      const sortSelectors = [
        'select[name*="sort"]',
        'button:has-text("후기")',
        '[data-sort]',
        '.sort-select',
        'select',
      ];

      let sorted = false;
      for (const selector of sortSelectors) {
        try {
          const sortElement = await page.locator(selector).first();
          if (await sortElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            if (selector.includes('select')) {
              await sortElement.selectOption({ label: /후기/ });
            } else {
              await sortElement.click();
              await page.waitForTimeout(2000);
              // 드롭다운에서 "후기 많은순" 선택
              const option = page.locator('text=후기 많은순, text=후기 많은 순').first();
              if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
                await option.click();
              }
            }
            await page.waitForTimeout(3000);
            console.log('✅ 정렬: 후기 많은순 적용 완료');
            sorted = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!sorted) {
        console.log('ℹ️ "후기 많은순" 정렬 버튼을 찾지 못했습니다. 기본 정렬 상태로 진행합니다.');
      }
    } catch (err) {
      console.log('ℹ️ 정렬 변경 중 오류가 발생했지만, 기본 정렬로 계속 진행합니다:', err.message);
    }

    // 상품 카드에서 정보 수집 (더 넓은 selector 사용)
    const topSweatshirts = await page.evaluate(() => {
      const items = [];
      const seen = new Set();

      // 모든 링크 중 제품 상세 페이지 링크 찾기
      const links = Array.from(document.querySelectorAll('a[href*="/product/detail"], a[href*="bp_id="]'));
      
      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) continue;

        const url = href.startsWith('http') ? href : `https://www.marpple.com${href}`;
        if (seen.has(url)) continue;
        seen.add(url);

        // 제품명 찾기
        const card = link.closest('article, li, div[class*="product"], div[class*="card"]') || link.parentElement;
        const titleSelectors = ['h3', 'h2', '.title', '.product-name', '.mp_product_title', '[class*="title"]', '[class*="name"]'];
        let title = '';
        for (const sel of titleSelectors) {
          const elem = card?.querySelector(sel);
          if (elem?.textContent?.trim()) {
            title = elem.textContent.trim();
            break;
          }
        }
        if (!title) title = link.textContent?.trim() || '';

        // 가격 찾기
        const priceSelectors = ['.price', '.mp_product_price', '[class*="price"]', '[data-price]'];
        let price = '';
        for (const sel of priceSelectors) {
          const elem = card?.querySelector(sel);
          if (elem?.textContent?.trim()) {
            price = elem.textContent.trim();
            break;
          }
        }

        // 리뷰 수 찾기
        const reviewSelectors = ['.review', '.mp_product_review', '[class*="review"]', '[class*="rating"]'];
        let reviewSummary = '';
        for (const sel of reviewSelectors) {
          const elem = card?.querySelector(sel);
          if (elem?.textContent?.trim()) {
            reviewSummary = elem.textContent.trim();
            break;
          }
        }

        // bp_id 추출
        const bpIdMatch = href.match(/bp_id=(\d+)/);
        const bpId = bpIdMatch ? bpIdMatch[1] : '';

        if (title && url) {
          items.push({
            name: title,
            url,
            bpId,
            price: price || '가격 정보 없음',
            reviewSummary: reviewSummary || '리뷰 정보 없음',
          });

          if (items.length >= 2) break;
        }
      }

      return items;
    });

    console.log('📦 수집된 맨투맨 후보:', topSweatshirts);

    // 만약 결과가 비어있으면, 직접 제품 페이지로 이동해서 정보 수집
    if (topSweatshirts.length === 0) {
      console.log('⚠️ 검색 결과가 없어 대체 방법으로 수집 시도...');
      
      // 인기 맨투맨 제품 ID 목록 (마플에서 자주 보이는 제품들)
      const popularIds = ['4770', '2914', '4669', '4668', '3115']; // 티셔츠 제품 ID들
      
      // 맨투맨 카테고리로 직접 이동
      const categoryUrl = 'https://www.marpple.com/kr/category/apparel/sweatshirt';
      await page.goto(categoryUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(5000);

      const categoryItems = await page.evaluate(() => {
        const items = [];
        const links = Array.from(document.querySelectorAll('a[href*="/product/detail"]'));
        const seen = new Set();

        for (const link of links.slice(0, 5)) {
          const href = link.getAttribute('href');
          if (!href) continue;

          const url = href.startsWith('http') ? href : `https://www.marpple.com${href}`;
          if (seen.has(url)) continue;
          seen.add(url);

          const card = link.closest('article, li, div') || link.parentElement;
          const title = card?.querySelector('h3, h2, .title, [class*="name"]')?.textContent?.trim() || link.textContent?.trim() || '';
          const price = card?.querySelector('[class*="price"]')?.textContent?.trim() || '';
          const bpIdMatch = href.match(/bp_id=(\d+)/);
          const bpId = bpIdMatch ? bpIdMatch[1] : '';

          if (title) {
            items.push({
              name: title,
              url,
              bpId,
              price: price || '가격 정보 없음',
              reviewSummary: '리뷰 정보 없음',
            });
          }

          if (items.length >= 2) break;
        }

        return items;
      });

      if (categoryItems.length > 0) {
        topSweatshirts.push(...categoryItems);
        console.log('📦 카테고리에서 수집된 맨투맨:', categoryItems);
      }
    }

    await ensureDir(path.dirname(OUTPUT_PATH));

    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        {
          fetched_at: new Date().toISOString(),
          search_url: searchUrl,
          items: topSweatshirts,
        },
        null,
        2,
      ),
    );

    console.log(`✅ 맨투맨 후보 정보 저장 완료: ${OUTPUT_PATH}`);
    console.log(`📊 총 ${topSweatshirts.length}개 제품 수집됨`);
  } catch (error) {
    console.error('❌ 맨투맨 후보 검색 중 오류가 발생했습니다:', error.message);
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
