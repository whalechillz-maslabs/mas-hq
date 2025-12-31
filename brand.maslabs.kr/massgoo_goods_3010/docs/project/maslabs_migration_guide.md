# MAS Brand Labs 마이그레이션 가이드

## 마이그레이션 정보
- **마이그레이션 일자**: 2025-12-19
- **대상 시스템**: maslabs.kr
- **목적 경로**: `maslabs.kr/brand` 또는 `maslabs.kr/admin/brand`
- **원본 폴더**: `massgoo_goods_3010`

## 프로젝트 개요

### 프로젝트명
MAS Brand Labs - 브랜드 포트폴리오 관리 시스템

### 주요 기능
1. **진행 상황 추적**: 굿즈 제작 진행 현황 및 주문 관리
2. **상품소싱**: 마플 등 업체 제품 비교 및 분석
3. **디자인 빌드업**: 제품별 디자인 시안 및 최종 스펙 관리
4. **브랜드 포트폴리오**: MASSGOO, SINGSING, TOBY, MUZIIK, SECRET WEAPON, SECRET FORCE 브랜드 관리
5. **업체 조사**: 제작 업체 분석 및 비교

### 현재 URL
- 로컬: `http://localhost:3010/product_comparison.html`
- 파일: `massgoo_goods_3010/product_comparison.html`

## 폴더 구조

```
massgoo_goods_3010/
├── assets/                    # 브랜드 자산 (중요!)
│   ├── logos/                 # 로고 파일
│   │   ├── sources/          # 원본 파일 (.ai, .pdf, .svg)
│   │   │   ├── massgoo/      # MASSGOO 로고 원본
│   │   │   ├── muziik/       # MUZIIK 로고 원본
│   │   │   ├── secret/       # SECRET 시리즈 로고
│   │   │   └── singsing/     # SINGSING 로고
│   │   └── web/              # 웹용 파일 (.webp)
│   ├── characters/            # 캐릭터 자산
│   │   └── toby/             # TOBY 캐릭터 (Toto, Bibi)
│   │       ├── drafts/       # 초안 이미지
│   │       ├── final/        # 최종 캐릭터 이미지
│   │       ├── sketches/    # 스케치 이미지
│   │       └── variations/   # 변형 이미지
│   └── data/                 # 데이터 파일
│       ├── reviews/          # 리뷰 데이터 (JSON)
│       └── sweatshirts/      # 맨투맨 검색 결과
│
├── images/                    # 제품 이미지 (중요!)
│   ├── products/            # 제품별 이미지
│   │   ├── ball-caps/       # 볼캡
│   │   │   ├── marpple/     # 마플 제품 이미지 (67개)
│   │   │   └── photos/      # 실제 제품 사진 (4개)
│   │   ├── bucket-hats/      # 버킷햇
│   │   │   ├── marpple/     # 마플 제품 이미지 (12개)
│   │   │   └── photos/      # 실제 제품 사진 (2개)
│   │   ├── pouches/          # 클러치백
│   │   │   ├── elements/    # 제작 요소 (4개)
│   │   │   ├── marpple/     # 마플 제품 이미지 (10개)
│   │   │   ├── photos/      # 실제 제품 사진 (4개)
│   │   │   └── sketches/    # 스케치 (4개)
│   │   ├── sweatshirts/      # 맨투맨
│   │   │   ├── marpple/     # 마플 제품 이미지 (2개)
│   │   │   └── photos/      # 실제 제품 사진 (3개)
│   │   └── t-shirts/         # 티셔츠
│   │       ├── marpple/     # 마플 제품 이미지 (106개)
│   │       └── photos/      # 실제 제품 사진 (1개)
│   └── references/           # 참고 자료
│       └── marpple-thread-color.jpg
│
├── docs/                      # 프로젝트 문서
│   ├── e2e/                  # 자동화 스크립트 (30개+)
│   ├── guides/               # 가이드 문서
│   ├── products/             # 제품별 문서
│   ├── project/               # 프로젝트 관리 문서
│   └── suppliers/            # 업체 조사 문서
│
├── product_comparison.html    # 메인 HTML 파일 (6,000줄+)
├── package.json              # 프로젝트 설정
├── package-lock.json         # 의존성 잠금 파일
└── start.sh                  # 로컬 서버 시작 스크립트
```

