# 브랜드 포트폴리오 데이터베이스화 계획

## 📋 현재 상황 분석

### 문제점
1. **하드코딩된 샘플 데이터**: 현재 "진행 상황"과 "브랜드" 탭에만 하드코딩된 샘플 데이터가 표시됨
2. **데이터베이스 연동 없음**: 실제 데이터베이스와 연동되지 않아 동적 데이터 표시 불가
3. **나머지 탭 빈 상태**: 상품소싱, 디자인 빌드업, 업체 조사 탭은 완전히 비어있음
4. **원본 데이터 미통합**: `product_comparison.html`의 약 6,000줄 데이터가 아직 통합되지 않음

### 현재 표시되는 내용
- ✅ **진행 상황 탭**: 하드코딩된 샘플 주문 정보 (47개 주문, 4건 완료, 1건 진행중)
- ✅ **브랜드 탭**: 하드코딩된 6개 브랜드 정보
- ❌ **상품소싱 탭**: 빈 상태
- ❌ **디자인 빌드업 탭**: 빈 상태
- ❌ **업체 조사 탭**: 빈 상태

---

## 🗄️ 데이터베이스화할 항목

### 1. 브랜드 (Brands)
**테이블명**: `brands`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| name | VARCHAR(100) | 브랜드명 | MASSGOO, SINGSING, TOBY |
| code | VARCHAR(20) | 브랜드 코드 | MASSGOO, SINGSING, TOBY |
| description | TEXT | 브랜드 설명 | 메인 브랜드, 골프 굿즈 제작 |
| brand_type | VARCHAR(50) | 브랜드 유형 | main, secondary, character, collab |
| parent_brand_id | UUID | 부모 브랜드 ID | SECRET WEAPON의 경우 MASSGOO |
| logo_path | TEXT | 로고 파일 경로 | /assets/logos/web/massgoo_text-logo_black.webp |
| is_active | BOOLEAN | 활성화 여부 | true |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

**초기 데이터**:
- MASSGOO (메인 브랜드)
- SINGSING (골프 브랜드)
- TOBY (캐릭터 브랜드)
- MUZIIK (콜라보 파트너)
- SECRET WEAPON (MASSGOO 2차 브랜드)
- SECRET FORCE (MASSGOO 2차 브랜드)

---

### 2. 제품 카테고리 (Product Categories)
**테이블명**: `product_categories`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| name | VARCHAR(100) | 카테고리명 | 볼캡, 버킷햇, 클러치백 |
| code | VARCHAR(20) | 카테고리 코드 | ball-caps, bucket-hats, pouches |
| description | TEXT | 카테고리 설명 | - |
| display_order | INTEGER | 표시 순서 | 1, 2, 3... |
| is_active | BOOLEAN | 활성화 여부 | true |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

**초기 데이터**:
- 볼캡 (Ball Caps)
- 버킷햇 (Bucket Hats)
- 클러치백 (Pouches)
- 티셔츠 (T-shirts)
- 맨투맨 (Sweatshirts)

---

### 3. 제품 (Products)
**테이블명**: `products`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| brand_id | UUID | 브랜드 ID | MASSGOO의 UUID |
| category_id | UUID | 카테고리 ID | 볼캡의 UUID |
| name | VARCHAR(255) | 제품명 | 베이직 볼캡, 데일리오버 버킷햇 |
| code | VARCHAR(50) | 제품 코드 | basic-cap, daily-over-bucket-hat |
| description | TEXT | 제품 설명 | - |
| base_price | INTEGER | 기본 가격 | 20000 |
| embroidery_price | INTEGER | 자수비 | 15000 |
| print_price | INTEGER | 인쇄비 | 5000 |
| image_path | TEXT | 대표 이미지 경로 | /images/products/ball-caps/... |
| specifications | JSONB | 제품 스펙 | {"size": "Free", "color": ["navy", "black"]} |
| is_active | BOOLEAN | 활성화 여부 | true |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

---

