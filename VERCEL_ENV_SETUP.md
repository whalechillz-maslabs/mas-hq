# Vercel 환경 변수 설정 가이드

## 🚨 중요: Vercel에서 환경 변수 설정 필요

현재 애플리케이션 에러의 원인은 Vercel에서 환경 변수가 설정되지 않았기 때문입니다.

## 📋 설정해야 할 환경 변수들

### 1. Vercel 대시보드 접속
1. https://vercel.com/dashboard 접속
2. `mas-hq` 프로젝트 선택
3. Settings → Environment Variables 메뉴 클릭

### 2. 다음 환경 변수들을 추가:

#### **NEXT_PUBLIC_SUPABASE_URL**
```
https://cgscbtxtgualkfalouwh.supabase.co
```

#### **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8
```

#### **SLACK_WEBHOOK_URL** (선택사항)
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### **NEXT_PUBLIC_APP_URL**
```
https://maslabs.kr
```

### 3. 환경 변수 설정 후
1. **Production** 환경에 체크
2. **Preview** 환경에 체크 (선택사항)
3. **Development** 환경에 체크 (선택사항)
4. **Save** 버튼 클릭

### 4. 재배포
환경 변수 설정 후 자동으로 재배포되거나, 수동으로 재배포를 트리거해야 합니다.

## 🔍 확인 방법

환경 변수 설정 후:
1. https://maslabs.kr/tasks 접속
2. 애플리케이션이 정상적으로 로드되는지 확인
3. 브라우저 개발자 도구 콘솔에서 에러가 없는지 확인

## ⚠️ 주의사항

- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트 사이드에서 접근 가능
- `SLACK_WEBHOOK_URL`은 서버 사이드에서만 사용되므로 `NEXT_PUBLIC_` 접두사 없음
- 환경 변수 설정 후 즉시 반영되지 않을 수 있으므로 잠시 대기 후 확인

## 🆘 문제 해결

만약 여전히 에러가 발생한다면:
1. Vercel 대시보드에서 배포 로그 확인
2. 브라우저 개발자 도구 콘솔에서 에러 메시지 확인
3. 환경 변수가 올바르게 설정되었는지 확인