## 주요 파일 설명

### 1. product_comparison.html
- **용도**: 브랜드 포트폴리오 메인 페이지
- **크기**: 약 6,000줄 이상
- **기능**:
  - 진행 상황 대시보드
  - 상품소싱 비교
  - 디자인 빌드업
  - 브랜드 포트폴리오
  - 업체 조사
- **마이그레이션 시**: Next.js React 컴포넌트로 변환 필요

### 2. assets/ 폴더
- **중요도**: ⭐⭐⭐⭐⭐ (필수)
- **내용**: 로고, 캐릭터, 데이터 파일
- **파일 수**: 
  - 로고: 약 20개+ (원본 + 웹용)
  - 캐릭터: 약 60개+ (TOBY 관련)
  - 데이터: JSON 파일들
- **마이그레이션 시**: `maslabs.kr/public/assets/`로 이동

### 3. images/ 폴더
- **중요도**: ⭐⭐⭐⭐⭐ (필수)
- **내용**: 제품 이미지, 마플 캡처, 실제 제품 사진
- **파일 수**: 약 200개+
- **마이그레이션 시**: `maslabs.kr/public/images/`로 이동

### 4. docs/ 폴더
- **중요도**: ⭐⭐⭐⭐ (보관 권장)
- **내용**: 프로젝트 문서, 가이드, 스크립트
- **파일 수**: 약 50개+
- **마이그레이션 시**: `maslabs.kr/docs/brand-portfolio/`로 이동 또는 보관

## 마이그레이션 체크리스트

### 필수 작업
- [ ] `assets/` 폴더 → `maslabs.kr/public/assets/` 이동
- [ ] `images/` 폴더 → `maslabs.kr/public/images/` 이동
- [ ] `product_comparison.html` → `maslabs.kr/pages/brand.tsx` 변환
- [ ] 이미지 경로 수정: `assets/` → `/assets/`, `images/` → `/images/`
- [ ] 인증 시스템 통합 (maslabs.kr 인증 사용)

### 선택 작업
- [ ] `docs/` 폴더 보관 (프로젝트 히스토리)
- [ ] `node_modules/` 제외 (재설치 가능)
- [ ] `package.json` 참고용 보관

## maslabs.kr 통합 방법

### 옵션 1: React 컴포넌트로 변환 (권장)
```
maslabs.kr/
├── pages/
│   └── brand.tsx              # 메인 브랜드 포트폴리오 페이지
├── public/
│   ├── assets/                # assets/ 폴더 이동
│   └── images/                # images/ 폴더 이동
└── components/
    └── brand/                 # 브랜드 관련 컴포넌트
        ├── BrandDashboard.tsx
        ├── ProgressTab.tsx
        ├── SourcingTab.tsx
        ├── DesignTab.tsx
        ├── BrandTab.tsx
        └── SupplierTab.tsx
```

### 옵션 2: 정적 HTML 파일로 서빙
```
maslabs.kr/
├── public/
│   ├── brand.html             # product_comparison.html 이동
│   ├── assets/                # assets/ 폴더 이동
│   └── images/                # images/ 폴더 이동
└── pages/
    └── brand.tsx              # 리다이렉트 또는 iframe
```

## 경로 변경 사항

### 이미지 경로
- **변경 전**: `assets/logos/web/massgoo_text-logo_black.webp`
- **변경 후**: `/assets/logos/web/massgoo_text-logo_black.webp`

- **변경 전**: `images/products/ball-caps/marpple/...`
- **변경 후**: `/images/products/ball-caps/marpple/...`

