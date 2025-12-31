# 프로젝트 폴더 구조 가이드

## 전체 구조

```
프로젝트 루트/
├── assets/                           # 모든 원본 자산
│   ├── logos/                        # 로고 파일
│   │   ├── sources/                  # 원본 파일 (.ai, .pdf)
│   │   │   ├── massgoo/              # MASSGOO 로고 원본
│   │   │   ├── muziik/               # MUZIIK 로고 원본 + 가이드라인 PDF
│   │   │   └── secret/               # Secret 시리즈 로고 원본
│   │   └── web/                      # 웹용 파일 (.webp)
│   │       ├── massgoo_text-logo_black.webp
│   │       └── muziik_italic_logo.webp
│   ├── characters/                   # 캐릭터 자산
│   │   ├── toby/                     # 토비 캐릭터
│   │   │   ├── drafts/              # 시안
│   │   │   ├── final/               # 최종 확정
│   │   │   └── variations/           # 베리에이션
│   │   └── bibi/                     # 비비 캐릭터 (준비됨)
│   └── data/                         # 데이터 파일
│       ├── reviews/                   # 리뷰 데이터
│       └── sweatshirts/               # 맨투맨 검색 결과
│
├── docs/                             # 문서
│   ├── suppliers/                    # 업체 조사
│   │   ├── golf_cap_supplier_analysis.md
│   │   └── supplier_research_comprehensive.md
│   ├── products/                      # 제품별 문서
│   │   ├── cap_design_buildup.md
│   │   ├── cap_production_plan.md
│   │   ├── pouch_design_buildup.md
│   │   ├── tee_design_buildup.md
│   │   ├── marpple_cap_comparison.md
│   │   ├── marpple_cap_guide.md
│   │   └── marpple_tee_comparison.md
│   ├── guides/                       # 가이드 문서
│   │   ├── folder_structure.md
│   │   └── logo_inventory.md
│   ├── project/                      # 프로젝트 관리
│   │   ├── project_plan.md
│   │   ├── final_products.md
│   │   ├── documentation_plan.md
│   │   └── cleanup_old_folders.sh
│   └── e2e/                          # 자동화 스크립트
│
├── images/                           # 이미지 파일 (제품 이미지만)
│   ├── products/                     # 제품별 폴더
│   │   ├── ball-caps/                # 볼캡
│   │   ├── bucket-hats/               # 버킷햇
│   │   ├── sweatshirts/               # 맨투맨
│   │   ├── t-shirts/                  # 티셔츠
│   │   └── pouches/                   # 파우치
│   └── references/                    # 공통 참고 자료
│       └── marpple-thread-color.jpg   # 마플 실컬러코드
│
└── [기타 파일들]
    ├── package.json
    ├── package-lock.json
    ├── product_comparison.html
    └── start.sh
```

## 제품별 표준 구조

모든 제품은 다음 구조를 따릅니다:

```
images/products/{제품명}/
  ├── sketches/      # GPT AI 초안, 참조 사이트 캡처 등
  ├── elements/      # 제작 요소 (배경, 라인, 패턴 등)
  ├── marpple/       # 마플 제품 이미지 및 리뷰
  └── photos/        # 실제 제품 실사 사진
```

## 각 폴더 설명

### assets/

#### logos/
- **sources/**: 원본 로고 파일 (.ai, .pdf)
  - 브랜드별로 분류 (massgoo, muziik, secret)
  - 가이드라인 PDF 포함
- **web/**: 웹에서 사용하는 최적화된 파일 (.webp)
  - HTML에서 직접 참조

#### characters/
- **toby/**: 토비 캐릭터 자산
  - drafts/: 시안
  - final/: 최종 확정
  - variations/: 베리에이션 (transparent, white-line 등)
- **bibi/**: 비비 캐릭터 (준비됨)

#### data/
- 리뷰 데이터, 검색 결과 등 JSON/PNG 파일

### images/products/

#### sketches/
- **용도**: 초기 디자인 스케치 및 참고 자료
- **내용**:
  - GPT AI로 생성된 초안
  - 참조한 사이트 캡처 이미지
  - 아이디어 스케치

#### elements/
- **용도**: 실제 제작에 사용되는 디자인 요소
- **내용**:
  - 배경 이미지
  - 라인, 패턴
  - 기타 제작에 필요한 그래픽 요소

#### marpple/
- **용도**: 마플(Marpple) 플랫폼 관련 이미지
- **내용**:
  - 마플 제품 페이지에서 캡처한 이미지
  - 제품 메인 이미지
  - 리뷰 이미지
  - 최종 제작 완료 이미지 (final-*.png)

#### photos/
- **용도**: 실제 제작 완료된 제품의 실사 사진
- **내용**:
  - 핸드폰으로 촬영한 실제 제품 사진
  - 앞면/뒷면 상세 사진
  - 색상별 제품 사진
- **파일명 규칙**: `{제품명}-{색상}-{위치}-detail.png`

## 현재 제품별 구조

### 볼캡 (ball-caps)
```
images/products/ball-caps/
  ├── marpple/       # 마플 제품 이미지
  └── photos/        # 실제 제품 사진
```

### 버킷햇 (bucket-hats)
```
images/products/bucket-hats/
  ├── marpple/       # 마플 제품 이미지
  └── photos/        # 실제 제품 사진
```

### 맨투맨 (sweatshirts)
```
images/products/sweatshirts/
  ├── marpple/       # 마플 제품 이미지
  └── photos/        # 실제 제품 사진
```

### 티셔츠 (t-shirts)
```
images/products/t-shirts/
  ├── marpple/       # 마플 제품 이미지
  └── photos/        # 실제 제품 사진
```

### 파우치 (pouches)
```
images/products/pouches/
  ├── sketches/      # GPT AI 초안
  ├── elements/      # 제작 요소
  ├── marpple/       # 마플 제품 이미지
  └── photos/        # 실제 제품 사진
```

## 파일 저장 가이드라인

### 새 파일 추가 시

1. **로고 원본**: `assets/logos/sources/{브랜드}/`에 저장
2. **로고 웹용**: `assets/logos/web/`에 저장
3. **캐릭터 자산**: `assets/characters/{캐릭터명}/`에 저장
4. **스케치/초안**: `images/products/{제품명}/sketches/`에 저장
5. **제작 요소**: `images/products/{제품명}/elements/`에 저장
6. **마플 캡처**: `images/products/{제품명}/marpple/`에 저장
7. **실제 사진**: `images/products/{제품명}/photos/`에 저장

### 파일명 규칙

- **로고 원본**: `{브랜드}_{타입}_{색상}.ai`
- **로고 웹용**: `{브랜드}_{타입}_{색상}.webp`
- **스케치**: `image.png`, `sketch-{번호}.png`, `reference-{설명}.png`
- **요소**: `{제품명}-{요소명}-{번호}.png`
- **마플**: `{제품ID}.webp`, `{제품ID}-review-{번호}.webp`
- **실제 사진**: `{제품명}-{색상}-{위치}-detail.png`

## 참고사항

- 모든 제품은 동일한 구조를 따릅니다
- `designs` 폴더는 사용하지 않습니다 (sketches + elements로 대체)
- 공통 참고 자료는 `images/references/`에 저장합니다
- 원본 자산은 `assets/`에, 웹용 이미지는 `images/`에 저장합니다
- HTML에서 사용하는 로고는 `assets/logos/web/` 경로를 사용합니다
