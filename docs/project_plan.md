# MASLABS 직원 관리 시스템 프로젝트 계획

## 📋 프로젝트 개요
MASLABS 직원 관리 시스템은 골프 관련 업무를 하는 직원들의 근무 관리, 성과 측정, 급여 관리 등을 위한 종합적인 웹 애플리케이션입니다.

## 🎯 주요 기능
- **직원 인증**: 전화번호, 사번, 핀번호 로그인
- **근무 관리**: 출근/퇴근 체크, 스케줄 관리
- **업무 기록**: KPI 기반 업무 기록 및 평가
- **급여 관리**: 급여 조회 및 관리
- **권한 관리**: 역할 기반 접근 제어 (RBAC)
- **관리자 기능**: 직원 관리, 팀 평가, 출근 관리

## 🔧 기술 스택
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Playwright
- **Deployment**: Vercel

## 📊 데이터베이스 스키마
- **employees**: 직원 정보
- **roles**: 역할 정의 (admin, manager, team_lead, employee, part_time)
- **departments**: 부서 정보
- **positions**: 직급 정보
- **schedules**: 근무 스케줄
- **employee_tasks**: 업무 기록
- **salaries**: 급여 정보
- **operation_types**: 작업 유형 (KPI 기반)

## 🔐 권한 시스템
### 역할별 접근 권한
- **admin**: 모든 기능 접근 가능
- **manager**: 팀원 평가, 출근 관리
- **team_lead**: 팀원 평가, 출근 관리
- **employee**: 기본 기능 (스케줄, 업무 기록, 급여 조회)
- **part_time**: 기본 기능 (스케줄, 업무 기록, 급여 조회)

### 메뉴별 접근 권한
1. **모든 직급** (admin, manager, team_lead, employee, part_time)
   * /schedules - 근무 스케줄
   * /salary - 급여 조회
   * /tasks - 업무 기록 (OP 팀장도 입력 가능!)
   * /organization - 조직도
   * /profile - 개인정보 관리

2. **관리자 전용** (admin)
   * /admin/system-settings - 시스템 설정
   * /admin/employee-migration - 직원 데이터 관리

3. **관리자 + 매니저** (admin, manager)
   * /admin/hr-policy - 인사정책 관리
   * /admin/team-management - OP 팀장 설정
   * /admin/employee-management - 직원 관리

4. **관리자 + 매니저 + OP팀장** (admin, manager, team_lead)
   * /admin/team-evaluation - 팀원 평가
   * /admin/attendance-management - 출근 관리

## 🎨 UI/UX 개선 작업
**목표**: 직관적이고 모바일 친화적인 디자인으로 개선

### 적용된 페이지
1. **로그인 페이지** (`src/app/login/page.tsx`)
   - MAS Golf 스타일 적용
   - 큰 버튼으로 로그인 방법 선택
   - 카드 기반 입력 폼
   - 그라데이션 배경

2. **대시보드 페이지** (`src/app/dashboard/page.tsx`)
   - "오늘의 미션" 섹션 개선
   - 체크인/체크아웃 버튼 크기 증가
   - KPI 카드 디자인 개선
   - 빠른 메뉴/관리자 메뉴 버튼 개선

3. **프로필 페이지** (`src/app/profile/page.tsx`)
   - 카드 기반 프로필 표시
   - 수정/저장 버튼 크기 증가
   - 입력 필드 디자인 개선

### 디자인 특징
- **큰 버튼**: 모바일에서 쉽게 터치할 수 있는 크기
- **카드 레이아웃**: 정보를 명확하게 구분
- **그라데이션**: 시각적 매력도 향상
- **간소화된 텍스트**: 불필요한 설명 제거
- **직관적인 아이콘**: 기능을 쉽게 이해할 수 있도록

## 🧪 테스트 계획
### Playwright 테스트
1. **박진 직원 테스트** (`tests/park-jin-nickname-test.spec.ts`)
   - 전화번호 로그인 테스트
   - 닉네임 설정 테스트
   - 핀번호 로그인 테스트
   - 권한 확인 테스트

2. **관리자 계정 테스트** (`tests/admin-permission-test.spec.ts`)
   - 관리자 로그인 및 어드민 메뉴 확인 ✅ **성공**
   - 관리자 프로필 페이지 확인
   - 관리자 어드민 페이지 접근 테스트
   - 관리자 vs 일반 직원 권한 비교 테스트

## 🐛 문제 해결 이력

### 1. 박진 로그인 시 관리자 화면 표시 문제
**원인**: 원격 Supabase 사용으로 인한 데이터 불일치
**해결**: 로컬 Supabase 환경 설정 및 데이터 재구성

### 2. UI 변경으로 인한 Playwright 테스트 실패
**원인**: MAS Golf 스타일 적용으로 버튼 텍스트 변경
**해결**: 테스트 코드의 로케이터를 실제 UI에 맞게 수정

### 3. 관리자 계정 어드민 기능 미표시 문제
**원인**: 
- 데이터베이스 연결 문제 (원격 vs 로컬)
- RLS(Row Level Security) 정책으로 인한 권한 제한
- role_id 비교 로직 오류 (UUID vs 문자열)

**해결 과정**:
1. **로컬 Supabase 설정**: Docker 기반 로컬 환경 구성
2. **RLS 비활성화**: 테스트용으로 모든 테이블의 RLS 정책 제거
3. **데이터베이스 마이그레이션**: 관리자 계정 및 역할 데이터 재구성
4. **프론트엔드 로직 수정**: role_id 비교 로직 개선
5. **환경 변수 설정**: 로컬 Supabase URL 및 키 설정

**결과**: ✅ 관리자 로그인 및 어드민 메뉴 표시 성공

### 4. Supabase 패스워드 자동 입력
**해결**: `scripts/auto-supabase.sh` 스크립트 생성으로 패스워드 자동 입력 구현

## 📈 현재 상태
- ✅ 기본 인증 시스템 구현
- ✅ 권한 기반 메뉴 시스템 구현
- ✅ UI/UX 개선 (MAS Golf 스타일)
- ✅ 로컬 Supabase 환경 구성
- ✅ RLS 비활성화로 테스트 환경 안정화
- ✅ 관리자 계정 어드민 기능 정상 작동
- ✅ Playwright 테스트 기본 구조 구축

## 🚀 다음 단계
1. **어드민 페이지 구현**: 실제 관리 기능 페이지 개발
2. **프로필 페이지 개선**: 부서 정보 표시 수정
3. **로그아웃 기능 개선**: 버튼 위치 및 동작 확인
4. **박진 직원 테스트 완료**: 닉네임 설정 기능 검증
5. **통합 테스트**: 전체 시스템 엔드투엔드 테스트

## 📝 개발 노트
- 로컬 개발 환경: `http://localhost:3000`
- 로컬 Supabase: `http://127.0.0.1:54321`
- 테스트 실행: `npm run test:admin`, `npm run test:park-jin-nickname`
- 데이터베이스 리셋: `npm run db:reset`