### HTML 내 경로 패턴
```javascript
// 현재 (상대 경로)
src="assets/logos/web/massgoo_text-logo_black.webp"
src="images/products/ball-caps/photos/cap-navy-detail.png"

// 변경 후 (절대 경로)
src="/assets/logos/web/massgoo_text-logo_black.webp"
src="/images/products/ball-caps/photos/cap-navy-detail.png"
```

## 주요 기능 요약

### 진행 상황 탭
- 전체 진행 대시보드
  - 총 주문 건수: **47개**
  - 총 상품 금액: **894,780원**
  - 총 자수비: **150,000원**
  - 최종 결제 금액: **1,044,780원**
- 제품별 진행 상황 (볼캡, 버킷햇, 클러치백, 티셔츠, 맨투맨)
- 주문 상세 정보 및 히스토리

### 상품소싱 탭
- 마플 제품 비교 및 분석
- 제품별 상세 스펙 및 가격 정보
- 사이즈 가이드 및 추천 정보
- 하위 탭: 볼캡, 버킷햇, 클러치백, 티셔츠, 맨투맨

### 디자인 탭
- 제품별 디자인 빌드업
- 로고 배치 및 색상 조합
- 실컬러코드 및 제작 스펙
- 하위 탭: 베이직 볼캡, 버킷햇, 클러치백, 티셔츠, 맨투맨

### 브랜드 탭
- **MASSGOO** (메인 브랜드)
- **SINGSING**
- **TOBY** (Toto & Bibi 캐릭터)
- **MUZIIK** (콜라보 파트너)
- **SECRET WEAPON** (MASSGOO 2차 브랜드)
- **SECRET FORCE** (MASSGOO 2차 브랜드)

### 업체 탭
- 마플 (MARPPLE) 상세 정보
- 업체 비교 및 분석
- 제작 가이드

## 현재 진행 중인 주문

### 완료된 주문
1. **베이직 볼캡** (MASSGOO) - 20개, 405,400원
   - 네이비 5개, 블랙 5개, 베이지 5개, 화이트 5개
   - 자수: MASSGOO × MUZIIK
   - 주문번호: 3218372
   - 배송 완료: 2025-12-06

2. **데일리오버 버킷햇** (MASSGOO) - 10개, 256,000원
   - 블랙 5개, 화이트 5개
   - 자수: MASSGOO × MUZIIK
   - 주문번호: 3219110
   - 배송 완료: 2025-12-04

3. **가죽 클러치백** (MASSGOO) - 4개, 96,000원
   - 화이트, 사이즈: One
   - 인쇄: 앞면/뒷면
   - 주문번호: 3218372

4. **페어플레이 더블코튼 무지 티셔츠** (MASSGOO) - 2개, 49,800원
   - 화이트, 사이즈: L
   - 인쇄: 앞면
   - 주문번호: 3218372

### 진행 중인 주문
1. **특양면 헤리 맨투맨** (TOBY) - 11개, 237,580원
   - 아이보리: 앞면만 인쇄 (10개)
   - 검정: 앞뒷면 인쇄 (1개)
   - 상태: 제작 준비중
   - 주문번호: 19720688

## 통계 정보

- **총 주문 건수**: 47개
- **총 상품 금액**: 894,780원
- **총 자수비**: 150,000원
- **최종 결제 금액**: 1,044,780원

## 기술 스택

### 현재
- **프론트엔드**: 순수 HTML/CSS/JavaScript
- **스타일링**: 인라인 스타일 및 `<style>` 태그
- **이미지 처리**: Sharp.js, Playwright
- **의존성**: 
  - `playwright`: 웹 스크래핑 및 캡처
  - `sharp`: 이미지 처리 및 변환

### 목표 (maslabs.kr)
- **프론트엔드**: Next.js React
- **스타일링**: CSS Modules 또는 Tailwind CSS
- **상태 관리**: React Hooks (useState, useEffect)
- **라우팅**: Next.js App Router 또는 Pages Router

