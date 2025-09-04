'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HourlyWage {
  id: number;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  base_wage: number;
  overtime_multiplier: number;
  night_shift_multiplier: number;
  holiday_multiplier: number;
  effective_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department: string;
}

export default function HourlyWagesPage() {
  const [wages, setWages] = useState<HourlyWage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWage, setEditingWage] = useState<HourlyWage | null>(null);
  const [newWage, setNewWage] = useState({
    employee_id: '',
    base_wage: 12000, // 기본 시급을 12,000원으로 변경
    overtime_multiplier: 1.0, // 초과 근무 가중치 기본값 1.0 (수당 없음)
    night_shift_multiplier: 1.0, // 야간 근무 가중치 기본값 1.0 (수당 없음)
    holiday_multiplier: 1.0, // 휴일 근무 가중치 기본값 1.0 (수당 없음)
    effective_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 직원 목록 로드 (부서 정보 포함)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id, 
          name, 
          employee_id, 
          department_id,
          departments!inner(name)
        `)
        .order('name');

      if (employeesError) {
        console.error('직원 목록 조회 오류:', employeesError);
        throw employeesError;
      }
      
      // 직원 데이터 포맷팅
      const formattedEmployees = (employeesData || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        employee_id: emp.employee_id,
        department: emp.departments?.name || '부서 미지정'
      }));
      
      setEmployees(formattedEmployees);
      console.log('직원 목록 로드 완료:', formattedEmployees.length, '명');

      // 시급 데이터 로드
      const { data: wagesData, error: wagesError } = await supabase
        .from('hourly_wages')
        .select(`
          *,
          employees!inner(name, employee_id)
        `)
        .order('effective_date', { ascending: false });

      if (wagesError) {
        console.error('시급 데이터 조회 오류:', wagesError);
        throw wagesError;
      }
      
      console.log('시급 데이터 로드 완료:', wagesData?.length || 0, '건');
      
      // 데이터 정리
      const formattedWages = (wagesData || []).map(wage => ({
        ...wage,
        employee_name: wage.employees.name,
        employee_code: wage.employees.employee_id
      }));
      
      setWages(formattedWages);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWage = async () => {
    if (!newWage.employee_id || newWage.base_wage <= 0) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('hourly_wages')
        .insert([newWage]);

      if (error) throw error;

      alert('시급이 성공적으로 등록되었습니다.');
      setNewWage({
        employee_id: '',
        base_wage: 12000, // 기본 시급을 12,000원으로 변경
        overtime_multiplier: 1.0, // 초과 근무 가중치 기본값 1.0 (수당 없음)
        night_shift_multiplier: 1.0, // 야간 근무 가중치 기본값 1.0 (수당 없음)
        holiday_multiplier: 1.0, // 휴일 근무 가중치 기본값 1.0 (수당 없음)
        effective_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      console.error('시급 등록 오류:', error);
      alert('시급 등록에 실패했습니다.');
    }
  };

  const handleUpdateWage = async () => {
    if (!editingWage) return;

    try {
      const { error } = await supabase
        .from('hourly_wages')
        .update({
          base_wage: editingWage.base_wage,
          overtime_multiplier: editingWage.overtime_multiplier,
          night_shift_multiplier: editingWage.night_shift_multiplier,
          holiday_multiplier: editingWage.holiday_multiplier,
          effective_date: editingWage.effective_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingWage.id);

      if (error) throw error;

      alert('시급이 성공적으로 수정되었습니다.');
      setEditingWage(null);
      loadData();
    } catch (error) {
      console.error('시급 수정 오류:', error);
      alert('시급 수정에 실패했습니다.');
    }
  };

  const handleDeleteWage = async (id: number) => {
    if (!confirm('정말로 이 시급 정보를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('hourly_wages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('시급이 성공적으로 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('시급 삭제 오류:', error);
      alert('시급 삭제에 실패했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">시급 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">💰 시급 관리</h1>
          
          {/* 새 시급 등록 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">➕ 새 시급 등록</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">직원 선택</label>
                <select
                  value={newWage.employee_id}
                  onChange={(e) => setNewWage({ ...newWage, employee_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">직원을 선택하세요</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기본 시급 (원)</label>
                <input
                  type="number"
                  value={newWage.base_wage}
                  onChange={(e) => setNewWage({ ...newWage, base_wage: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="15000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">초과 근무 가중치</label>
                <div className="text-xs text-gray-500 mb-1">1.0 = 수당 없음, 1.5 = 50% 추가</div>
                <input
                  type="number"
                  step="0.1"
                  value={newWage.overtime_multiplier}
                  onChange={(e) => setNewWage({ ...newWage, overtime_multiplier: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">야간 근무 가중치</label>
                <div className="text-xs text-gray-500 mb-1">1.0 = 수당 없음, 1.3 = 30% 추가</div>
                <input
                  type="number"
                  step="0.1"
                  value={newWage.night_shift_multiplier}
                  onChange={(e) => setNewWage({ ...newWage, night_shift_multiplier: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">휴일 근무 가중치</label>
                <div className="block text-xs text-gray-500 mb-1">1.0 = 수당 없음, 2.0 = 100% 추가</div>
                <input
                  type="number"
                  step="0.1"
                  value={newWage.holiday_multiplier}
                  onChange={(e) => setNewWage({ ...newWage, holiday_multiplier: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">적용 시작일</label>
                <input
                  type="date"
                  value={newWage.effective_date}
                  onChange={(e) => setNewWage({ ...newWage, effective_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleCreateWage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>시급 등록</span>
              </button>
              
              {/* 프리셋 버튼들 */}
              <button
                onClick={() => setNewWage({
                  ...newWage,
                  overtime_multiplier: 1.0,
                  night_shift_multiplier: 1.0,
                  holiday_multiplier: 1.0
                })}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
              >
                🏪 프랜차이즈 스타일 (수당 없음)
              </button>
              
              <button
                onClick={() => setNewWage({
                  ...newWage,
                  overtime_multiplier: 1.5,
                  night_shift_multiplier: 1.0,
                  holiday_multiplier: 1.0
                })}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
              >
                ⚖️ 법정 기준 (초과근무만)
              </button>
              
              <button
                onClick={() => setNewWage({
                  ...newWage,
                  overtime_multiplier: 1.5,
                  night_shift_multiplier: 1.3,
                  holiday_multiplier: 2.0
                })}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm"
              >
                💎 프리미엄 (모든 수당)
              </button>
            </div>
          </div>

          {/* 시급 목록 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">📋 등록된 시급 목록</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직원</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기본 시급</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">초과 근무</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">야간 근무</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">휴일 근무</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">적용 시작일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wages.map((wage) => (
                    <tr key={wage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{wage.employee_name}</div>
                          <div className="text-sm text-gray-500">{wage.employee_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(wage.base_wage)}원
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {wage.overtime_multiplier === 1.0 ? '수당 없음' : `${wage.overtime_multiplier}배`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {wage.night_shift_multiplier === 1.0 ? '수당 없음' : `${wage.night_shift_multiplier}배`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {wage.holiday_multiplier === 1.0 ? '수당 없음' : `${wage.holiday_multiplier}배`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{wage.effective_date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingWage(wage)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWage(wage.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {editingWage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시급 수정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기본 시급 (원)</label>
                <input
                  type="number"
                  value={editingWage.base_wage}
                  onChange={(e) => setEditingWage({ ...editingWage, base_wage: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">초과 근무 가중치</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingWage.overtime_multiplier}
                  onChange={(e) => setEditingWage({ ...editingWage, overtime_multiplier: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">야간 근무 가중치</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingWage.night_shift_multiplier}
                  onChange={(e) => setEditingWage({ ...editingWage, night_shift_multiplier: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">휴일 근무 가중치</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingWage.holiday_multiplier}
                  onChange={(e) => setEditingWage({ ...editingWage, holiday_multiplier: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">적용 시작일</label>
                <input
                  type="date"
                  value={editingWage.effective_date}
                  onChange={(e) => setEditingWage({ ...editingWage, effective_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateWage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>저장</span>
              </button>
              <button
                onClick={() => setEditingWage(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>취소</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
