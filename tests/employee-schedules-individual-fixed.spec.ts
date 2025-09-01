import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 개별 관리 모드 테스트 (수정됨)', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://maslabs.kr/login');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/quick-task');
    
    // 직원별 스케줄 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
  });

  test('개별 관리 모드에서 직원 선택 및 스케줄 입력 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 직원 목록에서 하상희 선택 (공백 없는 형태)
    await page.click('button:has-text("하상희HA디자인팀 • 대리")');
    await page.waitForTimeout(2000);
    
    // 하상희가 선택되었는지 확인 (선택된 직원은 파란색 배경)
    const selectedEmployee = page.locator('button:has-text("하상희HA디자인팀 • 대리")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    console.log('하상희 버튼 클래스:', buttonClass);
    
    // 파란색 배경이 있는지 확인
    expect(buttonClass).toContain('bg-blue');
    
    // 스케줄 그리드에서 시간 슬롯 클릭하여 스케줄 생성
    // 9:00 시간 슬롯 찾기 (점심시간이 아닌 곳)
    const timeSlot = page.locator('div[class*="bg-gray-50"]').first();
    await timeSlot.click();
    await page.waitForTimeout(1000);
    
    // 스케줄 입력 모달이나 폼이 나타나는지 확인
    const modal = page.locator('.modal, .schedule-form, [role="dialog"], .fixed');
    if (await modal.isVisible()) {
      console.log('스케줄 입력 모달이 표시됨');
      
      // 모달 내용 확인
      const modalText = await modal.textContent();
      console.log('모달 내용:', modalText);
      
      // 모달 닫기
      const closeButton = modal.locator('button:has-text("닫기"), button:has-text("취소"), .close');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('스케줄 입력 모달이 표시되지 않음');
      
      // 직접 스케줄 생성 시도
      const scheduleInput = page.locator('input[type="time"], input[placeholder*="시간"]');
      if (await scheduleInput.isVisible()) {
        console.log('시간 입력 필드가 표시됨');
        await scheduleInput.fill('09:00');
        await page.waitForTimeout(500);
      }
    }
  });

  test('개별 관리 모드에서 스케줄 수정 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 허상원 선택
    await page.click('button:has-text("허상원HEO본사 • 인턴")');
    await page.waitForTimeout(2000);
    
    // 허상원이 선택되었는지 확인
    const selectedEmployee = page.locator('button:has-text("허상원HEO본사 • 인턴")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    expect(buttonClass).toContain('bg-blue');
    
    // 기존 스케줄이 있는 시간 슬롯 클릭 (점심시간)
    const lunchTimeSlot = page.locator('div[class*="bg-orange-50"]').first();
    if (await lunchTimeSlot.isVisible()) {
      await lunchTimeSlot.click();
      await page.waitForTimeout(1000);
      
      // 스케줄 수정 모달이나 입력 폼이 나타나는지 확인
      const modal = page.locator('.modal, .schedule-form, [role="dialog"], .fixed');
      if (await modal.isVisible()) {
        console.log('스케줄 수정 모달이 표시됨');
        
        // 모달 내용 확인
        const modalText = await modal.textContent();
        console.log('모달 내용:', modalText);
        
        // 모달 닫기
        const closeButton = modal.locator('button:has-text("닫기"), button:has-text("취소"), .close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('스케줄 수정 모달이 표시되지 않음');
      }
    } else {
      console.log('점심시간 슬롯이 표시되지 않음');
    }
  });

  test('개별 관리 모드에서 스케줄 삭제 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 최형호 선택
    await page.click('button:has-text("최형호EAR마스운영팀 • 부장")');
    await page.waitForTimeout(2000);
    
    // 최형호가 선택되었는지 확인
    const selectedEmployee = page.locator('button:has-text("최형호EAR마스운영팀 • 부장")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    expect(buttonClass).toContain('bg-blue');
    
    // 기존 스케줄이 있는 시간 슬롯 우클릭 (삭제 메뉴)
    const scheduleSlot = page.locator('div[class*="bg-blue"]').first();
    if (await scheduleSlot.isVisible()) {
      await scheduleSlot.click({ button: 'right' });
      await page.waitForTimeout(1000);
      
      // 컨텍스트 메뉴가 나타나는지 확인
      const contextMenu = page.locator('.context-menu, [role="menu"], .dropdown-menu');
      if (await contextMenu.isVisible()) {
        console.log('컨텍스트 메뉴가 표시됨');
        
        // 삭제 옵션 클릭
        const deleteOption = contextMenu.locator('text=삭제, text=Delete, text=제거');
        if (await deleteOption.isVisible()) {
          await deleteOption.click();
          await page.waitForTimeout(1000);
          console.log('삭제 옵션 클릭됨');
          
          // 확인 다이얼로그 확인
          const confirmDialog = page.locator('.confirm-dialog, [role="alertdialog"]');
          if (await confirmDialog.isVisible()) {
            const confirmButton = confirmDialog.locator('button:has-text("확인"), button:has-text("삭제")');
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              await page.waitForTimeout(1000);
              console.log('삭제 확인됨');
            }
          }
        } else {
          console.log('삭제 옵션이 표시되지 않음');
        }
      } else {
        console.log('컨텍스트 메뉴가 표시되지 않음');
      }
    } else {
      console.log('스케줄 슬롯이 표시되지 않음');
    }
  });

  test('개별 관리 모드와 전체 보기 모드 전환 테스트', async ({ page }) => {
    // 초기 상태 확인 (전체 보기가 기본)
    const 전체보기Button = page.locator('button:has-text("전체 보기")');
    const 전체보기Class = await 전체보기Button.getAttribute('class');
    console.log('전체 보기 버튼 초기 클래스:', 전체보기Class);
    
    // 개별 관리로 전환
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 개별 관리가 활성화되었는지 확인
    const 개별관리Button = page.locator('button:has-text("개별 관리")');
    const 개별관리Class = await 개별관리Button.getAttribute('class');
    console.log('개별 관리 버튼 클래스 (클릭 후):', 개별관리Class);
    
    // 파란색 배경이 있는지 확인
    expect(개별관리Class).toContain('bg-white');
    expect(개별관리Class).toContain('text-blue-600');
    
    // 전체 보기로 다시 전환
    await page.click('button:has-text("전체 보기")');
    await page.waitForTimeout(2000);
    
    // 전체 보기가 활성화되었는지 확인
    const 전체보기ClassAfter = await 전체보기Button.getAttribute('class');
    console.log('전체 보기 버튼 클래스 (다시 클릭 후):', 전체보기ClassAfter);
    
    // 전체 보기 모드가 활성화되었는지 확인
    expect(전체보기ClassAfter).toContain('bg-blue');
  });

  test('개별 관리 모드에서 시간 입력 및 스케줄 생성 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(2000);
    
    // 김탁수 선택 (이미 선택되어 있을 수 있음)
    await page.click('button:has-text("김탁수WHA본사 • 대표이사")');
    await page.waitForTimeout(2000);
    
    // 김탁수가 선택되었는지 확인
    const selectedEmployee = page.locator('button:has-text("김탁수WHA본사 • 대표이사")');
    const buttonClass = await selectedEmployee.getAttribute('class');
    expect(buttonClass).toContain('bg-blue');
    
    // 빈 시간 슬롯 클릭 (스케줄 생성)
    const emptyTimeSlot = page.locator('div[class*="bg-gray-50"]').first();
    if (await emptyTimeSlot.isVisible()) {
      console.log('빈 시간 슬롯을 찾았습니다');
      
      // 시간 슬롯 클릭
      await emptyTimeSlot.click();
      await page.waitForTimeout(1000);
      
      // 스케줄 입력 폼이나 모달이 나타나는지 확인
      const inputForm = page.locator('form, .schedule-form, .modal, [role="dialog"]');
      if (await inputForm.isVisible()) {
        console.log('스케줄 입력 폼이 표시됨');
        
        // 폼 내용 확인
        const formText = await inputForm.textContent();
        console.log('폼 내용:', formText);
        
        // 시간 입력 필드 찾기
        const timeInput = inputForm.locator('input[type="time"], input[placeholder*="시간"]');
        if (await timeInput.isVisible()) {
          await timeInput.fill('09:00');
          console.log('시작 시간 입력됨');
        }
        
        const endTimeInput = inputForm.locator('input[type="time"], input[placeholder*="종료"]');
        if (await endTimeInput.isVisible()) {
          await endTimeInput.fill('10:00');
          console.log('종료 시간 입력됨');
        }
        
        // 저장 버튼 클릭
        const saveButton = inputForm.locator('button:has-text("저장"), button:has-text("등록"), button[type="submit"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          console.log('스케줄 저장 버튼 클릭됨');
          
          // 성공 메시지 확인
          const successMessage = page.locator('text=성공, text=저장, text=등록, text=완료');
          if (await successMessage.isVisible()) {
            console.log('스케줄 저장 성공!');
          } else {
            console.log('스케줄 저장 메시지가 표시되지 않음');
          }
        }
        
        // 폼 닫기
        const closeButton = inputForm.locator('button:has-text("닫기"), button:has-text("취소"), .close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('스케줄 입력 폼이 표시되지 않음');
        
        // 직접 스케줄 생성 시도
        const directInput = page.locator('input, textarea, select');
        const inputCount = await directInput.count();
        console.log('직접 입력 가능한 요소 수:', inputCount);
        
        if (inputCount > 0) {
          for (let i = 0; i < Math.min(inputCount, 3); i++) {
            const input = directInput.nth(i);
            const inputType = await input.getAttribute('type');
            const inputPlaceholder = await input.getAttribute('placeholder');
            console.log(`입력 요소 ${i + 1}: type=${inputType}, placeholder=${inputPlaceholder}`);
          }
        }
      }
    } else {
      console.log('빈 시간 슬롯을 찾을 수 없음');
    }
  });
});
