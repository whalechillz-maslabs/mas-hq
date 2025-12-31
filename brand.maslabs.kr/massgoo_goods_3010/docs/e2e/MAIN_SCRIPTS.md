# 주요 스크립트 파일 목록

## 핵심 스크립트 (Core Scripts)

### 리뷰 이미지 캡처

#### 1. `capture_beige_cap_reviews.js`
- **제품**: 베이직 볼캡 (2976)
- **기능**: 썸네일 1개 + 리뷰 이미지 10개
- **실행**: `npm run capture:beige-reviews`
- **출력**: PNG 형식

#### 2. `capture_5801_beige_reviews.js`
- **제품**: 엣지 라인 베이직 볼캡 (5801)
- **기능**: 리뷰 이미지 6개
- **실행**: `npm run capture:5801-beige-reviews`
- **출력**: WEBP 형식

#### 3. `capture_7125_review.js`
- **제품**: 베이직 야구모자 (대량형) (7125)
- **기능**: 리뷰 이미지 1개
- **실행**: `npm run capture:7125-review`
- **출력**: WEBP 형식

#### 4. `capture_3080_reviews.js`
- **제품**: 베이직 야구모자 (단품) (3080)
- **기능**: 리뷰 이미지 최대 20개
- **실행**: `npm run capture:3080-reviews`
- **출력**: WEBP 형식

#### 5. `capture_2891_reviews.js`
- **제품**: 캐주얼 볼캡 (2891)
- **기능**: 리뷰 이미지 최대 20개
- **실행**: `npm run capture:2891-reviews`
- **출력**: WEBP 형식

### 제품 이미지 캡처

#### 6. `capture_cap_product_images.js`
- **기능**: 각 모자 제품의 메인 이미지, 썸네일, 크롭 이미지 캡처
- **실행**: `npm run capture:cap-products`
- **대상**: 5801, 7125, 3080, 2891

## 유틸리티 스크립트 (Utility Scripts)

### 이미지 변환

#### 7. `convert_5801_reviews_to_webp.js`
- **기능**: PNG 리뷰 이미지를 WEBP로 변환
- **실행**: `npm run convert:5801-reviews`
- **대상**: caps-5801-beige-review-1.png ~ 6.png

### 이미지 크롭

#### 8. `crop_images.js`
- **기능**: 수동 캡처한 이미지를 크롭하여 저장
- **실행**: `npm run crop:images`

### 로고 변환

#### 9. `convert_logo_to_png.js`
- **기능**: AI 로고 파일을 PNG로 변환
- **실행**: `npm run convert:logos`

## 레거시 스크립트 (Legacy Scripts)

### 10. `capture_marpple_images.js`
- **기능**: 마플 제품 이미지 캡처 (초기 버전)
- **상태**: 레거시, 새로운 스크립트로 대체됨

### 11. `capture_design_files.js`
- **기능**: 디자인 파일 캡처
- **상태**: 레거시

### 12. `capture_cap_designs_by_color.js`
- **기능**: 색상별 모자 디자인 캡처
- **상태**: 레거시

### 13. `capture_order_items.js`
- **기능**: 주문 상세 페이지에서 제품 캡처
- **상태**: 레거시 (로그인 문제로 수동 캡처로 대체)

### 14. `simple_capture.js`
- **기능**: 간단한 캡처 테스트
- **상태**: 테스트용

## 스크립트 공통 패턴

모든 리뷰 이미지 캡처 스크립트는 다음 패턴을 따릅니다:

1. **Self-Adaptive 이미지 찾기**: 다중 선택자 전략
2. **중복 제거**: URL base 기준
3. **크기 필터링**: 최소 200x200px
4. **WEBP 변환**: PNG → WEBP 자동 변환
5. **에러 복구**: 실패해도 계속 진행

## 실행 순서 권장사항

```bash
# 1. 제품 메인 이미지 캡처
npm run capture:cap-products

# 2. 각 제품별 리뷰 이미지 캡처
npm run capture:beige-reviews
npm run capture:5801-beige-reviews
npm run capture:7125-review
npm run capture:3080-reviews
npm run capture:2891-reviews

# 3. 필요시 이미지 변환
npm run convert:5801-reviews
```

## 파일 구조

```
docs/e2e/
├── README.md                          # 전체 가이드
├── SCRIPTS_GUIDE.md                   # 스크립트 작성 가이드
├── MAIN_SCRIPTS.md                    # 주요 스크립트 목록 (이 파일)
├── capture_beige_cap_reviews.js       # 베이직 볼캡 리뷰
├── capture_5801_beige_reviews.js      # 엣지 라인 베이직 볼캡 리뷰
├── capture_7125_review.js             # 베이직 야구모자 (대량형) 리뷰
├── capture_3080_reviews.js            # 베이직 야구모자 (단품) 리뷰
├── capture_2891_reviews.js            # 캐주얼 볼캡 리뷰
├── capture_cap_product_images.js       # 제품 이미지 캡처
├── convert_5801_reviews_to_webp.js    # 이미지 변환
├── crop_images.js                     # 이미지 크롭
└── convert_logo_to_png.js             # 로고 변환
```