### 4. 주문 (Orders)
**테이블명**: `brand_orders`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| order_number | VARCHAR(50) | 주문번호 | 3218372, 3219110 |
| brand_id | UUID | 브랜드 ID | - |
| product_id | UUID | 제품 ID | - |
| order_date | DATE | 주문일 | 2025-11-15 |
| delivery_date | DATE | 배송일 | 2025-12-06 |
| status | VARCHAR(20) | 주문 상태 | completed, in_progress, preparing |
| quantity | INTEGER | 수량 | 20, 10, 4 |
| product_price | INTEGER | 상품 금액 | 405400, 256000 |
| embroidery_fee | INTEGER | 자수비 | 150000, 0 |
| total_amount | INTEGER | 총 금액 | 405400, 256000 |
| final_amount | INTEGER | 최종 결제 금액 | 405400, 256000 |
| order_details | JSONB | 주문 상세 | {"colors": {"navy": 5, "black": 5}, "embroidery": "MASSGOO × MUZIIK"} |
| notes | TEXT | 메모 | - |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

**주문 상태 값**:
- `preparing`: 제작 준비중
- `in_progress`: 제작 중
- `completed`: 배송 완료
- `cancelled`: 취소됨

---

### 5. 업체 (Suppliers)
**테이블명**: `suppliers`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| name | VARCHAR(100) | 업체명 | 마플 (MARPPLE) |
| code | VARCHAR(20) | 업체 코드 | MARPPLE |
| description | TEXT | 업체 설명 | 주요 제작 파트너 |
| website_url | TEXT | 웹사이트 URL | https://marpple.com |
| api_available | BOOLEAN | API 연동 가능 여부 | true |
| min_order_quantity | INTEGER | 최소 주문 수량 | 1 |
| contact_info | JSONB | 연락처 정보 | {"email": "...", "phone": "..."} |
| product_categories | JSONB | 지원 제품 카테고리 | ["ball-caps", "bucket-hats"] |
| is_active | BOOLEAN | 활성화 여부 | true |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

**초기 데이터**:
- 마플 (MARPPLE): 주요 제작 파트너, 1개부터 주문 가능, API 연동 가능

---

### 6. 상품소싱 (Product Sourcing)
**테이블명**: `product_sourcing`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| supplier_id | UUID | 업체 ID | 마플의 UUID |
| product_category_id | UUID | 제품 카테고리 ID | - |
| product_name | VARCHAR(255) | 제품명 | - |
| product_code | VARCHAR(100) | 업체 제품 코드 | - |
| price | INTEGER | 가격 | - |
| specifications | JSONB | 제품 스펙 | {"size": "...", "color": "...", "material": "..."} |
| size_guide | JSONB | 사이즈 가이드 | - |
| image_path | TEXT | 이미지 경로 | /images/products/ball-caps/marpple/... |
| recommendation_score | INTEGER | 추천 점수 | 1-10 |
| notes | TEXT | 메모 | - |
| is_active | BOOLEAN | 활성화 여부 | true |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

---

### 7. 디자인 (Designs)
**테이블명**: `product_designs`

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | UUID | 기본키 | - |
| product_id | UUID | 제품 ID | - |
| brand_id | UUID | 브랜드 ID | - |
| design_name | VARCHAR(255) | 디자인명 | - |
| logo_placement | JSONB | 로고 배치 정보 | {"front": "...", "back": "..."} |
| color_combination | JSONB | 색상 조합 | {"primary": "#000000", "secondary": "#FFFFFF"} |
| color_codes | JSONB | 실컬러코드 | {"thread": "#123456"} |
| specifications | JSONB | 제작 스펙 | {"embroidery": "...", "print": "..."} |
| design_image_path | TEXT | 디자인 이미지 경로 | - |
| sketch_image_path | TEXT | 스케치 이미지 경로 | - |
| final_image_path | TEXT | 최종 이미지 경로 | - |
| status | VARCHAR(20) | 디자인 상태 | draft, approved, final |
| created_at | TIMESTAMP | 생성일시 | - |
| updated_at | TIMESTAMP | 수정일시 | - |

