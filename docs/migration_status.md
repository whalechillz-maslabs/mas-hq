# 마이그레이션 상태 확인

## 현재까지 생성된 마이그레이션 파일 목록

### 브랜드 포트폴리오 관련 마이그레이션 (2025-12-19)

1. **20251219000000_create_brand_portfolio_tables.sql**
   - 테이블 생성: brands, product_categories, products, brand_orders, suppliers, product_sourcing, product_designs
   - RLS 정책 설정
   - 초기 브랜드, 카테고리, 업체 데이터 입력

2. **20251219000001_insert_brand_orders_data.sql**
   - 주문 데이터 입력

3. **20251219000002_insert_products_data.sql**
   - 제품 데이터 입력

4. **20251219000003_update_orders_with_products.sql**
   - 주문과 제품 연결 업데이트

5. **20251219000004_fix_orders_embroidery_fee.sql**
   - 자수비 수정

6. **20251219000005_insert_products_fixed.sql**
   - 제품 데이터 재입력 (수정본)

7. **20251219000006_insert_product_sourcing_data.sql**
   - 상품소싱 데이터 입력

8. **20251219000007_update_bucket_hat_specifications.sql**
   - 버킷햇 specifications 업데이트

9. **20251219000008_update_all_products_specifications.sql**
   - 모든 제품 specifications 업데이트 (가격 정보 추가)
   - 가죽 클러치백: 정가 89,000원, 할인가 59,000원 (34% 할인)
   - 페어플레이 더블코튼 무지 티셔츠: 정가 79,000원, 할인가 49,000원 (38% 할인)
   - 특양면 헤리 맨투맨: 정가 89,000원, 할인가 59,000원 (34% 할인)

## 마이그레이션 실행 방법

### 원격 데이터베이스에 적용

```bash
# 방법 1: 자동 스크립트 사용
npm run db:push

# 방법 2: 직접 실행
bash scripts/auto-supabase.sh db push
```

### 마이그레이션 상태 확인

```bash
# 원격 마이그레이션 목록 확인 (비밀번호 필요)
npx supabase migration list

# 로컬 마이그레이션 목록 확인 (로컬 Supabase 실행 필요)
npx supabase migration list --local
```

## 마이그레이션 실행 상태

### ✅ 확인 완료 (2025-12-19)

**원격 데이터베이스 마이그레이션 상태:**
- 마이그레이션 파일 모두 적용 완료
- 원격 데이터베이스 최신 상태 확인: `Remote database is up to date`

### 현재 문제점

1. **로컬 Supabase 미실행**: 로컬 데이터베이스가 실행되지 않아 로컬 마이그레이션 확인 불가
2. **원격 연결 비밀번호 필요**: 원격 마이그레이션 상태 확인 시 비밀번호 입력 필요
3. **데이터 표시 문제**: `/admin/brand` 페이지에서 데이터가 표시되지 않는 문제 가능성

## 다음 단계

1. ✅ 원격 데이터베이스에 마이그레이션 적용 확인 (완료)
2. 🔄 `/admin/brand` 페이지에서 데이터 표시 확인 필요
3. 🔄 API 엔드포인트 테스트 필요 (`/api/brand/dashboard`, `/api/brand/orders` 등)
4. 🔄 브라우저 콘솔에서 에러 확인 필요
5. 🔄 네트워크 탭에서 API 응답 확인 필요

## 문제 해결 체크리스트

- [ ] 브라우저 개발자 도구 콘솔에서 에러 확인
- [ ] 네트워크 탭에서 `/api/brand/dashboard` API 응답 확인
- [ ] Supabase RLS 정책이 올바르게 설정되었는지 확인
- [ ] 환경 변수 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) 확인

