import { test, expect } from '@playwright/test';

test.describe('DOM 구조 디버그', () => {
  test('테이블 렌더링 문제 분석', async ({ page }) => {
    console.log('🔍 DOM 구조 분석 시작');
    
    // 페이지로 이동
    await page.goto('https://maslabs.kr/admin/insert-attendance');
    await page.waitForLoadState('networkidle');
    
    // 날짜를 9월 19일로 변경
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-09-19');
    
    // 전체 조회
    const employeeSelect = page.locator('select').first();
    const statusSelect = page.locator('select').nth(1);
    const searchButton = page.locator('button:has-text("조회")');
    
    await employeeSelect.selectOption('all');
    await statusSelect.selectOption('all');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // DOM 구조 상세 분석
    const domAnalysis = await page.evaluate(() => {
      const body = document.body;
      
      // 모든 테이블 요소 찾기
      const tables = document.querySelectorAll('table');
      const tableInfo = Array.from(tables).map((table, index) => ({
        index,
        visible: table.offsetParent !== null,
        innerHTML: table.innerHTML.substring(0, 200),
        className: table.className,
        style: table.style.cssText
      }));
      
      // tbody 요소 찾기
      const tbodies = document.querySelectorAll('tbody');
      const tbodyInfo = Array.from(tbodies).map((tbody, index) => ({
        index,
        visible: tbody.offsetParent !== null,
        childCount: tbody.children.length,
        innerHTML: tbody.innerHTML.substring(0, 300)
      }));
      
      // 스케줄 관련 텍스트 찾기
      const scheduleTexts = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textNode;
      while (textNode = walker.nextNode()) {
        const text = textNode.textContent?.trim();
        if (text && (text.includes('스케줄') || text.includes('출근') || text.includes('김탁수') || text.includes('허상원'))) {
          scheduleTexts.push(text);
        }
      }
      
      // 로딩 상태 확인
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
      
      return {
        tableCount: tables.length,
        tableInfo,
        tbodyCount: tbodies.length,
        tbodyInfo,
        scheduleTexts: scheduleTexts.slice(0, 10), // 처음 10개만
        loadingElementCount: loadingElements.length,
        bodyHTML: body.innerHTML.substring(0, 1000) // 처음 1000자만
      };
    });
    
    console.log('📊 DOM 분석 결과:');
    console.log(`   테이블 개수: ${domAnalysis.tableCount}`);
    console.log(`   tbody 개수: ${domAnalysis.tbodyCount}`);
    console.log(`   로딩 요소 개수: ${domAnalysis.loadingElementCount}`);
    console.log(`   스케줄 관련 텍스트: ${JSON.stringify(domAnalysis.scheduleTexts)}`);
    
    if (domAnalysis.tableInfo.length > 0) {
      console.log('📋 테이블 정보:');
      domAnalysis.tableInfo.forEach((info, index) => {
        console.log(`   테이블 ${index}: 표시=${info.visible}, 클래스="${info.className}"`);
        console.log(`   내용: ${info.innerHTML.substring(0, 100)}...`);
      });
    }
    
    if (domAnalysis.tbodyInfo.length > 0) {
      console.log('📄 tbody 정보:');
      domAnalysis.tbodyInfo.forEach((info, index) => {
        console.log(`   tbody ${index}: 표시=${info.visible}, 자식수=${info.childCount}`);
        console.log(`   내용: ${info.innerHTML.substring(0, 100)}...`);
      });
    }
    
    // 특정 CSS 클래스나 스타일 확인
    const hiddenElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('table, tbody, tr');
      const hiddenInfo = [];
      
      elements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
          hiddenInfo.push({
            tagName: el.tagName,
            className: el.className,
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity
          });
        }
      });
      
      return hiddenInfo;
    });
    
    if (hiddenElements.length > 0) {
      console.log('🙈 숨겨진 요소들:');
      hiddenElements.forEach((info, index) => {
        console.log(`   ${info.tagName}: display=${info.display}, visibility=${info.visibility}, opacity=${info.opacity}`);
      });
    }
    
    console.log('🏁 DOM 구조 분석 완료');
  });
});
