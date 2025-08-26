# MASLABS Dashboard

MASLABS의 직원 관리 및 스케줄 관리 시스템입니다.

## 주요 기능

- 🔐 직원 로그인 및 인증
- 👥 직원 관리 (추가, 수정, 삭제)
- 📅 스케줄 관리
- 📊 KPI 대시보드
- 📝 업무 기록 및 점수 관리
- 👨‍💻 관리자 권한 관리

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 개발 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/your-username/maslabs-dashboard.git
cd maslabs-dashboard
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
# .env.local 파일 생성 후 다음 내용 추가:
NEXT_PUBLIC_SUPABASE_URL=https://cgscbtxtgualkfalouwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 개발 서버 실행
```bash
npm run dev
```

## 배포

이 프로젝트는 Vercel을 통해 자동 배포됩니다.

- **Production**: https://www.maslabs.kr
- **Staging**: https://maslabs-dashboard.vercel.app

## 데이터베이스 스키마

주요 테이블:
- `employees`: 직원 정보
- `departments`: 부서 정보
- `positions`: 직급 정보
- `roles`: 권한 정보
- `schedules`: 스케줄 정보
- `operation_types`: 업무 유형
- `employee_tasks`: 업무 기록

## 테스트

Playwright를 사용한 자동화 테스트:

```bash
# 모든 테스트 실행
npm run test

# 특정 테스트 실행
npm run test:admin
npm run test:manager
npm run test:park-jin

# UI 모드로 테스트 실행
npm run test:ui
```

## 라이선스

MASLABS 내부 사용 전용
