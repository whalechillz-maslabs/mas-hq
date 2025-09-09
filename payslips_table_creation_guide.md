# Supabase payslips 테이블 생성 가이드

## 1. Supabase 대시보드 접속
- https://supabase.com/dashboard 접속
- 프로젝트 선택: `cgscbtxtgualkfalouwh`

## 2. SQL Editor 열기
- 왼쪽 메뉴에서 "SQL Editor" 클릭
- "New query" 버튼 클릭

## 3. 다음 SQL 코드 복사하여 실행

```sql
-- payslips 테이블 생성
CREATE TABLE IF NOT EXISTS payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- 예: '2025-08'
    employment_type VARCHAR(20) NOT NULL, -- 'full_time' 또는 'part_time'
    
    -- 급여 정보
    base_salary INTEGER NOT NULL DEFAULT 0,
    overtime_pay INTEGER NOT NULL DEFAULT 0,
    incentive INTEGER NOT NULL DEFAULT 0,
    point_bonus INTEGER NOT NULL DEFAULT 0,
    total_earnings INTEGER NOT NULL DEFAULT 0,
    tax_amount INTEGER NOT NULL DEFAULT 0,
    net_salary INTEGER NOT NULL DEFAULT 0,
    
    -- 시간제 급여 관련 (part_time인 경우)
    total_hours DECIMAL(4,1), -- 총 근무시간
    hourly_rate INTEGER, -- 시급
    
    -- 상세 내역 (JSON 형태로 저장)
    daily_details JSONB, -- 일별 상세 내역
    
    -- 상태 및 메타데이터
    status VARCHAR(20) NOT NULL DEFAULT 'generated', -- 'generated', 'issued', 'paid'
    issued_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 생성/수정 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT payslips_employee_period_unique UNIQUE(employee_id, period)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);
CREATE INDEX IF NOT EXISTS idx_payslips_created_at ON payslips(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Enable all operations for all users" ON payslips
    FOR ALL USING (true);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_payslips_updated_at 
    BEFORE UPDATE ON payslips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테이블 생성 완료 메시지
SELECT 'payslips 테이블이 성공적으로 생성되었습니다.' as message;
```

## 4. 실행 후 확인
- "Run" 버튼 클릭하여 SQL 실행
- 성공 메시지 확인: "payslips 테이블이 성공적으로 생성되었습니다."

## 5. 테이블 확인
- 왼쪽 메뉴에서 "Table Editor" 클릭
- "payslips" 테이블이 생성되었는지 확인

## 6. 테이블 생성 완료 후
터미널에서 다음 명령어로 저장 기능을 테스트할 수 있습니다:

```bash
node scripts/test_payslip_save.js
```

## 테이블 구조 설명
- **id**: 고유 식별자 (UUID)
- **employee_id**: 직원 ID (employees 테이블 참조)
- **period**: 급여 기간 (예: '2025-08')
- **employment_type**: 고용형태 ('full_time' 또는 'part_time')
- **base_salary**: 기본급
- **total_earnings**: 총 수입
- **tax_amount**: 세금
- **net_salary**: 실수령액
- **total_hours**: 총 근무시간 (시간제인 경우)
- **hourly_rate**: 시급 (시간제인 경우)
- **daily_details**: 일별 상세 내역 (JSON)
- **status**: 상태 ('generated', 'issued', 'paid')