---

## 📊 데이터베이스 스키마 설계

### ERD 관계도
```
brands (1) ──< (N) products
brands (1) ──< (N) brand_orders
product_categories (1) ──< (N) products
product_categories (1) ──< (N) product_sourcing
products (1) ──< (N) brand_orders
products (1) ──< (N) product_designs
suppliers (1) ──< (N) product_sourcing
```

### 인덱스 설계
```sql
-- brands
CREATE INDEX idx_brands_code ON brands(code);
CREATE INDEX idx_brands_type ON brands(brand_type);

-- products
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_code ON products(code);

-- brand_orders
CREATE INDEX idx_orders_brand ON brand_orders(brand_id);
CREATE INDEX idx_orders_product ON brand_orders(product_id);
CREATE INDEX idx_orders_status ON brand_orders(status);
CREATE INDEX idx_orders_date ON brand_orders(order_date);

-- product_sourcing
CREATE INDEX idx_sourcing_supplier ON product_sourcing(supplier_id);
CREATE INDEX idx_sourcing_category ON product_sourcing(product_category_id);

-- product_designs
CREATE INDEX idx_designs_product ON product_designs(product_id);
CREATE INDEX idx_designs_brand ON product_designs(brand_id);
```

---

## 🎯 구현 우선순위

### 우선순위 1 (필수)
1. ✅ 브랜드 테이블 및 초기 데이터
2. ✅ 제품 카테고리 테이블 및 초기 데이터
3. ✅ 주문 테이블 및 기존 주문 데이터 마이그레이션
4. ✅ 진행 상황 탭 데이터 연동

### 우선순위 2 (중요)
1. 제품 테이블 및 데이터
2. 브랜드 탭 데이터 연동
3. 업체 테이블 및 초기 데이터
4. 업체 조사 탭 기본 구현

### 우선순위 3 (보통)
1. 상품소싱 테이블 및 데이터
2. 상품소싱 탭 구현
3. 디자인 테이블 및 데이터
4. 디자인 빌드업 탭 구현

---

## 📅 예상 일정

| 단계 | 작업 | 예상 기간 | 담당 |
|------|------|----------|------|
| Phase 1 | DB 스키마 생성 | 1일 | 개발자 |
| Phase 2 | 데이터 마이그레이션 | 2-3일 | 개발자 |
| Phase 3 | API 및 컴포넌트 개발 | 3-4일 | 개발자 |
| Phase 4 | 이미지 마이그레이션 | 1일 | 개발자 |
| Phase 5 | 테스트 및 최적화 | 1-2일 | 개발자 |
| **총계** | | **8-11일** | |

---

## ✅ 체크리스트

### 데이터베이스
- [ ] brands 테이블 생성
- [ ] product_categories 테이블 생성
- [ ] products 테이블 생성
- [ ] brand_orders 테이블 생성
- [ ] suppliers 테이블 생성
- [ ] product_sourcing 테이블 생성
- [ ] product_designs 테이블 생성
- [ ] 초기 마스터 데이터 입력

### 데이터 마이그레이션
- [ ] 기존 주문 데이터 입력 (47개)
- [ ] 제품 데이터 입력
- [ ] 상품소싱 데이터 입력
- [ ] 디자인 데이터 입력

### 프론트엔드
- [ ] API 라우트 생성
- [ ] 진행 상황 탭 데이터 연동
- [ ] 브랜드 탭 데이터 연동
- [ ] 상품소싱 탭 구현
- [ ] 디자인 빌드업 탭 구현
- [ ] 업체 조사 탭 구현

### 이미지 및 자산
- [ ] assets 폴더 이동
- [ ] images 폴더 이동
- [ ] 이미지 경로 업데이트

---

**작성일**: 2025-12-19  
**작성자**: AI Assistant  
**상태**: 계획 완료, 구현 진행 중

