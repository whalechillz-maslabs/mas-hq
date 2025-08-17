# MASLABS 근태관리 시스템

## 📋 개요
싱싱골프 시스템을 기반으로 추출하여 MASLABS에 최적화한 근태관리 및 직원 대시보드 시스템입니다.

## 🎯 주요 기능

### 1. 직원 대시보드
- 실시간 출퇴근 체크
- 개인 근태 현황 조회
- 휴가 잔여 확인
- 주간/월간 근무 통계

### 2. 근태 관리
- 직원별 출퇴근 기록 관리
- 근태 승인/반려 처리
- 연장근무 시간 계산
- 위치 기반 출퇴근 체크

### 3. 직원 관리  
- 직원 정보 등록/수정/삭제
- 부서 및 직급 관리
- 권한 관리 (RBAC)
- 비밀번호 초기화

### 4. 휴가 관리
- 휴가 신청 및 승인
- 휴가 잔여일수 관리
- 휴가 사용 내역 조회

## 🗂 디렉토리 구조
```
maslabs-attendance-system/
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── components/
│   ├── EmployeeDashboard.tsx   # 직원 대시보드
│   ├── AttendanceManagement.tsx # 근태 관리
│   └── EmployeeManagement.tsx  # 직원 관리
└── README.md                   # 시스템 문서
```

## 🗄 데이터베이스 구조

### 핵심 테이블
1. **employees** - 직원 정보
2. **attendance** - 근태 기록
3. **departments** - 부서 정보
4. **positions** - 직급 정보
5. **roles** - 권한 정보
6. **work_types** - 근무 유형
7. **leave_requests** - 휴가 신청
8. **leave_balance** - 휴가 잔여
9. **work_schedules** - 근무 일정
10. **holidays** - 공휴일
11. **notifications** - 알림

### 주요 특징
- UUID 기반 ID 시스템
- Row Level Security (RLS) 적용
- 자동 updated_at 트리거
- 인덱스 최적화

## 🛠 기술 스택

### Frontend
- **React** with TypeScript
- **Next.js** 15.3.1
- **Tailwind CSS** 3.4.0
- **Lucide Icons**

### Backend
- **Supabase** (PostgreSQL)
- **Row Level Security**
- **Real-time subscriptions**

### 인증/권한
- 이메일 기반 인증
- RBAC (Role-Based Access Control)
- 4단계 권한 체계:
  - admin (관리자)
  - hr_manager (HR 매니저)
  - team_lead (팀장)
  - employee (직원)

## 📝 설치 및 실행

### 1. 데이터베이스 설정
```sql
-- Supabase SQL Editor에서 실행
-- database/schema.sql 파일의 내용을 복사하여 실행
```

### 2. 환경변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 의존성 설치
```bash
npm install
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 💡 사용 시나리오

### 직원 시나리오
1. 로그인 후 대시보드 접속
2. 출근 버튼 클릭 (위치 정보 포함)
3. 업무 수행
4. 퇴근 버튼 클릭
5. 근무 시간 자동 계산

### 관리자 시나리오
1. 근태 관리 페이지 접속
2. 승인 대기 목록 확인
3. 상세 정보 검토
4. 승인/반려 처리
5. 통계 리포트 확인

## 🔐 보안 고려사항

1. **인증**
   - Supabase Auth 사용
   - 이메일 기반 인증
   - 비밀번호 암호화 (bcrypt)

2. **권한**
   - Row Level Security
   - 역할 기반 접근 제어
   - API 레벨 검증

3. **데이터 보호**
   - HTTPS 통신
   - 민감 정보 암호화
   - 로그 모니터링

## 📊 주요 화면

### 1. 직원 대시보드
- 현재 시간 표시
- 출퇴근 버튼
- 오늘의 근태 상태
- 이번 달 근태 현황
- 휴가 잔여 현황
- 주간 근무 시간

### 2. 근태 관리 (관리자)
- 날짜별 필터링
- 부서별 필터링
- 상태별 필터링 (승인/대기/반려)
- 일괄 승인 기능
- 엑셀 다운로드

### 3. 직원 관리 (HR)
- 직원 등록/수정/삭제
- 부서 및 직급 할당
- 권한 설정
- 비밀번호 초기화
- 재직/퇴직 상태 관리

## 🚀 향후 개선사항

1. **기능 추가**
   - 모바일 앱 개발
   - 생체 인증 (지문/얼굴)
   - 급여 명세서 연동
   - 팀별 캘린더 공유

2. **성능 최적화**
   - 대용량 데이터 페이징
   - 캐싱 전략 구현
   - 이미지 최적화

3. **사용성 개선**
   - 다국어 지원
   - 다크 모드
   - 반응형 디자인 강화
   - 접근성 향상

## 📞 문의
- 개발팀: dev@maslabs.com
- 버그 리포트: GitHub Issues

## 📄 라이선스
MASLABS Internal Use Only

---

## 🔄 싱싱골프 시스템에서 추출한 핵심 기능

### 재사용된 컴포넌트
1. **사용자 관리 시스템** (`/admin/users`)
   - 역할 기반 권한 관리
   - 비밀번호 초기화 기능
   - 활성/비활성 상태 관리

2. **레이아웃 구조** (`ModernAdminLayout`)
   - 사이드바 네비게이션
   - 헤더 컴포넌트
   - 반응형 디자인

3. **데이터베이스 설계 패턴**
   - UUID 기반 ID
   - 타임스탬프 자동 관리
   - RLS 정책 구현

### 새로 추가된 기능
1. **근태 관리 시스템**
   - 출퇴근 체크
   - 위치 기반 인증
   - 근무 시간 계산

2. **휴가 관리**
   - 휴가 신청/승인
   - 잔여일수 관리
   - 휴가 캘린더

3. **통계 및 리포트**
   - 월별 근태 집계
   - 부서별 통계
   - 엑셀 내보내기

### 제거된 기능
- 투어 관련 기능
- SMS/카카오톡 알림
- 견적 관리
- 마케팅 캠페인

## 📚 참고 자료
- [Supabase 문서](https://supabase.com/docs)
- [Next.js 문서](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
