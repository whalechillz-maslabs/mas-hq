# Supabase 스크립트 실행 가이드

## 🎯 실행 목적
- 뷰 정리 및 통합 (4개 중복 뷰 정리)
- hourly_wages → contracts 마이그레이션
- 최형호 계약서 생성 (수습기간 + 급여 변동 이력)
- 급여명세서 식대 포함 테스트

## 📋 실행 순서

### 1단계: Supabase 대시보드 접속
1. 브라우저에서 https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/editor/49731 접속
2. SQL Editor 탭 클릭
3. 새 쿼리 탭 열기

### 2단계: 뷰 정리 및 마이그레이션 실행
**파일**: `cleanup_views_and_migrate.sql`

**실행 내용**:
- 기존 중복 뷰 4개 삭제
- 통합된 뷰 4개 재생성:
  - `contracts_with_employees` (계약서 + 직원 정보)
  - `employee_details` (직원 상세 정보)
  - `monthly_attendance_summary` (월별 근태 요약)
  - `payslip_summary` (급여명세서 요약)
- hourly_wages 데이터를 contracts로 마이그레이션

**실행 방법**:
1. `cleanup_views_and_migrate.sql` 파일 내용을 복사
2. Supabase SQL Editor에 붙여넣기
3. "Run" 버튼 클릭
4. 결과 확인

### 3단계: 최형호 계약서 생성
**파일**: `create_choi_contract.sql`

**실행 내용**:
- 기존 최형호 계약서 삭제 (중복 방지)
- 새로운 계약서 생성:
  - 계약 기간: 2025-08-01 ~ 2025-09-30
  - 초기 시급: 13,000원
  - 급여 변동 이력: 8월 8일부터 12,000원
  - 수습기간: 2025-08-01 ~ 2025-08-31
  - 식대: 140,000원

**실행 방법**:
1. `create_choi_contract.sql` 파일 내용을 복사
2. Supabase SQL Editor에 붙여넣기
3. "Run" 버튼 클릭
4. 결과 확인

### 4단계: 급여명세서 테스트
**파일**: `test_payslip_with_meal_allowance.sql`

**실행 내용**:
- 최형호 8월 스케줄 데이터 확인
- 계약서 정보 확인
- 시급 정보 확인
- 급여 계산 시뮬레이션 (식대 포함)

**실행 방법**:
1. `test_payslip_with_meal_allowance.sql` 파일 내용을 복사
2. Supabase SQL Editor에 붙여넣기
3. "Run" 버튼 클릭
4. 결과 확인

## ✅ 예상 결과

### 1단계 완료 후
- 4개 통합 뷰 생성 완료
- hourly_wages 데이터가 contracts로 마이그레이션 완료

### 2단계 완료 후
- 최형호 계약서 생성 완료
- 수습기간 및 급여 변동 이력 포함

### 3단계 완료 후
- 급여명세서 식대 포함 테스트 완료
- 최형호 8월 급여 계산 확인

## 🚨 주의사항

1. **백업**: 실행 전 데이터베이스 백업 권장
2. **순서**: 반드시 1단계 → 2단계 → 3단계 순서로 실행
3. **오류**: 각 단계마다 결과를 확인하고 오류가 없을 때만 다음 단계 진행
4. **권한**: Supabase 프로젝트 관리자 권한 필요

## 📞 문제 해결

### 오류 발생 시
1. 오류 메시지 확인
2. 해당 스크립트의 특정 부분만 수정하여 재실행
3. 필요시 Supabase 지원팀 문의

### 연결 문제 시
1. 브라우저 새로고침
2. Supabase 로그인 재확인
3. 프로젝트 권한 확인

## 🎉 완료 후 확인사항

1. **뷰 생성 확인**: Table Editor에서 4개 뷰가 생성되었는지 확인
2. **계약서 확인**: contracts 테이블에서 최형호 계약서 확인
3. **급여명세서 테스트**: 웹 애플리케이션에서 급여명세서 생성 테스트

---

**실행 완료 후 모든 기능이 정상 작동하는지 확인하세요!** 🚀
