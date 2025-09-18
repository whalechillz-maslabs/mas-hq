const { chromium } = require('playwright');

async function debugTaskForms() {
  console.log('🔍 업무 폼 디버깅 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 MASLABS 업무 페이지로 이동 중...');
    await page.goto('https://maslabs.kr/tasks');
    await page.waitForTimeout(3000);
    
    console.log('🔍 빠른 업무 입력 카드 확인 중...');
    
    // OP10 빠른 업무 입력 카드 클릭
    const op10Card = await page.locator('text=OP10').first();
    await op10Card.click();
    await page.waitForTimeout(2000);
    
    console.log('📝 빠른 업무 입력 폼 스크린샷...');
    await page.screenshot({ path: 'quick-task-form.png', fullPage: true });
    
    // 업무 분류 필드 확인
    const categoryField = await page.locator('select[name="op10Category"], select:has(option:has-text("마스골프"))').first();
    const categoryExists = await categoryField.isVisible();
    
    if (categoryExists) {
      console.log('✅ 빠른 업무 입력에 업무 분류 필드가 있습니다.');
    } else {
      console.log('❌ 빠른 업무 입력에 업무 분류 필드가 없습니다.');
    }
    
    // 폼 닫기
    const cancelButton = await page.locator('button:has-text("취소")').first();
    await cancelButton.click();
    await page.waitForTimeout(1000);
    
    console.log('🔍 업무 수정 모달 확인 중...');
    
    // 첫 번째 업무의 수정 버튼 클릭
    const editButton = await page.locator('button[title="수정"], button:has-text("수정")').first();
    await editButton.click();
    await page.waitForTimeout(2000);
    
    console.log('📝 업무 수정 폼 스크린샷...');
    await page.screenshot({ path: 'edit-task-form.png', fullPage: true });
    
    // 업무 분류 필드 확인
    const editCategoryField = await page.locator('select[name="op10Category"], select:has(option:has-text("마스골프"))').first();
    const editCategoryExists = await editCategoryField.isVisible();
    
    if (editCategoryExists) {
      console.log('✅ 업무 수정에 업무 분류 필드가 있습니다.');
    } else {
      console.log('❌ 업무 수정에 업무 분류 필드가 없습니다.');
    }
    
    // 수정 버튼 클릭해서 오류 확인
    console.log('🔧 수정 버튼 클릭하여 오류 확인...');
    const submitButton = await page.locator('button[type="submit"]:has-text("수정")').first();
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // 오류 메시지 확인
    const errorMessage = await page.locator('text=업무 수정에 실패했습니다').first();
    const hasError = await errorMessage.isVisible();
    
    if (hasError) {
      console.log('❌ 업무 수정 시 오류가 발생했습니다.');
      const errorText = await errorMessage.textContent();
      console.log('오류 내용:', errorText);
    } else {
      console.log('✅ 업무 수정이 성공했습니다.');
    }
    
    console.log('📸 최종 스크린샷...');
    await page.screenshot({ path: 'final-debug-result.png', fullPage: true });
    
    console.log('🎉 디버깅 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    console.log('⏳ 30초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

debugTaskForms().catch(console.error);
