'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Edit, Trash2, Save, X, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  employee_count?: number;
}

export default function DepartmentManagementPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      
      // 부서 목록과 직원 수 조회
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          code,
          description
        `)
        .order('name');

      if (error) throw error;

      // 각 부서별 직원 수 조회
      const departmentsWithCount = await Promise.all(
        data.map(async (dept) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          
          return {
            ...dept,
            employee_count: count || 0
          };
        })
      );

      setDepartments(departmentsWithCount);
    } catch (error) {
      console.error('부서 로드 오류:', error);
      alert('부서 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('departments')
        .insert({
          name: formData.name,
          code: formData.code.toUpperCase(),
          description: formData.description
        });

      if (error) throw error;

      alert('부서가 성공적으로 추가되었습니다!');
      setShowAddForm(false);
      setFormData({ name: '', code: '', description: '' });
      loadDepartments();
    } catch (error) {
      console.error('부서 추가 오류:', error);
      alert('부서 추가에 실패했습니다.');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: formData.name,
          code: formData.code.toUpperCase(),
          description: formData.description
        })
        .eq('id', id);

      if (error) throw error;

      alert('부서가 성공적으로 수정되었습니다!');
      setEditingId(null);
      setFormData({ name: '', code: '', description: '' });
      loadDepartments();
    } catch (error) {
      console.error('부서 수정 오류:', error);
      alert('부서 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 부서를 삭제하시겠습니까?\n\n⚠️ 주의: 해당 부서에 소속된 직원이 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      // 해당 부서에 직원이 있는지 확인
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id);

      if (count && count > 0) {
        alert(`"${name}" 부서에는 ${count}명의 직원이 소속되어 있어 삭제할 수 없습니다.\n\n먼저 직원들을 다른 부서로 이동시켜주세요.`);
        return;
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('부서가 성공적으로 삭제되었습니다!');
      loadDepartments();
    } catch (error) {
      console.error('부서 삭제 오류:', error);
      alert('부서 삭제에 실패했습니다.');
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              부서 관리
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              새 부서 추가
            </button>
          </div>
          <p className="text-gray-600">
            회사의 부서 구조를 관리합니다. 부서 추가, 수정, 삭제가 가능합니다.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">부서 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white rounded-2xl shadow-lg p-6">
                {editingId === dept.id ? (
                  /* 편집 모드 */
                  <form onSubmit={(e) => { e.preventDefault(); handleEdit(dept.id); }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          부서명
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          부서 코드
                        </label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          설명
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <X className="h-4 w-4 mr-1" />
                          취소
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* 보기 모드 */
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(dept)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id, dept.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">코드:</span>
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{dept.code}</span>
                      </div>
                      
                      {dept.description && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">설명:</span>
                          <p className="mt-1">{dept.description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{dept.employee_count || 0}명 소속</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 새 부서 추가 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                새 부서 추가
              </h2>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    부서명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 마스골프팀"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    부서 코드 *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: MASGOLF"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="부서에 대한 설명을 입력하세요..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
