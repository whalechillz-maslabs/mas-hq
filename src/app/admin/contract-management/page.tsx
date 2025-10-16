'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileText, Download, Upload, User, Calendar, DollarSign, Clock, CheckCircle, XCircle, Eye, Edit } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  hire_date: string;
  employment_type: string;
  monthly_salary?: number;
  hourly_rate?: number;
  phone?: string;
  email?: string;
  address?: string;
}

interface Contract {
  id: string;
  employee_id: string;
  contract_type: 'part_time' | 'full_time' | 'annual';
  start_date: string;
  end_date?: string;
  salary: number;
  work_hours: number;
  work_days: number;
  status: 'draft' | 'pending_signature' | 'signed' | 'active' | 'expired';
  created_at: string;
  signed_at?: string;
  employee_signature?: string;
  employer_signature?: string;
  documents?: {
    id_card?: string;
    family_register?: string;
    bank_account?: string;
  };
  // 급여 변동 이력 (JSONB)
  salary_history?: {
    effective_date: string;
    salary: number;
    reason: string;
    notes?: string;
  }[];
  // 수습기간 설정
  probation_period?: {
    start_date: string;
    end_date: string;
    minimum_wage: boolean; // 최저임금 적용 여부
  };
  employees?: Employee;
}

export default function ContractManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentThumbnails, setDocumentThumbnails] = useState<{[key: string]: string}>({});
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 새 계약서 생성 폼 데이터
  const [newContract, setNewContract] = useState({
    employee_id: '',
    contract_type: 'part_time' as 'part_time' | 'full_time' | 'annual',
    start_date: '',
    end_date: '',
    salary: 0,
    work_hours: 7,
    work_days: 5,
    work_time: '09:00-17:00',
    lunch_break: 1,
    meal_allowance: 140000,
    includes_weekly_holiday: true,
    // 4대보험 설정 (간단한 방식)
    insurance_4major: true, // 4대보험 가입 여부
    // 급여 변동 이력
    salary_history: [] as { effective_date: string; salary: number; reason: string; notes?: string }[],
    // 수습기간 설정
    probation_period: {
      start_date: '',
      end_date: '',
      minimum_wage: false,
    },
    // 휴가 관련 조항
    vacation_policy: {
      substitute_holidays: false, // 대체 공휴일 휴무 없음
      sick_leave_deducts_annual: true, // 병가는 연차에서 차감
      family_events_days: 3, // 가족 경조사 (배우자, 자식, 부모) 3일
    },
    // 식대 정책
    meal_policy: 'per_day' as 'per_day' | 'fixed_with_reconcile',
    meal_rate: 7000,
    meal_fixed_days_per_month: 20,
    meal_settlement_carryover: 0,
    // 보험 표시 제어
    insurance_display: {
      national_pension: true,
      health: true,
      employment: true,
      industrial_accident: true,
    },
    // 생성일 수정 기능
    created_at: new Date().toISOString().split('T')[0], // 기본값은 오늘 날짜
  });

  // 서명 데이터
  const [signatureData, setSignatureData] = useState({
    employee_signature: '',
    employer_signature: ''
  });

  // 서류 업로드 데이터
  const [documentData, setDocumentData] = useState({
    id_card: null as File | null,
    family_register: null as File | null,
    bank_account: null as File | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 직원 데이터 로드
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (employeesError) throw employeesError;

      // 계약서 데이터 로드
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          employees:employee_id(*)
        `)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      setEmployees(employeesData || []);
      setContracts(contractsData || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContract = async () => {
    if (!newContract.employee_id || !newContract.start_date) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      if (isEditing && selectedContract) {
        // 수정 모드
        const { data, error } = await supabase
          .from('contracts')
          .update({
            employee_id: newContract.employee_id,
            contract_type: newContract.contract_type,
            start_date: newContract.start_date,
            end_date: newContract.end_date || null,
            salary: newContract.salary,
            work_hours: newContract.work_hours,
            work_days: newContract.work_days,
            work_time: newContract.work_time,
            lunch_break: newContract.lunch_break,
            meal_allowance: newContract.meal_allowance,
            includes_weekly_holiday: newContract.includes_weekly_holiday,
            insurance_4major: newContract.insurance_4major,
            // 생성일 수정 기능
            created_at: newContract.created_at,
            // 급여 변동 이력 저장
            salary_history: newContract.salary_history.length > 0 ? newContract.salary_history : null,
            // 수습기간 설정 저장
            probation_period: (newContract.probation_period.start_date && newContract.probation_period.end_date) 
              ? newContract.probation_period 
              : null,
            // 휴가 관련 조항 저장
            vacation_policy: newContract.vacation_policy,
            // 식대 정책 저장
            meal_policy: newContract.meal_policy,
            meal_rate: newContract.meal_rate,
            meal_fixed_days_per_month: newContract.meal_fixed_days_per_month,
            meal_settlement_carryover: newContract.meal_settlement_carryover,
            // 보험 표시 제어 저장
            insurance_display: newContract.insurance_display
          })
          .eq('id', selectedContract.id);

        if (error) throw error;
        alert('근로계약서가 수정되었습니다.');
      } else {
        // 생성 모드
        const { data, error } = await supabase
          .from('contracts')
          .insert({
            employee_id: newContract.employee_id,
            contract_type: newContract.contract_type,
            start_date: newContract.start_date,
            end_date: newContract.end_date || null,
            salary: newContract.salary,
            work_hours: newContract.work_hours,
            work_days: newContract.work_days,
            work_time: newContract.work_time,
            lunch_break: newContract.lunch_break,
            meal_allowance: newContract.meal_allowance,
            includes_weekly_holiday: newContract.includes_weekly_holiday,
            insurance_4major: newContract.insurance_4major,
            status: 'draft',
            // 생성일 수정 기능
            created_at: newContract.created_at,
            // 급여 변동 이력 저장
            salary_history: newContract.salary_history.length > 0 ? newContract.salary_history : null,
            // 수습기간 설정 저장
            probation_period: (newContract.probation_period.start_date && newContract.probation_period.end_date) 
              ? newContract.probation_period 
              : null,
            // 휴가 관련 조항 저장
            vacation_policy: newContract.vacation_policy,
            // 식대 정책 저장
            meal_policy: newContract.meal_policy,
            meal_rate: newContract.meal_rate,
            meal_fixed_days_per_month: newContract.meal_fixed_days_per_month,
            meal_settlement_carryover: newContract.meal_settlement_carryover,
            // 보험 표시 제어 저장
            insurance_display: newContract.insurance_display
          })
          .select()
          .single();

        if (error) throw error;
        alert('근로계약서가 생성되었습니다.');
      }

      setShowCreateModal(false);
      setIsEditing(false);
      setSelectedContract(null);
      setNewContract({
        employee_id: '',
        contract_type: 'part_time',
        start_date: '',
        end_date: '',
        salary: 0,
        work_hours: 7,
        work_days: 5,
        work_time: '09:00-17:00',
        lunch_break: 1,
        meal_allowance: 140000,
        includes_weekly_holiday: true,
        insurance_4major: true,
        salary_history: [],
        probation_period: {
          start_date: '',
          end_date: '',
          minimum_wage: false,
        },
        vacation_policy: {
          substitute_holidays: false,
          sick_leave_deducts_annual: true,
          family_events_days: 3,
        },
        meal_policy: 'per_day',
        meal_rate: 7000,
        meal_fixed_days_per_month: 20,
        meal_settlement_carryover: 0,
        insurance_display: {
          national_pension: true,
          health: true,
          employment: true,
          industrial_accident: true,
        },
        created_at: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error(isEditing ? '계약서 수정 실패:' : '계약서 생성 실패:', error);
      
      // 더 자세한 에러 정보 추출
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Supabase 에러 객체 처리
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // 전체 에러 객체도 콘솔에 출력
      console.error('전체 에러 객체:', JSON.stringify(error, null, 2));
      
      alert(isEditing ? `계약서 수정에 실패했습니다.\n오류: ${errorMessage}` : `계약서 생성에 실패했습니다.\n오류: ${errorMessage}`);
    }
  };

  const downloadContract = (contract: Contract) => {
    const employee = contract.employees;
    if (!employee) return;

    const contractContent = generateContractHTML(contract, employee);
    
    const blob = new Blob([contractContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `근로계약서_${employee.name}_${contract.start_date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 나이 계산 함수
  const calculateAge = (birthDate: string, referenceDate: Date = new Date()): number => {
    const birth = new Date(birthDate);
    let age = referenceDate.getFullYear() - birth.getFullYear();
    const monthDiff = referenceDate.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const generateContractHTML = (contract: Contract, employee: Employee) => {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>근로계약서 - ${employee.name}</title>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .info-table th { background-color: #f5f5f5; font-weight: bold; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-bottom: 1px solid #333; height: 50px; margin: 20px 0; }
        .terms { margin: 20px 0; }
        .terms ol { padding-left: 20px; }
        .terms li { margin: 10px 0; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">근로계약서</div>
        <div class="subtitle">Employment Contract</div>
    </div>

    <div class="section">
        <div class="section-title">1. 당사자</div>
        <table class="info-table">
            <tr>
                <th>사업주</th>
                <td>마스골프 (대표: 김탁수)</td>
            </tr>
            <tr>
                <th>근로자</th>
                <td>${employee.name} (${employee.employee_id})</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. 근로조건</div>
        <table class="info-table">
            <tr>
                <th>계약 유형</th>
                <td>${contract.contract_type === 'part_time' ? '파트타임 (시급제)' : contract.contract_type === 'full_time' ? '정규직 (월급제)' : contract.contract_type === 'annual' ? '연봉제' : '정규직'}</td>
            </tr>
            <tr>
                <th>계약 기간</th>
                <td>${contract.start_date} ~ ${contract.end_date || '무기한'}</td>
            </tr>
            <tr>
                <th>근무 시간</th>
                <td>주 ${contract.work_days}일, 일 ${contract.work_hours}시간</td>
            </tr>
            <tr>
                <th>급여</th>
                <td>${contract.contract_type === 'annual' ? 
                    `${contract.salary.toLocaleString()}원 (연봉) - 월 환산 ${Math.round(contract.salary / 12).toLocaleString()}원` : 
                    `${contract.salary.toLocaleString()}원 ${contract.contract_type === 'part_time' ? '(시급)' : contract.contract_type === 'full_time' ? '(월급)' : '(월급)'}`
                }</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. 근로조건 세부사항</div>
        <div class="terms">
            <ol>
                <li>근무시간: ${contract.work_time} (점심시간 ${contract.lunch_break}시간)</li>
                <li>주휴수당: ${contract.includes_weekly_holiday ? '포함' : '별도 지급'}</li>
                <li>식대: ${contract.meal_policy === 'per_day' ? 
                    `${contract.meal_rate ? contract.meal_rate.toLocaleString() : '7,000'}원/일 (3시간 이상 근무일)` : 
                    `월 ${((contract.meal_fixed_days_per_month || 20) * (contract.meal_rate || 7000)).toLocaleString()}원 선지급 (${contract.meal_fixed_days_per_month || 20}일×${contract.meal_rate ? contract.meal_rate.toLocaleString() : '7,000'}원), 익월 실제 사용분 정산`
                }</li>
                <li>4대보험: ${contract.insurance_4major ? 
                    (() => {
                      const age = employee.birth_date ? calculateAge(employee.birth_date) : null;
                      const nationalPension = age !== null ? (age >= 18 && age < 60) : (contract.insurance_display?.national_pension ?? true);
                      return `${nationalPension ? '국민연금(가입), ' : '국민연금(미가입), '}건강보험(가입), 고용보험(가입), 산재보험(가입)`;
                    })() : 
                    '해당없음'
                }</li>
                <li>연차: ${contract.contract_type === 'part_time' ? '해당없음' : '근로기준법에 따라 지급'}</li>
            </ol>
        </div>
    </div>

    <div class="section">
        <div class="section-title">4. 휴가 관련 조항</div>
        <div class="terms">
            <ol>
                <li>대체 공휴일: ${contract.vacation_policy?.substitute_holidays ? '정상 근무' : '휴무'}</li>
                <li>병가: ${contract.vacation_policy?.sick_leave_deducts_annual ? '연차에서 차감' : '연차와 별도 처리'}</li>
                <li>가족 경조사 휴가: ${contract.vacation_policy?.family_events_days || 3}일 (배우자, 자식, 부모)</li>
            </ol>
        </div>
    </div>

    <div class="section">
        <div class="section-title">5. 기타 조건</div>
        <div class="terms">
            <ol>
                <li>본 계약서는 근로기준법에 따라 작성되었습니다.</li>
                <li>계약 조건 변경 시에는 서면으로 합의해야 합니다.</li>
                <li>해고 시에는 30일 전 통보 또는 30일분의 통상임금을 지급합니다.</li>
                <li>기타 근로조건은 근로기준법 및 관련 법령에 따릅니다.</li>
            </ol>
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div>사업주</div>
            <div class="signature-line"></div>
            <div>마스골프 대표 김탁수</div>
            <div>${new Date(contract.created_at).toLocaleDateString()}</div>
        </div>
        <div class="signature-box">
            <div>근로자</div>
            <div class="signature-line"></div>
            <div>${employee.name}</div>
            <div>${new Date(contract.created_at).toLocaleDateString()}</div>
        </div>
    </div>
</body>
</html>`;
  };

  const handleSignatureUpload = async (contractId: string, signatureType: 'employee' | 'employer', file: File) => {
    try {
      // 파일을 Supabase Storage에 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}_${signatureType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-signatures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 계약서에 서명 정보 업데이트
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          [`${signatureType}_signature`]: uploadData.path,
          status: signatureType === 'employee' ? 'signed' : 'active'
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      alert('서명이 업로드되었습니다.');
      loadData();
    } catch (error) {
      console.error('서명 업로드 실패:', error);
      alert('서명 업로드에 실패했습니다.');
    }
  };

  // 이미지 썸네일 URL 생성
  const getDocumentThumbnailUrl = async (contractId: string, documentType: 'id_card' | 'family_register' | 'bank_account') => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract || !contract.documents || !contract.documents[documentType]) {
        return null;
      }

      const filePath = contract.documents[documentType];
      const { data } = await supabase.storage
        .from('contract-documents')
        .createSignedUrl(filePath, 60 * 60 * 24); // 24시간 유효

      return data?.signedUrl || null;
    } catch (error) {
      console.error('썸네일 URL 생성 실패:', error);
      return null;
    }
  };

  // 썸네일 로드
  const loadDocumentThumbnails = async (contractId: string) => {
    const documentTypes: ('id_card' | 'family_register' | 'bank_account')[] = ['id_card', 'family_register', 'bank_account'];
    const thumbnails: {[key: string]: string} = {};

    for (const docType of documentTypes) {
      const thumbnailUrl = await getDocumentThumbnailUrl(contractId, docType);
      if (thumbnailUrl) {
        thumbnails[`${contractId}_${docType}`] = thumbnailUrl;
      }
    }

    setDocumentThumbnails(prev => ({ ...prev, ...thumbnails }));
  };

  // 서류 조회 기능
  const handleDocumentView = async (contractId: string, documentType: 'id_card' | 'family_register' | 'bank_account') => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract || !contract.documents || !contract.documents[documentType]) {
        alert('조회할 서류가 없습니다.');
        return;
      }

      const filePath = contract.documents[documentType];
      const { data, error } = await supabase.storage
        .from('contract-documents')
        .download(filePath);

      if (error) throw error;

      // 파일을 새 창에서 열기
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      
      // 메모리 정리
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('서류 조회 실패:', error);
      alert('서류 조회에 실패했습니다.');
    }
  };

  const handleDocumentUpload = async (contractId: string, documentType: 'id_card' | 'family_register' | 'bank_account', file: File) => {
    try {
      // 파일을 Supabase Storage에 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}_${documentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 계약서에 서류 정보 업데이트
      const currentContract = contracts.find(c => c.id === contractId);
      const updatedDocuments = {
        ...currentContract?.documents,
        [documentType]: uploadData.path
      };

      const { error: updateError } = await supabase
        .from('contracts')
        .update({ documents: updatedDocuments })
        .eq('id', contractId);

      if (updateError) throw updateError;

      alert('서류가 업로드되었습니다.');
      loadData();
    } catch (error) {
      console.error('서류 업로드 실패:', error);
      console.error('오류 상세:', JSON.stringify(error, null, 2));
      
      // 더 자세한 오류 메시지 표시
      let errorMessage = '서류 업로드에 실패했습니다.';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `\n오류: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: '초안' },
      pending_signature: { color: 'bg-yellow-100 text-yellow-800', text: '서명 대기' },
      signed: { color: 'bg-blue-100 text-blue-800', text: '서명 완료' },
      active: { color: 'bg-green-100 text-green-800', text: '활성' },
      expired: { color: 'bg-red-100 text-red-800', text: '만료' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">근로계약서 관리 시스템을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">근로계약서 관리</h1>
                <p className="text-gray-600">직원 근로계약서 생성, 서명 및 서류 관리</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>계약서 생성</span>
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 계약서</p>
                <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 계약</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">서명 대기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'pending_signature').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">만료 계약</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'expired').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 계약서 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">근로계약서 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약 기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    급여
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    식대
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.employees?.name || '알 수 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.employees?.employee_id || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.contract_type === 'part_time' ? '파트타임' : 
                       contract.contract_type === 'full_time' ? '정규직' : '연봉제'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{contract.start_date}</div>
                      {contract.end_date && (
                        <div className="text-gray-500">~ {contract.end_date}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.salary.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.meal_allowance ? contract.meal_allowance.toLocaleString() + '원' : '0원'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadContract(contract)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>다운로드</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowSignatureModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        >
                          <Upload className="w-4 h-4" />
                          <span>서명</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowDocumentModal(true);
                            loadDocumentThumbnails(contract.id);
                          }}
                          className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span>서류</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setIsEditing(true);
                            setNewContract({
                              employee_id: contract.employee_id,
                              contract_type: contract.contract_type,
                              start_date: contract.start_date,
                              end_date: contract.end_date || '',
                              salary: contract.salary,
                              work_hours: contract.work_hours,
                              work_days: contract.work_days,
                              work_time: '09:00-17:00',
                              lunch_break: 1,
                              meal_allowance: contract.meal_allowance || 140000,
                              includes_weekly_holiday: contract.includes_weekly_holiday || true,
                              insurance_4major: contract.insurance_4major || true,
                              salary_history: contract.salary_history || [],
                              probation_period: contract.probation_period || {
                                start_date: '',
                                end_date: '',
                                minimum_wage: false,
                              },
                              vacation_policy: contract.vacation_policy || {
                                substitute_holidays: false,
                                sick_leave_deducts_annual: true,
                                family_events_days: 3,
                              },
                              meal_policy: contract.meal_policy || 'per_day',
                              meal_rate: contract.meal_rate || 7000,
                              meal_fixed_days_per_month: contract.meal_fixed_days_per_month || 20,
                              meal_settlement_carryover: contract.meal_settlement_carryover || 0,
                              insurance_display: contract.insurance_display || {
                                national_pension: true,
                                health: true,
                                employment: true,
                                industrial_accident: true,
                              },
                              created_at: new Date(contract.created_at).toISOString().split('T')[0], // 기존 생성일 포함
                            });
                            setShowCreateModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>수정</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 계약서 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                {isEditing ? '근로계약서 수정' : '근로계약서 생성'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직원 선택</label>
                  <select
                    value={newContract.employee_id}
                    onChange={(e) => setNewContract({ ...newContract, employee_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">직원을 선택하세요</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_id}) - {employee.employment_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계약 유형</label>
                  <select
                    value={newContract.contract_type}
                    onChange={(e) => setNewContract({ 
                      ...newContract, 
                      contract_type: e.target.value as 'part_time' | 'full_time' | 'annual' 
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="part_time">파트타임 (시급제)</option>
                    <option value="full_time">정규직 (월급제)</option>
                    <option value="annual">연봉제</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {newContract.contract_type === 'part_time' && '• 시급으로 급여 계산 • 4대보험 미가입'}
                    {newContract.contract_type === 'full_time' && '• 월급으로 급여 지급 • 4대보험 가입 • 연차 제공'}
                    {newContract.contract_type === 'annual' && '• 연봉을 12개월로 나누어 월급 지급 • 4대보험 가입 • 연차 제공'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약 시작일</label>
                    <input
                      type="date"
                      value={newContract.start_date}
                      onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약 종료일 (선택사항)</label>
                    <input
                      type="date"
                      value={newContract.end_date}
                      onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계약서 생성일</label>
                  <input
                    type="date"
                    value={newContract.created_at}
                    onChange={(e) => setNewContract({ ...newContract, created_at: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    계약서가 실제로 작성된 날짜를 입력하세요. (기본값: 오늘 날짜)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newContract.contract_type === 'part_time' ? '시급 (원)' : 
                     newContract.contract_type === 'full_time' ? '월급 (원)' : 
                     newContract.contract_type === 'annual' ? '연봉 (원)' : '급여 (원)'}
                  </label>
                  <input
                    type="number"
                    value={newContract.salary}
                    onChange={(e) => setNewContract({ ...newContract, salary: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      newContract.contract_type === 'part_time' ? '시급을 입력하세요 (예: 10000)' :
                      newContract.contract_type === 'full_time' ? '월급을 입력하세요 (예: 3000000)' :
                      newContract.contract_type === 'annual' ? '연봉을 입력하세요 (예: 36000000)' :
                      '급여를 입력하세요'
                    }
                  />
                  {newContract.contract_type === 'annual' && (
                    <p className="text-xs text-gray-500 mt-1">
                      * 연봉은 12개월로 나누어 월급으로 지급됩니다
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주간 근무일수</label>
                    <input
                      type="number"
                      value={newContract.work_days}
                      onChange={(e) => setNewContract({ ...newContract, work_days: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">일일 근무시간</label>
                    <input
                      type="number"
                      value={newContract.work_hours}
                      onChange={(e) => setNewContract({ ...newContract, work_hours: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">근무시간</label>
                  <input
                    type="text"
                    value={newContract.work_time}
                    onChange={(e) => setNewContract({ ...newContract, work_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 09:00-17:00"
                  />
                </div>

                {/* 식대 정책 설정 */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">식대 정책</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">식대 정책 선택</label>
                      <select
                        value={newContract.meal_policy}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          meal_policy: e.target.value as 'per_day' | 'fixed_with_reconcile' 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="per_day">일별 지급 (3시간 이상 근무일 × 단가)</option>
                        <option value="fixed_with_reconcile">고정 선지급 + 익월 정산</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">식대 단가 (원/일)</label>
                      <input
                        type="number"
                        value={newContract.meal_rate}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          meal_rate: parseInt(e.target.value) || 0 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="7000"
                      />
                    </div>

                    {newContract.meal_policy === 'fixed_with_reconcile' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">월 고정 지급일수</label>
                        <input
                          type="number"
                          value={newContract.meal_fixed_days_per_month}
                          onChange={(e) => setNewContract({ 
                            ...newContract, 
                            meal_fixed_days_per_month: parseInt(e.target.value) || 0 
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="20"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          월 {newContract.meal_fixed_days_per_month}일 × {newContract.meal_rate.toLocaleString()}원 = {(newContract.meal_fixed_days_per_month * newContract.meal_rate).toLocaleString()}원 선지급
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {newContract.meal_policy === 'per_day' ? (
                          <>일별 지급: 3시간 이상 근무일 × {newContract.meal_rate.toLocaleString()}원</>
                        ) : (
                          <>고정 선지급: 월 {(newContract.meal_fixed_days_per_month * newContract.meal_rate).toLocaleString()}원 선지급 후, 익월에 실제 사용분과 정산</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newContract.insurance_4major}
                      onChange={(e) => setNewContract({ ...newContract, insurance_4major: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">4대보험 가입</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    체크 시 4대보험(국민연금, 건강보험, 고용보험, 산재보험) 가입
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includes_weekly_holiday"
                    checked={newContract.includes_weekly_holiday}
                    onChange={(e) => setNewContract({ 
                      ...newContract, 
                      includes_weekly_holiday: e.target.checked 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includes_weekly_holiday" className="ml-2 block text-sm text-gray-900">
                    주휴수당 포함
                  </label>
                </div>

                {/* 수습기간 설정 */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">수습기간 설정 (선택사항)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">수습 시작일</label>
                      <input
                        type="date"
                        value={newContract.probation_period.start_date}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          probation_period: { 
                            ...newContract.probation_period, 
                            start_date: e.target.value 
                          } 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">수습 종료일</label>
                      <input
                        type="date"
                        value={newContract.probation_period.end_date}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          probation_period: { 
                            ...newContract.probation_period, 
                            end_date: e.target.value 
                          } 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      id="minimum_wage"
                      checked={newContract.probation_period.minimum_wage}
                      onChange={(e) => setNewContract({ 
                        ...newContract, 
                        probation_period: { 
                          ...newContract.probation_period, 
                          minimum_wage: e.target.checked 
                        } 
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="minimum_wage" className="ml-2 block text-sm text-gray-900">
                      수습기간 중 최저임금 적용 (10,030원/시간)
                    </label>
                  </div>
                </div>

                {/* 휴가 관련 조항 */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">휴가 관련 조항</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="substitute_holidays"
                        checked={newContract.vacation_policy.substitute_holidays}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          vacation_policy: { 
                            ...newContract.vacation_policy, 
                            substitute_holidays: e.target.checked 
                          } 
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="substitute_holidays" className="ml-2 block text-sm text-gray-900">
                        대체 공휴일 휴무 없음
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      체크 시 대체 공휴일에도 정상 근무합니다.
                    </p>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sick_leave_deducts_annual"
                        checked={newContract.vacation_policy.sick_leave_deducts_annual}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          vacation_policy: { 
                            ...newContract.vacation_policy, 
                            sick_leave_deducts_annual: e.target.checked 
                          } 
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sick_leave_deducts_annual" className="ml-2 block text-sm text-gray-900">
                        병가는 연차에서 차감
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      체크 시 병가 사용 시 연차가 차감됩니다.
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        가족 경조사 휴가 (일)
                      </label>
                      <input
                        type="number"
                        value={newContract.vacation_policy.family_events_days}
                        onChange={(e) => setNewContract({ 
                          ...newContract, 
                          vacation_policy: { 
                            ...newContract.vacation_policy, 
                            family_events_days: parseInt(e.target.value) || 0 
                          } 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        배우자, 자식, 부모의 경조사 시 제공되는 휴가 일수입니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 급여 변동 이력 */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">급여 변동 이력 (선택사항)</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    최형호처럼 시급이 변동되는 경우 미리 설정할 수 있습니다.
                  </p>
                  <div className="space-y-3">
                    {newContract.salary_history.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">적용일</label>
                          <input
                            type="date"
                            value={item.effective_date}
                            onChange={(e) => {
                              const newHistory = [...newContract.salary_history];
                              newHistory[index].effective_date = e.target.value;
                              setNewContract({ ...newContract, salary_history: newHistory });
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">급여</label>
                          <input
                            type="number"
                            value={item.salary}
                            onChange={(e) => {
                              const newHistory = [...newContract.salary_history];
                              newHistory[index].salary = parseInt(e.target.value);
                              setNewContract({ ...newContract, salary_history: newHistory });
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="13000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">변경 사유</label>
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(e) => {
                              const newHistory = [...newContract.salary_history];
                              newHistory[index].reason = e.target.value;
                              setNewContract({ ...newContract, salary_history: newHistory });
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="성과 개선"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              const newHistory = newContract.salary_history.filter((_, i) => i !== index);
                              setNewContract({ ...newContract, salary_history: newHistory });
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newHistory = [...newContract.salary_history, {
                          effective_date: '',
                          salary: 0,
                          reason: '',
                          notes: ''
                        }];
                        setNewContract({ ...newContract, salary_history: newHistory });
                      }}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                    >
                      + 급여 변동 추가
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsEditing(false);
                    setSelectedContract(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={generateContract}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? '계약서 수정' : '계약서 생성'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 서명 업로드 모달 */}
        {showSignatureModal && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-4">서명 업로드</h3>
              <p className="text-gray-600 mb-4">
                {selectedContract.employees?.name}님의 근로계약서 서명을 업로드하세요.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">근로자 서명</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSignatureUpload(selectedContract.id, 'employee', file);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">사업주 서명</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSignatureUpload(selectedContract.id, 'employer', file);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 서류 업로드 모달 */}
        {showDocumentModal && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-4">서류 업로드</h3>
              <p className="text-gray-600 mb-4">
                {selectedContract.employees?.name}님의 근로계약서 관련 서류를 업로드하세요.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">주민등록증</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload(selectedContract.id, 'id_card', file);
                          }
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedContract.documents?.id_card && (
                        <button
                          onClick={() => handleDocumentView(selectedContract.id, 'id_card')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          조회
                        </button>
                      )}
                    </div>
                    {selectedContract.documents?.id_card && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                          {documentThumbnails[`${selectedContract.id}_id_card`] ? (
                            <img 
                              src={documentThumbnails[`${selectedContract.id}_id_card`]} 
                              alt="주민등록증 썸네일"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-blue-100 rounded-lg flex items-center justify-center ${documentThumbnails[`${selectedContract.id}_id_card`] ? 'hidden' : ''}`}>
                            <span className="text-blue-600 font-bold text-sm">ID</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">주민등록증</p>
                          <p className="text-xs text-gray-500">{selectedContract.documents.id_card}</p>
                        </div>
                        <button
                          onClick={() => handleDocumentView(selectedContract.id, 'id_card')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          미리보기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">가족관계증명서</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload(selectedContract.id, 'family_register', file);
                          }
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedContract.documents?.family_register && (
                        <button
                          onClick={() => handleDocumentView(selectedContract.id, 'family_register')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          조회
                        </button>
                      )}
                    </div>
                    {selectedContract.documents?.family_register && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                          {documentThumbnails[`${selectedContract.id}_family_register`] ? (
                            <img 
                              src={documentThumbnails[`${selectedContract.id}_family_register`]} 
                              alt="가족관계증명서 썸네일"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-green-100 rounded-lg flex items-center justify-center ${documentThumbnails[`${selectedContract.id}_family_register`] ? 'hidden' : ''}`}>
                            <span className="text-green-600 font-bold text-sm">가족</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">가족관계증명서</p>
                          <p className="text-xs text-gray-500">{selectedContract.documents.family_register}</p>
                        </div>
                        <button
                          onClick={() => handleDocumentView(selectedContract.id, 'family_register')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          미리보기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">통장사본</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload(selectedContract.id, 'bank_account', file);
                          }
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedContract.documents?.bank_account && (
                        <button
                          onClick={() => handleDocumentView(selectedContract.id, 'bank_account')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          조회
                        </button>
                      )}
                    </div>
                    {selectedContract.documents?.bank_account && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                          {documentThumbnails[`${selectedContract.id}_bank_account`] ? (
                            <img 
                              src={documentThumbnails[`${selectedContract.id}_bank_account`]} 
                              alt="통장사본 썸네일"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-yellow-100 rounded-lg flex items-center justify-center ${documentThumbnails[`${selectedContract.id}_bank_account`] ? 'hidden' : ''}`}>
                            <span className="text-yellow-600 font-bold text-sm">통장</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">통장사본</p>
                          <p className="text-xs text-gray-500">{selectedContract.documents.bank_account}</p>
                        </div>
                        <button
                          onClick={() => handleDocumentView(selectedContract.id, 'bank_account')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          미리보기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