## 주의사항

### 1. 이미지 경로
- 모든 상대 경로를 절대 경로(`/assets/`, `/images/`)로 변경 필요
- Next.js의 경우 `public/` 폴더 내 파일은 루트 경로(`/`)에서 접근 가능

### 2. 인라인 스타일
- React 컴포넌트로 변환 시 CSS 모듈 또는 styled-components 고려
- 현재 약 6,000줄의 인라인 스타일이 있음

### 3. 인라인 JavaScript
- React hooks (useState, useEffect)로 변환 필요
- 탭 전환 로직을 React 상태 관리로 변경

### 4. 파일 크기
- HTML 파일이 매우 크므로 컴포넌트 분리 권장
- 각 탭을 별도 컴포넌트로 분리

### 5. 인증
- maslabs.kr 인증 시스템과 통합 필요
- `/admin/brand` 경로로 배포 시 자동 보호됨 (middleware.ts)

### 6. 이미지 최적화
- 현재 WebP 및 PNG 혼재
- Next.js Image 컴포넌트 사용 고려

## 마이그레이션 후 작업

1. [ ] maslabs.kr 프로젝트 구조 확인
2. [ ] 인증 시스템 확인 및 통합
3. [ ] 이미지 경로 일괄 변경
4. [ ] React 컴포넌트 변환
   - [ ] 진행 탭 컴포넌트
   - [ ] 상품소싱 탭 컴포넌트
   - [ ] 디자인 탭 컴포넌트
   - [ ] 브랜드 탭 컴포넌트
   - [ ] 업체 탭 컴포넌트
5. [ ] 스타일링 시스템 통합
6. [ ] 테스트 및 검증
7. [ ] 배포 및 URL 확인

## 압축 시 포함할 폴더

### 필수 포함
- ✅ `assets/` (브랜드 자산)
- ✅ `images/` (제품 이미지)
- ✅ `product_comparison.html` (메인 파일)
- ✅ `package.json` (의존성 참고용)
- ✅ `docs/` (프로젝트 문서)

### 제외 가능
- ❌ `node_modules/` (재설치 가능)
- ❌ `package-lock.json` (재생성 가능)

## 압축 파일명 제안

```
massgoo_goods_3010_migration_20251219.zip
```

또는

```
mas-brand-labs-portfolio_20251219.zip
```

## 참고 문서

- `docs/guides/folder_structure.md` - 폴더 구조 가이드
- `docs/project/project_plan.md` - 프로젝트 계획
- `docs/products/` - 제품별 문서
- `docs/suppliers/` - 업체 조사 문서
- `docs/e2e/README.md` - 자동화 스크립트 가이드

## 연락처 및 지원

- **프로젝트 관리**: MAS Brand Labs
- **마이그레이션 일자**: 2025-12-19
- **목적지**: maslabs.kr/brand 또는 maslabs.kr/admin/brand
- **원본 프로젝트**: massgoo_goods_3010

---

## 추가 참고사항

### 브랜드 정보
- **MASSGOO**: 메인 브랜드, 골프 굿즈 제작
- **SINGSING**: 골프 브랜드
- **TOBY**: 캐릭터 브랜드 (Toto & Bibi)
- **MUZIIK**: 콜라보 파트너 (외부 자산)
- **SECRET WEAPON**: MASSGOO 2차 브랜드
- **SECRET FORCE**: MASSGOO 2차 브랜드

### 제품 카테고리
1. 볼캡 (Ball Caps)
2. 버킷햇 (Bucket Hats)
3. 클러치백 (Pouches)
4. 티셔츠 (T-shirts)
5. 맨투맨 (Sweatshirts)

### 주요 업체
- **마플 (MARPPLE)**: 주요 제작 파트너
  - 1개부터 주문 가능
  - API 연동 가능성 높음
  - 다양한 제품 라인업

