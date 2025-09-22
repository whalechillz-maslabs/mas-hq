'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Payslip {
  id: string;
  period: string;
  employment_type: string;
  base_salary: number;
  overtime_pay: number;
  incentive: number;
  point_bonus: number;
  total_earnings: number;
  tax_amount: number;
  net_salary: number;
  total_hours: number;
  hourly_rate: number;
  daily_details: Array<{
    date: string;
    hours: number;
    daily_wage: number;
    hourly_wage: number;
  }>;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');

  // 디버깅: selectedPayslip 상태 변화 추적
  useEffect(() => {
    console.log('selectedPayslip 상태 변화:', selectedPayslip);
  }, [selectedPayslip]);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      console.log('정산서 로딩 시작...');
      
      // Auth 체크 제거하고 김탁수로 직접 조회
      console.log('김탁수로 정산서를 조회합니다.');
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('name', '김탁수')
        .single();

      if (employeeError) {
        console.error('김탁수 직원 정보 조회 실패:', employeeError);
        return;
      }

      console.log('김탁수 직원 정보 조회 성공:', employee.name);
      setEmployeeName(employee.name);

      // 김탁수의 정산서 조회
      const { data: payslipData, error: payslipError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (payslipError) {
        console.error('정산서 조회 실패:', payslipError);
        return;
      }

      console.log('정산서 조회 성공:', payslipData?.length || 0, '개');
      setPayslips(payslipData || []);
    } catch (error) {
      console.error('오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      'issued': { text: '발급완료', color: 'bg-green-100 text-green-800' },
      'paid': { text: '지급완료', color: 'bg-blue-100 text-blue-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const printPayslip = () => {
    if (selectedPayslip) {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">정산서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">급여 명세서</h1>
          <p className="mt-2 text-gray-600">
            {employeeName}님의 급여 명세서를 확인하실 수 있습니다.
          </p>
        </div>

        {/* 정산서 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">정산서 목록</h2>
          </div>
          
          {payslips.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">아직 발급된 정산서가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      정산 기간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      근무 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 지급액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발급일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payslip.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payslip.total_hours}시간
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payslip.net_salary)}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payslip.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payslip.issued_at ? formatDate(payslip.issued_at) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            console.log('상세보기 클릭:', payslip);
                            setSelectedPayslip(payslip);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => {
                            console.log('인쇄 클릭:', payslip);
                            setSelectedPayslip(payslip);
                            setTimeout(printPayslip, 100);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          인쇄
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 정산서 상세 모달 */}
        {selectedPayslip && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedPayslip(null);
              }
            }}
          >
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              {/* 모달 닫기 버튼 */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="mt-3">
                {/* 정산서 헤더 */}
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">MASLABS 급여 명세서</h1>
                  <h2 className="text-lg text-gray-600 mt-2">{selectedPayslip.period}</h2>
                </div>

                {/* 직원 정보 */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">직원명</div>
                    <div className="font-medium">{employeeName}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">정산기간</div>
                    <div className="font-medium">{selectedPayslip.period}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">고용형태</div>
                    <div className="font-medium">
                      {selectedPayslip.employment_type === 'part_time' ? '파트타임' : '정규직'}
                    </div>
                  </div>
                </div>

                {/* 급여 요약 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">총 근무시간</div>
                    <div className="text-2xl font-bold text-blue-900">{selectedPayslip.total_hours}시간</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">총 지급액</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(selectedPayslip.net_salary)}원
                    </div>
                  </div>
                </div>

                {/* 급여 상세 */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">급여 상세</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span>기본급</span>
                        <span>{formatCurrency(selectedPayslip.base_salary)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>초과근무수당</span>
                        <span>{formatCurrency(selectedPayslip.overtime_pay)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>인센티브</span>
                        <span>{formatCurrency(selectedPayslip.incentive)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>포인트 보너스</span>
                        <span>{formatCurrency(selectedPayslip.point_bonus)}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>세금</span>
                        <span>{formatCurrency(selectedPayslip.tax_amount)}원</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>실지급액</span>
                        <span>{formatCurrency(selectedPayslip.net_salary)}원</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 일별 상세 */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">일별 근무 내역</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">근무시간</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">시급</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">일급</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPayslip.daily_details.map((detail, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{detail.date}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{detail.hours}시간</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(detail.hourly_wage)}원</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(detail.daily_wage)}원</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 푸터 */}
                <div className="text-center text-sm text-gray-500 border-t pt-4">
                  <p>본 급여 명세서는 MASLABS 시스템에서 자동 생성되었습니다.</p>
                  <p>발급일시: {selectedPayslip.issued_at ? formatDate(selectedPayslip.issued_at) : formatDate(selectedPayslip.created_at)}</p>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={printPayslip}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    인쇄
                  </button>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
