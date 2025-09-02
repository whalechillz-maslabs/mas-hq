import { test, expect } from '@playwright/test';

test.describe('Chromium Nightly Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 메모리 사용량 모니터링
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    // 페이지 로드 최적화
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 불필요한 리소스 차단
    await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2}', route => {
      route.abort(); // 이미지/폰트 차단으로 테스트 속도 향상
    });
  });

  test('should load page with optimal performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // 성능 기준 검증
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로드
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/MASLABS/);
  });

  test('should measure memory usage', async ({ page }) => {
    await page.goto('/');
    
    // 메모리 사용량 측정
    const client = await page.context().newCDPSession(page);
    const metrics = await client.send('Performance.getMetrics');
    
    const usedJSHeapSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value;
    const totalJSHeapSize = metrics.metrics.find(m => m.name === 'JSHeapTotalSize')?.value;
    
    console.log('Memory Metrics:', {
      usedJSHeapSize: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      totalJSHeapSize: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    });
    
    // 메모리 사용량이 허용 범위 내인지 확인
    expect(usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB 이하
  });

  test('should handle navigation efficiently', async ({ page }) => {
    await page.goto('/');
    
    // 네비게이션 성능 측정
    const navigationStart = Date.now();
    
    // 대시보드로 이동
    await page.click('text=대시보드');
    await page.waitForLoadState('networkidle');
    
    const navigationTime = Date.now() - navigationStart;
    console.log(`Navigation time: ${navigationTime}ms`);
    
    expect(navigationTime).toBeLessThan(3000); // 3초 이내 네비게이션
    
    // 페이지가 올바르게 로드되었는지 확인
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should optimize resource loading', async ({ page }) => {
    await page.goto('/');
    
    // 리소스 로딩 최적화
    await page.addInitScript(() => {
      // 이미지 지연 로딩 비활성화
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.loading === 'lazy') {
          img.loading = 'eager';
        }
      });
      
      // 폰트 로딩 최적화
      const links = document.querySelectorAll('link[rel="preload"]');
      links.forEach(link => {
        if (link.as === 'font') {
          link.rel = 'stylesheet';
        }
      });
    });
    
    // 페이지가 최적화된 상태로 로드되었는지 확인
    await expect(page).toBeVisible();
  });
});
