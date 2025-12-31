# 버킷햇 가격 정보 0원 표시 문제 해결

## 문제 상황

버킷햇 페이지에서 정상판매가, 할인가, 할인율이 모두 0원/0%로 표시되는 문제

## 가능한 원인들

### 1. 마이그레이션 실행 문제 ⚠️ **가장 가능성 높음**
- `20251219000007_update_bucket_hat_specifications.sql` 마이그레이션이 실행되지 않았을 수 있음
- JSONB 필드 업데이트가 제대로 적용되지 않았을 수 있음
- 마이그레이션이 실행되었지만 WHERE 조건이 맞지 않아 업데이트가 안 되었을 수 있음

### 2. JSONB 데이터 타입 문제
- 마이그레이션에서 `'79000'::jsonb`로 저장하면 문자열로 저장됨
- JavaScript에서 `specs.normal_price`가 문자열 "79000"일 수 있음
- 하지만 `.toLocaleString()`은 문자열에도 작동하므로 이것만으로는 문제가 아닐 수 있음
- **실제 문제**: JSONB에서 숫자로 저장되어야 하는데 문자열로 저장되었을 가능성

### 3. 데이터 로딩 타이밍 문제
- 제품 데이터가 로드되기 전에 가격 정보를 표시하려고 시도
- `productsData`가 비어있거나 필터링 결과가 없을 수 있음
- `productsData.filter((p: any) => p.name === '데일리오버 버킷햇' || p.code === 'daily-over-bucket-hat')` 필터가 매칭되지 않을 수 있음

### 4. 데이터베이스 필드명 불일치
- 제품 이름이 정확히 '데일리오버 버킷햇'이 아닐 수 있음
- 제품 코드가 정확히 'daily-over-bucket-hat'이 아닐 수 있음
- WHERE 조건이 맞지 않아 업데이트가 안 되었을 수 있음

### 5. 캐싱 문제
- 브라우저 캐시 또는 Next.js 빌드 캐시 문제
- API 응답이 캐시되어 이전 데이터를 반환할 수 있음
- 서버 재시작 후에도 이전 빌드 캐시가 남아있을 수 있음

### 6. RLS (Row Level Security) 정책 문제
- Supabase RLS 정책이 SELECT를 막고 있을 수 있음
- 하지만 다른 제품 데이터는 표시되므로 이 가능성은 낮음

### 7. 코드 로직 문제
- `specs.normal_price || 0`에서 `normal_price`가 `null`, `undefined`, 또는 빈 문자열일 때 0으로 표시됨
- JSONB 필드에서 값을 읽을 때 키가 없거나 잘못된 경로로 접근했을 수 있음

## 해결 방법

### 1. 마이그레이션 재실행 확인

```bash
# 마이그레이션 상태 확인
npx supabase migration list

# 마이그레이션 재실행 (필요시)
bash scripts/auto-supabase.sh db push
```

### 2. 데이터베이스 직접 확인

```sql
-- 버킷햇 제품의 specifications 확인
SELECT 
  name,
  code,
  specifications,
  specifications->>'normal_price' as normal_price,
  specifications->>'discount_price' as discount_price,
  specifications->>'discount_rate' as discount_rate
FROM products
WHERE code = 'daily-over-bucket-hat' OR name = '데일리오버 버킷햇';
```

### 3. 마이그레이션 수정 (필요시)

현재 마이그레이션은 3개의 별도 UPDATE 문으로 나뉘어 있습니다:
- normal_price 업데이트
- discount_price 업데이트  
- discount_rate 업데이트

이를 하나의 UPDATE 문으로 통합하거나, 기존 specifications를 유지하면서 업데이트하도록 수정할 수 있습니다.

### 4. 프론트엔드 디버깅

브라우저 개발자 도구에서:
1. Network 탭에서 `/api/brand/products?category=bucket-hats` 응답 확인
2. Console에서 `productsData` 로그 확인
3. `product.specifications` 구조 확인

### 5. 코드 수정 (방어적 프로그래밍)

```typescript
// 현재 코드
const normalPrice = specs.normal_price || 0;

// 개선된 코드
const normalPrice = parseInt(specs.normal_price) || 0;
// 또는
const normalPrice = typeof specs.normal_price === 'string' 
  ? parseInt(specs.normal_price) 
  : (specs.normal_price || 0);
```

## 확인 체크리스트

- [ ] 마이그레이션이 실제로 실행되었는지 확인
- [ ] 데이터베이스에서 specifications 필드 값 확인
- [ ] API 응답에서 specifications 데이터 확인
- [ ] 브라우저 콘솔에서 에러 확인
- [ ] 네트워크 탭에서 API 응답 확인
- [ ] 서버 재시작 후 캐시 클리어

