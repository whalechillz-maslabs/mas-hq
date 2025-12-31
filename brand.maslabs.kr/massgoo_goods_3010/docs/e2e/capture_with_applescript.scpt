-- macOS AppleScript를 사용한 스크린샷 자동화
-- 사람이 하는 것처럼 자연스럽게 동작

tell application "Google Chrome Beta"
    activate
    delay 1
    
    -- 주문 상세 페이지로 이동
    tell window 1
        set URL of active tab to "https://www.marpple.com/kr/order/detail/3218372"
        delay 3
    end tell
end tell

-- 사용자에게 안내
display dialog "주문 상세 페이지가 열렸습니다. 각 주문번호의 제품 이미지를 수동으로 캡쳐해주세요." buttons {"확인"} default button "확인"






