# 퇴근 버튼 미처리 로직 설계

## 📋 현재 상황 분석

### 데이터베이스 상태 (2025-09-15 기준)
- **김탁수**: 9월 14일 19:54:11 출근, 23:16:11 퇴근 (완료)
- **김탁수**: 9월 15일 08:33:43 출근, 퇴근 없음 (진행 중)

## 🎯 퇴근 버튼 미처리 시 처리 로직

### 1. 스케줄이 있는 경우

#### A. 정상 근무 시간 내
- **상황**: 스케줄 시간(예: 09:00-18:00) 내에 퇴근하지 않은 경우
- **처리 로직**:
  ```
  if (현재시간 > 스케줄_종료시간 + 30분) {
    // 자동 퇴근 처리
    actual_end = 스케줄_종료시간
    status = 'completed'
    total_hours = 스케줄_종료시간 - actual_start
    overtime_hours = 0
  }
  ```

#### B. 초과 근무 시간
- **상황**: 스케줄 시간을 초과하여 근무 중인 경우
- **처리 로직**:
  ```
  if (현재시간 > 스케줄_종료시간) {
    // 초과 근무로 처리
    actual_end = 현재시간
    status = 'overtime'
    total_hours = 스케줄_종료시간 - actual_start
    overtime_hours = 현재시간 - 스케줄_종료시간
  }
  ```

### 2. 스케줄이 없는 경우

#### A. 기본 근무 시간 적용
- **상황**: 스케줄이 없지만 출근한 경우
- **처리 로직**:
  ```
  // 기본 근무 시간: 8시간 (09:00-17:00)
  기본_근무시간 = 8시간
  기본_종료시간 = actual_start + 8시간
  
  if (현재시간 > 기본_종료시간 + 30분) {
    // 자동 퇴근 처리
    actual_end = 기본_종료시간
    status = 'completed'
    total_hours = 기본_근무시간
    overtime_hours = 0
  }
  ```

#### B. 초과 근무 시간
- **상황**: 기본 근무 시간을 초과한 경우
- **처리 로직**:
  ```
  if (현재시간 > 기본_종료시간) {
    // 초과 근무로 처리
    actual_end = 현재시간
    status = 'overtime'
    total_hours = 기본_근무시간
    overtime_hours = 현재시간 - 기본_종료시간
  }
  ```

## 🔄 자동 처리 시점

### 1. 실시간 처리
- **트리거**: 관리자 페이지 접속 시
- **대상**: 퇴근하지 않은 모든 직원
- **처리**: 위 로직에 따라 자동 퇴근 처리

### 2. 배치 처리
- **트리거**: 매일 자정 (00:00)
- **대상**: 전날 퇴근하지 않은 모든 직원
- **처리**: 전날 데이터 정리 및 자동 퇴근 처리

## 📊 상태 표시 로직

### 1. 관리자 페이지 상태 표시
```
if (actual_start && !actual_end) {
  if (현재시간 > 예상_종료시간 + 30분) {
    status = "자동퇴근대기" // 노란색
  } else {
    status = "근무중" // 파란색
  }
} else if (actual_start && actual_end) {
  if (overtime_hours > 0) {
    status = "초과근무완료" // 주황색
  } else {
    status = "근무완료" // 초록색
  }
}
```

### 2. 직원 페이지 상태 표시
```
if (actual_start && !actual_end) {
  if (현재시간 > 예상_종료시간 + 30분) {
    // 퇴근 버튼 비활성화, 자동 퇴근 안내 메시지
    message = "근무 시간이 종료되어 자동 퇴근 처리됩니다."
  } else {
    // 퇴근 버튼 활성화
    message = "퇴근 체크를 해주세요."
  }
}
```

## 🛠️ 구현 방안

### 1. 데이터베이스 스키마 수정
```sql
-- attendance 테이블에 자동 퇴근 관련 필드 추가
ALTER TABLE attendance ADD COLUMN auto_checkout BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN auto_checkout_reason TEXT;
ALTER TABLE attendance ADD COLUMN expected_end_time TIME;
```

### 2. 자동 퇴근 처리 함수
```typescript
const processAutoCheckout = async (employeeId: string, date: string) => {
  // 1. 현재 attendance 데이터 조회
  // 2. 스케줄 데이터 조회
  // 3. 자동 퇴근 조건 확인
  // 4. 자동 퇴근 처리
  // 5. 로그 기록
};
```

### 3. 관리자 페이지 개선
- 자동 퇴근 대기 직원 목록 표시
- 수동 퇴근 처리 버튼 추가
- 자동 퇴근 로그 표시

## 📈 예상 효과

### 1. 데이터 정확성 향상
- 퇴근하지 않은 직원의 근무 시간 정확한 계산
- 초과 근무 시간 자동 계산

### 2. 관리 효율성 증대
- 관리자가 수동으로 퇴근 처리할 필요 없음
- 자동화된 근무 시간 관리

### 3. 사용자 경험 개선
- 직원이 퇴근을 깜빡해도 자동 처리
- 명확한 상태 표시 및 안내
