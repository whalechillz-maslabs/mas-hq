# 역할별 업무 기록 권한 관리 방안

## 🎯 권한 관리 전략

### 1. 역할별 접근 권한

#### **관리자 (admin)**
- ✅ **모든 직원의 업무 기록 조회**
- ✅ **모든 업무 유형 사용 가능**
- ✅ **업무 상태 변경 권한**
- ✅ **업무 삭제 권한**
- ✅ **통계 대시보드 전체 조회**

#### **매니저/팀장 (manager)**
- ✅ **본인 팀원들의 업무 기록 조회**
- ✅ **팀 관련 업무 유형 사용 가능**
- ✅ **팀원 업무 승인/반려**
- ✅ **팀 통계 대시보드 조회**

#### **팀 리더 (team_lead)**
- ✅ **본인 팀원들의 업무 기록 조회**
- ✅ **팀 관련 업무 유형 사용 가능**
- ✅ **팀원 업무 검토**
- ✅ **팀 성과 분석**

#### **일반 직원 (employee)**
- ✅ **본인 업무 기록만 조회**
- ✅ **일반 업무 유형만 사용 가능**
- ✅ **본인 업무 상태 변경**
- ❌ **다른 직원 업무 조회 불가**

#### **파트타임 직원 (part_time)**
- ✅ **본인 업무 기록만 조회**
- ✅ **제한된 업무 유형만 사용 가능**
- ✅ **본인 업무 상태 변경**
- ❌ **다른 직원 업무 조회 불가**

### 2. 업무 유형별 권한

#### **관리자 전용 업무 유형**
- TL_SALES (팀매출 달성률 측정)
- TL_YOY (YOY 성장률 측정)
- MGMT_HIRING (채용 TAT)
- MGMT_AUTOMATION (자동화/운영 지표)

#### **팀장/매니저 전용 업무 유형**
- TL_SCHEDULE (스케줄 컨펌)
- TL_CS (CS 해결)
- TL_TRAINING (교육 이수)
- SALE_LEAD (팀장 리드 판매)

#### **팀원 사용 가능 업무 유형**
- TM_PHONE_SALE (전화/온라인 성사)
- TM_OFFLINE_SALE (오프라인 단독 성사)
- TM_OFFLINE_ASSIST (오프라인 보조 참여)
- TM_SITA_SATISFACTION (시타 만족도)
- TM_RETURN (반품 발생)
- TM_RETURN_DEFENSE (반품 방어 성공)

#### **모든 사용자 사용 가능**
- ADMIN_DOCUMENT (문서 작성)
- ADMIN_MEETING (회의 참석)
- TRAINING_ATTEND (교육 참석)
- QUALITY_CHECK (품질 검사)

### 3. 구현 방안

#### **데이터베이스 수준**
1. **RLS (Row Level Security) 정책 설정**
2. **업무 유형별 권한 테이블 생성**
3. **팀 구조 테이블 생성**

#### **애플리케이션 수준**
1. **역할별 페이지 접근 제어**
2. **업무 유형 필터링**
3. **UI 권한별 표시/숨김**

### 4. 권한 관리 테이블 구조

```sql
-- 업무 유형별 권한 테이블
CREATE TABLE operation_type_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type_id UUID REFERENCES operation_types(id),
    role_id UUID REFERENCES roles(id),
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 팀 구조 테이블
CREATE TABLE team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_lead_id UUID REFERENCES employees(id),
    team_member_id UUID REFERENCES employees(id),
    department_id UUID REFERENCES departments(id),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. 권한 확인 로직

```typescript
// 권한 확인 함수
const checkTaskPermission = async (userId: string, taskId: string, action: string) => {
  const user = await getCurrentUser();
  const task = await getTaskById(taskId);
  
  // 관리자는 모든 권한
  if (user.role_id === 'admin') return true;
  
  // 본인 업무는 읽기/수정 가능
  if (task.employee_id === user.id && ['read', 'update'].includes(action)) return true;
  
  // 팀장은 팀원 업무 조회 가능
  if (user.role_id === 'manager' && isTeamMember(task.employee_id, user.id)) return true;
  
  return false;
};
```
