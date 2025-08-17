"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Clock, Users, Filter, Download,
  ChevronLeft, ChevronRight, Search, Eye,
  CheckCircle, XCircle, AlertCircle, Edit,
  FileText, TrendingUp, MapPin
} from "lucide-react";

// 타입 정의
interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workType: string;
  workHours: number;
  overtimeHours: number;
  status: 'approved' | 'pending' | 'rejected';
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

interface Department {
  id: string;
  name: string;
}

interface WorkType {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  department: string;
  status: string;
  searchTerm: string;
}

export default function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: '개발팀' },
    { id: '2', name: '디자인팀' },
    { id: '3', name: '마케팅팀' },
    { id: '4', name: '경영지원팀' }
  ]);
  const [workTypes] = useState<WorkType[]>([
    { id: '1', name: '정상근무', code: 'NORMAL', color: '#4CAF50' },
    { id: '2', name: '연장근무', code: 'OVERTIME', color: '#FF9800' },
    { id: '3', name: '휴일근무', code: 'HOLIDAY', color: '#2196F3' },
    { id: '4', name: '연차휴가', code: 'ANNUAL', color: '#9C27B0' },
    { id: '5', name: '병가', code: 'SICK', color: '#F44336' },
    { id: '6', name: '출장', code: 'BUSINESS_TRIP', color: '#00BCD4' },
    { id: '7', name: '재택근무', code: 'REMOTE', color: '#8BC34A' }
  ]);
  
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    status: '',
    searchTerm: ''
  });
  
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 샘플 데이터 로드
  useEffect(() => {
    loadAttendanceData();
  }, [filters]);

  const loadAttendanceData = () => {
    setLoading(true);
    // 샘플 데이터 생성
    const sampleData: AttendanceRecord[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: '홍길동',
        department: '개발팀',
        position: '과장',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '09:05',
        checkOutTime: '18:30',
        workType: '정상근무',
        workHours: 8.5,
        overtimeHours: 0.5,
        status: 'approved',
        location: {
          address: '서울시 강남구 테헤란로',
          latitude: 37.5665,
          longitude: 126.9780
        }
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: '김철수',
        department: '디자인팀',
        position: '대리',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '09:00',
        checkOutTime: null,
        workType: '정상근무',
        workHours: 0,
        overtimeHours: 0,
        status: 'pending',
        notes: '현재 근무 중'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: '이영희',
        department: '마케팅팀',
        position: '사원',
        date: new Date().toISOString().split('T')[0],
        checkInTime: null,
        checkOutTime: null,
        workType: '연차휴가',
        workHours: 0,
        overtimeHours: 0,
        status: 'approved',
        notes: '개인 사유'
      }
    ];
    
    setTimeout(() => {
      setAttendanceRecords(sampleData);
      setLoading(false);
    }, 500);
  };

  // 근태 승인
  const handleApprove = async (id: string) => {
    if (!confirm('이 근태 기록을 승인하시겠습니까?')) return;
    
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === id ? { ...record, status: 'approved' } : record
      )
    );
    alert('승인되었습니다.');
  };

  // 근태 반려
  const handleReject = async (id: string) => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (!reason) return;
    
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === id 
          ? { ...record, status: 'rejected', notes: `반려: ${reason}` } 
          : record
      )
    );
    alert('반려되었습니다.');
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    alert('엑셀 다운로드 기능은 준비 중입니다.');
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인';
      case 'pending': return '대기';
      case 'rejected': return '반려';
      default: return status;
    }
  };

  // 필터링된 데이터
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.includes(filters.searchTerm) ||
                         record.employeeId.includes(filters.searchTerm);
    const matchesDepartment = !filters.department || record.department === filters.department;
    const matchesStatus = !filters.status || record.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">근태 관리</h1>
        <p className="text-gray-600 mt-1">직원들의 출퇴근 기록을 관리하고 승인합니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오늘 출근</p>
              <p className="text-2xl font-bold text-gray-900">48</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">지각</p>
              <p className="text-2xl font-bold text-yellow-600">3</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">휴가</p>
              <p className="text-2xl font-bold text-purple-600">5</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-orange-600">7</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="approved">승인</option>
              <option value="pending">대기</option>
              <option value="rejected">반려</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="이름, 사번"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExcelDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    출근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    퇴근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    근무 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    근무 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.employeeName}</p>
                        <p className="text-xs text-gray-500">{record.employeeId} · {record.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkInTime || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOutTime || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {record.workType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workHours > 0 ? `${record.workHours}h` : '-'}
                      {record.overtimeHours > 0 && (
                        <span className="text-orange-600 ml-1">(+{record.overtimeHours}h)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="상세보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {record.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(record.id)}
                            className="text-green-600 hover:text-green-900 mr-2"
                            title="승인"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(record.id)}
                            className="text-red-600 hover:text-red-900"
                            title="반려"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  총 {filteredRecords.length}건 중 {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)}건 표시
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">근태 상세 정보</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">직원명</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">사번</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">부서</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직급</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.position}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">날짜</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRecord.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">근무 유형</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.workType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">출근 시간</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.checkInTime || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">퇴근 시간</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.checkOutTime || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">근무 시간</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRecord.workHours > 0 ? `${selectedRecord.workHours}시간` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">연장 근무</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRecord.overtimeHours > 0 ? `${selectedRecord.overtimeHours}시간` : '-'}
                  </p>
                </div>
              </div>

              {selectedRecord.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    출근 위치
                  </label>
                  <p className="text-sm text-gray-900">{selectedRecord.location.address}</p>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedRecord.status)}`}>
                  {getStatusText(selectedRecord.status)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
              {selectedRecord.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedRecord.id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedRecord.id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    반려
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
