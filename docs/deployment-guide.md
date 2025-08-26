# MASLABS Dashboard 배포 가이드

## 배포 전 준비사항

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://cgscbtxtgualkfalouwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 빌드 테스트

로컬에서 빌드가 정상적으로 되는지 확인:

```bash
npm run build
```

### 3. 테스트 실행

배포 전 테스트를 실행하여 모든 기능이 정상 작동하는지 확인:

```bash
npm run test:deployment
```

## 배포 방법

### 방법 1: Vercel CLI 사용

```bash
# Vercel CLI 설치 (아직 설치되지 않은 경우)
npm i -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포
vercel --prod
```

### 방법 2: GitHub 연동 (권장)

1. GitHub 저장소에 코드 푸시
2. Vercel 대시보드에서 GitHub 저장소 연결
3. 자동 배포 설정

### 방법 3: Vercel 대시보드에서 직접 배포

1. Vercel 대시보드 접속
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 환경 변수 설정
5. "Deploy" 클릭

## 배포 후 확인사항

### 1. 기본 기능 확인

- [ ] 메인 페이지 로드
- [ ] 로그인 페이지 접근
- [ ] 직원 로그인 기능
- [ ] 대시보드 접근

### 2. 관리자 기능 확인

- [ ] 직원 관리 페이지
- [ ] 스케줄 관리 페이지
- [ ] KPI 대시보드
- [ ] 권한 관리

### 3. 데이터베이스 연결 확인

- [ ] Supabase 연결 상태
- [ ] 직원 데이터 로드
- [ ] 스케줄 데이터 로드
- [ ] 실시간 업데이트

### 4. 성능 확인

- [ ] 페이지 로딩 속도 (3초 이내)
- [ ] 이미지 및 리소스 로딩
- [ ] 반응형 디자인
- [ ] 모바일 호환성

## 문제 해결

### 빌드 오류

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run build -- --no-cache
```

### 환경 변수 오류

1. Vercel 대시보드에서 환경 변수 재설정
2. 배포 재시도

### 데이터베이스 연결 오류

1. Supabase 프로젝트 상태 확인
2. API 키 유효성 확인
3. 네트워크 연결 상태 확인

## 모니터링

### Vercel Analytics

- 페이지 뷰
- 사용자 행동
- 성능 메트릭

### 에러 로그

- Vercel 대시보드에서 에러 로그 확인
- Supabase 로그 확인

## 롤백

문제 발생 시 이전 버전으로 롤백:

1. Vercel 대시보드에서 "Deployments" 탭
2. 이전 배포 버전 선택
3. "Promote to Production" 클릭

## 보안

- 환경 변수는 절대 코드에 포함하지 않기
- API 키 정기적 갱신
- 접근 권한 관리
- HTTPS 강제 적용
