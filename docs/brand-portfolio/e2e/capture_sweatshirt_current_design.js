/**
 * 맨투맨 현재 디자인 캡처 스크립트
 * 마플 주문 페이지에서 현재 적용된 디자인을 캡처
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = 'https://www.marpple.com/kr/product/detail?bp_id=3165&pc_id=23745530';
const outputDir = path.join(__dirname, '../../images/designs/marpple-design');
const outputFile = path.join(outputDir, 'sweatshirt-3165-current-design.png');

async function captureCurrentDesign() {
    const browser = await chromium.launch({
        headless: false, // 디자인 확인을 위해 headless false
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
        console.log(`\n📸 맨투맨 현재 디자인 캡처 시작...`);
        console.log(`   URL: ${url}`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        await page.waitForTimeout(5000);

        // 디자인 이미지 영역 찾기
        const designSelectors = [
            '.product-preview img',
            '.design-preview img',
            '.product-image img',
            'img[src*="design"]',
            'img[src*="custom"]',
            '.swiper-slide img',
            '.product-detail-image img'
        ];

        let designElement = null;
        let designSrc = null;

        for (const selector of designSelectors) {
            try {
                const elements = await page.$$(selector);
                for (const element of elements) {
                    let src = await element.getAttribute('src');
                    if (!src) {
                        src = await element.getAttribute('data-src');
                    }

                    if (src && 
                        (src.includes('http') || src.startsWith('//')) &&
                        !src.includes('logo') &&
                        !src.includes('banner') &&
                        !src.includes('icon') &&
                        (src.includes('design') || src.includes('custom') || src.includes('product'))) {
                        
                        const boundingBox = await element.boundingBox();
                        if (boundingBox && boundingBox.width >= 200 && boundingBox.height >= 200) {
                            designElement = element;
                            designSrc = src;
                            console.log(`   디자인 이미지 발견: ${src}`);
                            break;
                        }
                    }
                }
                if (designElement) break;
            } catch (e) {
                continue;
            }
        }

        // 출력 디렉토리 생성
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        if (designElement) {
            // 특정 요소 스크린샷
            await designElement.screenshot({ path: outputFile });
            console.log(`   ✅ 디자인 캡처 완료: ${outputFile}`);
        } else {
            // 전체 페이지 스크린샷 (fallback)
            await page.screenshot({ 
                path: outputFile,
                fullPage: false 
            });
            console.log(`   ⚠️ 전체 페이지 캡처: ${outputFile}`);
        }

    } catch (error) {
        console.error(`   ❌ 캡처 중 오류 발생: ${error.message}`);
    } finally {
        await browser.close();
    }
}

captureCurrentDesign();




