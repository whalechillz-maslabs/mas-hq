# MASLABS 직원 관리 시스템 프로젝트 계획

## 📋 프로젝트 개요
MASLABS의 직원 관리 시스템으로, 출근 관리, 급여 조회, 업무 기록, 조직도 등의 기능을 제공하는 웹 애플리케이션입니다.

## 🚀 최근 업데이트 (2025-08-20)

### ✨ 스케줄 시스템 추가
- **이은정 8월 20일 스케줄**: 10:00-17:00 (7시간) 정상 근무
- **모바일 최적화 달력/리스트 뷰**: 직관적이고 터치 친화적 인터페이스
- **스케줄 추가 기능**: 직원별 스케줄 입력 및 관리
- **전직원 공유**: 모든 직원이 스케줄 확인 가능

### 🔧 기술적 개선사항
- **Supabase import 오류 수정**: createClient → supabase로 변경
- **자동 배포 설정**: Git + Vercel 연동 완료
- **빌드 최적화**: Next.js 15.4.6 호환성 확보

## 📁 파일 구조

### 새로 추가된 파일들
- `src/app/schedules/page.tsx` - 스케줄 메인 페이지 (달력/리스트 뷰)
- `src/app/schedules/add/page.tsx` - 스케줄 추가 페이지
- `tests/schedule-test.spec.ts` - 스케줄 시스템 테스트
- `scripts/add_eunjung_to_remote.sql` - 이은정 계정 원격 DB 추가 스크립트

### 수정된 파일들
- `src/lib/supabase.ts` - Supabase 클라이언트 설정
- `vercel.json` - Vercel 배포 설정
- `package.json` - 의존성 및 스크립트 업데이트

## 🎯 주요 기능

### 1. 스케줄 관리 시스템
- **달력 뷰**: 주간 달력 형식으로 스케줄 표시
- **리스트 뷰**: 일별 상세 리스트 형식
- **스케줄 추가**: 직원별 근무 시간 입력
- **실시간 업데이트**: Supabase 실시간 데이터 연동

### 2. 모바일 최적화
- **반응형 디자인**: 모든 화면 크기 지원
- **터치 친화적**: 큰 버튼과 직관적 인터페이스
- **그라데이션 배경**: 시각적 매력도 향상
- **카드 레이아웃**: 깔끔하고 현대적인 디자인

### 3. 권한 시스템
- **역할별 접근 제어**: admin, manager, team_lead, employee, part_time
- **메뉴별 권한 관리**: 직급에 따른 기능 접근 제한
- **세밀한 권한 설정**: 각 페이지별 접근 권한 정의

## 🔐 권한 구조

### 역할별 접근 권한
- **admin**: 모든 기능 접근 가능
- **manager**: 팀원 평가, 출근 관리, 직원 관리
- **team_lead**: 팀원 평가, 출근 관리
- **employee**: 기본 기능 (스케줄, 급여, 업무 기록)
- **part_time**: 제한된 기능

### 메뉴별 접근 권한
1. **모든 직급** (admin, manager, team_lead, employee, part_time)
   * /schedules - 근무 스케줄
   * /salary - 급여 조회
   * /tasks - 업무 기록
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

## 🗄️ 데이터베이스 구조

### 주요 테이블
- **employees**: 직원 정보 (이름, 전화번호, 부서, 직책, 역할)
- **schedules**: 근무 스케줄 (날짜, 시작/종료 시간, 상태)
- **departments**: 부서 정보 (마스팀, 싱싱팀, 경영지원팀)
- **positions**: 직책 정보 (대표이사, 이사, 팀장, 사원)
- **roles**: 역할 정보 (admin, manager, team_lead, employee, part_time)

### 현재 직원 데이터
- **MASLABS-001**: 시스템 관리자 (admin)
- **MASLABS-002**: 이은정(STE) - 경영지원팀 이사 (manager)
- **MASLABS-004**: 박진(JIN) - 마스팀 사원 (part_time)

## 🚀 배포 정보

### Vercel 배포
- **프로덕션 URL**: https://mas-hcbjucrdu-whalechillz-maslabs-projects.vercel.app
- **GitHub 연동**: https://github.com/whalechillz-maslabs/mas-hq
- **자동 배포**: main 브랜치 푸시 시 자동 배포

### 환경 설정
- **로컬 개발**: Docker Supabase
- **프로덕션**: 원격 Supabase
- **환경 변수**: .env.local (로컬), .env.production (프로덕션)

## 🧪 테스트 현황

### Playwright 테스트
- **스케줄 시스템 테스트**: 이은정 로그인 및 스케줄 확인
- **권한 테스트**: admin, manager, team_lead 권한 확인
- **UI 테스트**: 로그인, 대시보드, 프로필 페이지

### 테스트 결과
- ✅ 이은정 스케줄 확인 테스트
- ✅ 스케줄 추가 기능 테스트
- ✅ 모바일 최적화 확인

## 📈 향후 계획

### 단기 목표 (1-2주)
- [ ] 원격 Supabase 데이터 동기화 완료
- [ ] Playwright 테스트 완전 통과
- [ ] 모바일 앱 최적화 완료

### 중기 목표 (1개월)
- [ ] 실시간 알림 시스템 구축
- [ ] 고급 권한 관리 시스템
- [ ] 성과 관리 시스템 추가

### 장기 목표 (3개월)
- [ ] AI 기반 업무 분석
- [ ] 고급 리포팅 시스템
- [ ] 외부 시스템 연동

## 🔧 기술 스택

### Frontend
- **Next.js 15.4.6**: React 기반 프레임워크
- **TypeScript**: 타입 안전성
- **TailwindCSS**: 스타일링
- **Lucide React**: 아이콘

### Backend
- **Supabase**: PostgreSQL 데이터베이스
- **Supabase Auth**: 인증 시스템
- **Row Level Security**: 데이터 보안

### Testing
- **Playwright**: E2E 테스트
- **TypeScript**: 타입 체크

### Deployment
- **Vercel**: 자동 배포
- **GitHub**: 버전 관리
- **Docker**: 로컬 개발 환경

## 📞 연락처
- **개발팀**: MASLABS 개발팀
- **GitHub**: https://github.com/whalechillz-maslabs/mas-hq
- **배포 URL**: https://mas-hcbjucrdu-whalechillz-maslabs-projects.vercel.app

---
*마지막 업데이트: 2025-08-20*
