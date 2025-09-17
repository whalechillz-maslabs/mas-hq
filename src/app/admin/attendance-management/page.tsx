'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '@/lib/supabase';
import { 
  Clock, MapPin, Users, Calendar, Filter, Download,
  Search, Eye, CheckCircle, XCircle, AlertCircle,
  TrendingUp, BarChart3, Download as DownloadIcon,
  Coffee, Edit3, Save, X, Trash2
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_id_code: string;
  employment_type: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  break_minutes: number;
  total_hours: number;
  overtime_hours: number;
  status: string;
  employee_note: string;
  manager_note: string;
  notes: string | null;
  schedule_count: number;
  first_schedule_start: string;
  location?: any; // 위치 정보
  total_break_minutes?: number; // 총 휴식 시간 (분)
  last_schedule_end: string;
}

export default function AttendanceManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: ''
  });

  // 위치 정보 가져오기 함수
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('위치 서비스가 지원되지 않습니다.'));
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  // 좌표를 주소로 변환하는 함수 (Reverse Geocoding)
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // 1. Google Maps Geocoding API 시도 (API 키가 있는 경우)
      if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=ko&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;
            
            // 시/도, 구/군, 동/읍/면 정보 추출
            let city = '';
            let district = '';
            let neighborhood = '';
            
            addressComponents.forEach((component: any) => {
              if (component.types.includes('administrative_area_level_1')) {
                city = component.long_name;
              } else if (component.types.includes('administrative_area_level_2')) {
                district = component.long_name;
              } else if (component.types.includes('sublocality_level_1') || 
                         component.types.includes('sublocality_level_2') ||
                         component.types.includes('neighborhood')) {
                neighborhood = component.long_name;
              }
            });
            
            // 주소 조합
            let address = '';
            if (city) address += city;
            if (district) address += ` ${district}`;
            if (neighborhood) address += ` ${neighborhood}`;
            
            return address.trim() || result.formatted_address;
          }
        }
      }
      
      // 2. 무료 Nominatim API 사용 (OpenStreetMap 기반)
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko&addressdetails=1`
      );
      
      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();
        
        if (data.display_name) {
          // 한국 주소 형식으로 변환
          const address = data.address;
          if (address) {
            let koreanAddress = '';
            if (address.state) koreanAddress += address.state;
            if (address.city || address.town || address.village) {
              koreanAddress += ` ${address.city || address.town || address.village}`;
            }
            if (address.suburb || address.neighbourhood) {
              koreanAddress += ` ${address.suburb || address.neighbourhood}`;
            }
            return koreanAddress.trim() || data.display_name;
          }
          return data.display_name;
        }
      }
      
      // 3. 모든 API 실패 시 좌표 반환
      throw new Error('모든 Geocoding API 실패');
      
    } catch (error) {
      console.warn('주소 변환 오류:', error);
      // 실패 시 좌표 반환
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  // 휴식 시간 계산 함수
  const calculateTotalBreakMinutes = (notes: string | null): number => {
    if (!notes) return 0;
    
    let totalMinutes = 0;
    
    // 휴식 시작과 종료 시간을 찾아서 총 휴식 시간 계산
    const breakStartMatches = notes.match(/휴식 시작: (오전|오후) (\d{2}:\d{2})/g);
    const breakEndMatches = notes.match(/휴식 후 복귀: (오전|오후) (\d{2}:\d{2})/g);
    
    if (breakStartMatches && breakEndMatches) {
      const breakPeriods: { start: string; end: string }[] = [];
      
      // 휴식 시작 시간들 파싱
      breakStartMatches.forEach(match => {
        const timeMatch = match.match(/휴식 시작: (오전|오후) (\d{2}:\d{2})/);
        if (timeMatch) {
          const period = timeMatch[1];
          const time = timeMatch[2];
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === '오후' && hours !== 12) hour24 += 12;
          if (period === '오전' && hours === 12) hour24 = 0;
          breakPeriods.push({ start: `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`, end: '' });
        }
      });
      
      // 휴식 종료 시간들 파싱
      breakEndMatches.forEach(match => {
        const timeMatch = match.match(/휴식 후 복귀: (오전|오후) (\d{2}:\d{2})/);
        if (timeMatch) {
          const period = timeMatch[1];
          const time = timeMatch[2];
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === '오후' && hours !== 12) hour24 += 12;
          if (period === '오전' && hours === 12) hour24 = 0;
          const endTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // 가장 가까운 시작 시간과 매칭
          for (let i = breakPeriods.length - 1; i >= 0; i--) {
            if (!breakPeriods[i].end) {
              breakPeriods[i].end = endTime;
              break;
            }
          }
        }
      });
      
      // 각 휴식 시간 계산
      breakPeriods.forEach(period => {
        if (period.start && period.end) {
          const [startHour, startMin] = period.start.split(':').map(Number);
          const [endHour, endMin] = period.end.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          totalMinutes += endMinutes - startMinutes;
        }
      });
    }
    
    return totalMinutes;
  };

  // 한국 시간 기준으로 오늘 날짜 설정
  const getKoreaToday = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreaTime.toISOString().split('T')[0];
  };

  // 위치 데이터 초기화 함수
  const clearLocationData = async () => {
    if (!confirm('모든 직원의 위치 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .update({ location: null })
        .eq('date', selectedDate);

      if (error) {
        throw error;
      }

      alert('위치 데이터가 성공적으로 초기화되었습니다.');
      loadData();
    } catch (error: any) {
      console.error('위치 데이터 초기화 오류:', error);
      alert(`위치 데이터 초기화에 실패했습니다: ${error.message}`);
    }
  };

  // 기존 좌표 데이터를 주소로 변환하는 함수
  const convertCoordinatesToAddress = async () => {
    if (!confirm('기존 좌표 데이터를 주소로 변환하시겠습니까? 이 작업은 시간이 걸릴 수 있습니다.')) {
      return;
    }

    try {
      // 현재 날짜의 출근 데이터 조회
      const { data: attendanceData, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (fetchError) {
        throw fetchError;
      }

      if (!attendanceData || attendanceData.length === 0) {
        alert('변환할 위치 데이터가 없습니다.');
        return;
      }

      let convertedCount = 0;
      
      for (const record of attendanceData) {
        if (record.location && 
            record.location.latitude && 
            record.location.longitude && 
            !record.location.address) {
          
          try {
            const address = await getAddressFromCoordinates(
              record.location.latitude, 
              record.location.longitude
            );
            
            const updatedLocation = {
              ...record.location,
              address: address,
              note: `위치 추적됨 - ${address}`
            };
            
            const { error: updateError } = await supabase
              .from('attendance')
              .update({ location: updatedLocation })
              .eq('id', record.id);
            
            if (updateError) {
              console.error('위치 업데이트 오류:', updateError);
            } else {
              convertedCount++;
            }
            
            // API 호출 제한을 위한 지연
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error('주소 변환 오류:', error);
          }
        }
      }
      
      alert(`${convertedCount}개의 위치 데이터가 주소로 변환되었습니다.`);
      loadData();
      
    } catch (error: any) {
      console.error('좌표 변환 오류:', error);
      alert(`좌표 변환에 실패했습니다: ${error.message}`);
    }
  };

  const [selectedDate, setSelectedDate] = useState(getKoreaToday());
  const [selectedDepartment, setSelectedDepartment] = useState('전체 부서');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedDate]);

  const checkUser = async () => {
    try {
      // localStorage 기반 인증 확인
      if (typeof window === 'undefined') return;
      
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const currentEmployee = localStorage.getItem('currentEmployee');
      
      if (!isLoggedIn || !currentEmployee) {
        router.push('/login');
        return;
      }
      
      const employee = JSON.parse(currentEmployee);
      
      // 관리자 권한 확인
      if (employee.role !== 'admin' && 
          employee.role !== 'manager' &&
          employee.name !== '김탁수') {
        router.push('/dashboard');
        return;
      }
      
      setCurrentUser(employee);
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      router.push('/login');
    }
  };

  // 관리자가 출근/퇴근 시간을 수정하는 함수
  const updateAttendanceTime = async (employeeId: string, date: string, checkInTime: string, checkOutTime: string) => {
    try {
      console.log(`🔄 출근/퇴근 시간 수정 시작:`, {
        employeeId,
        date,
        checkInTime,
        checkOutTime
      });
      
      // 먼저 해당 직원의 실제 UUID를 찾기
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, name')
        .eq('employee_id', employeeId)
        .single();
      
      if (employeeError) {
        console.error('❌ 직원 정보 조회 실패:', employeeError);
        throw new Error(`직원 정보를 찾을 수 없습니다: ${employeeId}`);
      }
      
      console.log('👤 직원 정보 조회 성공:', employeeData);
      
      // 위치 정보 가져오기
      let location = null;
      try {
        const position = await getCurrentLocation();
        
        // 좌표를 주소로 변환
        const address = await getAddressFromCoordinates(
          position.coords.latitude, 
          position.coords.longitude
        );
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          address: address,
          note: `위치 추적됨 - ${address}`
        };
        console.log('📍 위치 정보 가져오기 성공:', location);
      } catch (locationError) {
        console.warn('⚠️ 위치 정보를 가져올 수 없습니다:', locationError);
        // 위치 정보 없이도 수정 가능
        location = {
          latitude: 37.2934474, // 기본값 (수원시 영통구 법조로 149번길 200)
          longitude: 127.0714828,
          accuracy: null,
          timestamp: new Date().toISOString(),
          address: '수원시 영통구 법조로 149번길 200',
          note: '위치 정보 없음 - 수원시 영통구 법조로 149번길 200'
        };
      }
      
      // 근무 시간 계산 (정리된 시간 사용)
      let totalHours = 0;
      const cleanCheckInTime = checkInTime && checkInTime.trim() !== '' ? checkInTime.trim() : null;
      const cleanCheckOutTime = checkOutTime && checkOutTime.trim() !== '' ? checkOutTime.trim() : null;
      
      if (cleanCheckInTime && cleanCheckOutTime) {
        const startTime = new Date(`2000-01-01T${cleanCheckInTime}`);
        const endTime = new Date(`2000-01-01T${cleanCheckOutTime}`);
        totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      }
      
      console.log('📊 계산된 근무 시간:', totalHours);
      
      console.log('🧹 정리된 시간:', {
        originalCheckIn: checkInTime,
        originalCheckOut: checkOutTime,
        cleanCheckIn: cleanCheckInTime,
        cleanCheckOut: cleanCheckOutTime
      });
      
      // attendance 테이블 업데이트 또는 생성 (실제 UUID 사용)
      const { error: updateError } = await supabase
        .from('attendance')
        .upsert({
          employee_id: employeeData.id, // 실제 UUID 사용
          date: date,
          check_in_time: cleanCheckInTime, // 정리된 시간 사용
          check_out_time: cleanCheckOutTime, // 정리된 시간 사용
          total_hours: totalHours,
          overtime_hours: 0,
          status: cleanCheckOutTime ? 'completed' : 'present',
          location: location, // 위치 정보 추가
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,date'
        });
      
      if (updateError) {
        console.error('❌ 출근/퇴근 시간 수정 실패:', updateError);
        throw updateError;
      } else {
        console.log('✅ 출근/퇴근 시간 수정 완료');
        // 데이터 다시 로드
        loadData();
      }
    } catch (error) {
      console.error('출근/퇴근 시간 수정 오류:', error);
      throw error;
    }
  };

  // 편집 모드 시작
  const startEdit = (record: AttendanceRecord) => {
    setEditingRecord(record.employee_id_code); // MASLABS-003 형식 사용
    setEditForm({
      checkInTime: record.actual_start ? record.actual_start.split('T')[1]?.substring(0, 5) || '' : '',
      checkOutTime: record.actual_end ? record.actual_end.split('T')[1]?.substring(0, 5) || '' : ''
    });
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingRecord(null);
    setEditForm({ checkInTime: '', checkOutTime: '' });
  };

  // 편집 저장
  const saveEdit = async (record: AttendanceRecord) => {
    try {
      console.log('💾 편집 저장 시작:', {
        record: record,
        editForm: editForm
      });

      await updateAttendanceTime(
        record.employee_id_code, // MASLABS-003 형식 사용
        record.schedule_date,
        editForm.checkInTime,
        editForm.checkOutTime
      );
      
      setEditingRecord(null);
      setEditForm({ checkInTime: '', checkOutTime: '' });
      alert('출근/퇴근 시간이 성공적으로 수정되었습니다.');
    } catch (error: any) {
      console.error('❌ 편집 저장 실패:', error);
      alert(`출근/퇴근 시간 수정에 실패했습니다.\n오류: ${error.message || error}`);
    }
  };

  // 상세보기 함수
  const viewDetails = (record: AttendanceRecord) => {
    const details = `
직원 정보:
- 이름: ${record.employee_name}
- 사번: ${record.employee_id_code}
- 고용형태: ${record.employment_type}

출근 정보:
- 스케줄: ${record.scheduled_start ? formatTime(record.scheduled_start) : '-'} ~ ${record.scheduled_end ? formatTime(record.scheduled_end) : '-'}
- 실제 출근: ${formatTime(record.actual_start)}
- 실제 퇴근: ${formatTime(record.actual_end)}
- 근무 시간: ${record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
- 상태: ${getStatusText(getActualStatus(record))}

위치 정보:
- 위치 추적: 비활성화됨
    `;
    alert(details);
  };

  // 통계보기 함수
  const viewStatistics = (record: AttendanceRecord) => {
    const stats = `
${record.employee_name} 통계 정보:

오늘 근무 현황:
- 출근 시간: ${formatTime(record.actual_start)}
- 퇴근 시간: ${formatTime(record.actual_end)}
- 총 근무시간: ${record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
- 상태: ${getStatusText(getActualStatus(record))}

참고: 상세한 월별/주별 통계는 추후 구현 예정입니다.
    `;
    alert(stats);
  };

  // 스케줄 삭제 함수
  const deleteSchedule = async (record: AttendanceRecord) => {
    // 스케줄이 없는 경우 삭제 불가
    if (!record.scheduled_start || !record.scheduled_end) {
      alert('삭제할 스케줄이 없습니다.');
      return;
    }

    if (!confirm(`${record.employee_name}의 ${record.schedule_date} 스케줄을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log('🗑️ 스케줄 삭제 시작:', {
        scheduleId: record.id,
        employeeName: record.employee_name,
        scheduleDate: record.schedule_date,
        scheduledStart: record.scheduled_start,
        scheduledEnd: record.scheduled_end
      });

      // schedules 테이블에서 스케줄 삭제
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', record.id);

      if (deleteError) {
        console.error('❌ 스케줄 삭제 실패:', deleteError);
        alert(`스케줄 삭제에 실패했습니다: ${deleteError.message}`);
        return;
      }

      console.log('✅ 스케줄 삭제 완료');
      alert('스케줄이 성공적으로 삭제되었습니다.');
      
      // 데이터 다시 로드
      loadData();
    } catch (error: any) {
      console.error('스케줄 삭제 오류:', error);
      alert(`스케줄 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 출근 기록 삭제 함수
  const deleteAttendanceRecord = async (record: AttendanceRecord) => {
    if (!confirm(`${record.employee_name}의 ${record.schedule_date} 출근 기록을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      console.log('🗑️ 출근 기록 삭제 시작:', {
        attendanceId: record.id,
        employeeName: record.employee_name,
        scheduleDate: record.schedule_date
      });

      // attendance 테이블에서 출근 기록 삭제
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('id', record.id);

      if (deleteError) {
        console.error('❌ 출근 기록 삭제 실패:', deleteError);
        alert(`출근 기록 삭제에 실패했습니다: ${deleteError.message}`);
        return;
      }

      console.log('✅ 출근 기록 삭제 완료');
      alert('출근 기록이 성공적으로 삭제되었습니다.');
      
      // 데이터 다시 로드
      loadData();
    } catch (error: any) {
      console.error('출근 기록 삭제 오류:', error);
      alert(`출근 기록 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 휴식 시간 수정 함수
  const editBreakTime = async (record: AttendanceRecord) => {
    const currentBreakMinutes = record.total_break_minutes || 0;
    const currentBreakHours = Math.floor(currentBreakMinutes / 60);
    const currentBreakMins = currentBreakMinutes % 60;
    
    const breakTimeInput = prompt(
      `${record.employee_name}의 휴식 시간을 입력하세요:\n\n` +
      `현재: ${currentBreakHours}시간 ${currentBreakMins}분\n\n` +
      `입력 형식: "1시간 30분" 또는 "90분" 또는 "1.5시간"`,
      `${currentBreakHours}시간 ${currentBreakMins}분`
    );

    if (!breakTimeInput) return;

    try {
      // 입력된 시간을 분으로 변환
      let totalMinutes = 0;
      const input = breakTimeInput.trim();
      
      // "1시간 30분" 형식
      if (input.includes('시간') && input.includes('분')) {
        const hourMatch = input.match(/(\d+)시간/);
        const minMatch = input.match(/(\d+)분/);
        const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
        const minutes = minMatch ? parseInt(minMatch[1]) : 0;
        totalMinutes = hours * 60 + minutes;
      }
      // "90분" 형식
      else if (input.includes('분')) {
        const minMatch = input.match(/(\d+)분/);
        if (minMatch) {
          totalMinutes = parseInt(minMatch[1]);
        }
      }
      // "1.5시간" 형식
      else if (input.includes('시간')) {
        const hourMatch = input.match(/(\d+(?:\.\d+)?)시간/);
        if (hourMatch) {
          totalMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
        }
      }
      // 숫자만 입력된 경우 (분으로 간주)
      else if (/^\d+$/.test(input)) {
        totalMinutes = parseInt(input);
      }
      else {
        alert('올바른 형식으로 입력해주세요. 예: "1시간 30분", "90분", "1.5시간"');
        return;
      }

      if (totalMinutes < 0) {
        alert('휴식 시간은 0분 이상이어야 합니다.');
        return;
      }

      console.log('⏰ 휴식 시간 수정 시작:', {
        employeeName: record.employee_name,
        scheduleDate: record.schedule_date,
        currentBreakMinutes,
        newBreakMinutes: totalMinutes
      });

      // attendance 테이블에서 휴식 시간 업데이트
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          break_minutes: totalMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (updateError) {
        console.error('❌ 휴식 시간 수정 실패:', updateError);
        alert(`휴식 시간 수정에 실패했습니다: ${updateError.message}`);
        return;
      }

      console.log('✅ 휴식 시간 수정 완료');
      alert(`휴식 시간이 ${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분으로 수정되었습니다.`);
      
      // 데이터 다시 로드
      loadData();
    } catch (error: any) {
      console.error('휴식 시간 수정 오류:', error);
      alert(`휴식 시간 수정 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("출근 데이터 로딩 시작...", { selectedDate });

      // 1. 스케줄 데이터 조회
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          *,
          employees!schedules_employee_id_fkey (
            id,
            name,
            employee_id,
            employment_type
          )
        `)
        .eq('schedule_date', selectedDate)
        .order('scheduled_start', { ascending: true });

      if (scheduleError) {
        console.error('스케줄 데이터 조회 오류:', scheduleError);
        throw scheduleError;
      }

      console.log(`📅 ${selectedDate} 스케줄 데이터:`, scheduleData?.length || 0);

      // 2. 출근 데이터 조회
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (attendanceError) {
        console.error('출근 데이터 조회 오류:', attendanceError);
        throw attendanceError;
      }

      console.log(`📊 ${selectedDate} 출근 데이터:`, attendanceData?.length || 0);

      // 3. 데이터 변환 및 병합
      const employeeMap = new Map();
      
      // 스케줄 데이터 처리 - 각 스케줄을 별도 레코드로 처리
      if (scheduleData) {
        scheduleData.forEach(schedule => {
          const employee = schedule.employees;
          if (!employee) return;

          // 각 스케줄을 고유한 키로 처리 (employee_id + scheduled_start)
          const scheduleKey = `${schedule.employee_id}_${schedule.scheduled_start}`;
          
          employeeMap.set(scheduleKey, {
            id: schedule.id,
            employee_id: schedule.employee_id,
            employee_name: employee.name,
            employee_id_code: employee.employee_id,
            employment_type: employee.employment_type || "미지정",
            schedule_date: schedule.schedule_date,
            scheduled_start: schedule.scheduled_start,
            scheduled_end: schedule.scheduled_end,
            actual_start: schedule.actual_start,
            actual_end: schedule.actual_end,
            break_minutes: schedule.break_minutes || 0,
            total_hours: 0,
            overtime_hours: 0,
            status: schedule.status || 'pending',
            employee_note: schedule.employee_note || "",
            manager_note: schedule.manager_note || "",
            notes: null,
            schedule_count: 1,
            first_schedule_start: schedule.scheduled_start,
            last_schedule_end: schedule.scheduled_end
          });
        });
      }

      // 출근 데이터와 병합
      if (attendanceData) {
        for (const attendance of attendanceData) {
          const employeeId = attendance.employee_id;
          
          // 해당 직원의 모든 스케줄에 출근 데이터 적용
          for (const [key, record] of employeeMap.entries()) {
            if (record.employee_id === employeeId) {
              record.actual_start = attendance.check_in_time ? `${selectedDate}T${attendance.check_in_time}` : null;
              record.actual_end = attendance.check_out_time ? `${selectedDate}T${attendance.check_out_time}` : null;
              record.total_hours = attendance.total_hours || 0;
              record.overtime_hours = attendance.overtime_hours || 0;
              record.status = attendance.status || record.status;
              record.notes = attendance.notes || null;
              record.location = attendance.location || null;
              record.total_break_minutes = calculateTotalBreakMinutes(attendance.notes);
            }
          }
          
          // 출근 데이터만 있고 스케줄이 없는 경우
          const hasSchedule = Array.from(employeeMap.values()).some(record => record.employee_id === employeeId);
          if (!hasSchedule) {
            const { data: employee } = await supabase
              .from('employees')
              .select('name, employee_id, employment_type')
              .eq('id', attendance.employee_id)
              .single();

            if (employee) {
              const noScheduleKey = `${employeeId}_no_schedule`;
              employeeMap.set(noScheduleKey, {
                id: attendance.id,
                employee_id: attendance.employee_id,
                employee_name: employee.name,
                employee_id_code: employee.employee_id,
                employment_type: employee.employment_type || "미지정",
                schedule_date: selectedDate,
                scheduled_start: null,
                scheduled_end: null,
                actual_start: attendance.check_in_time ? `${selectedDate}T${attendance.check_in_time}` : null,
                actual_end: attendance.check_out_time ? `${selectedDate}T${attendance.check_out_time}` : null,
                break_minutes: 0,
                total_hours: attendance.total_hours || 0,
                overtime_hours: attendance.overtime_hours || 0,
                status: attendance.status || 'pending',
                employee_note: "",
                manager_note: "",
                schedule_count: 0,
                first_schedule_start: null,
                last_schedule_end: null
              });
            }
          }
        }
      }

      const records = Array.from(employeeMap.values());
      setAttendanceRecords(records);
      console.log('✅ 출근 데이터 로딩 완료:', records.length);

    } catch (error) {
      console.error("출근 데이터 로딩 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 포맷팅 함수
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    
    // 시간만 있는 경우 (HH:MM:SS 형식) - 스케줄 시간은 이미 한국 시간이므로 변환하지 않음
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      try {
        const [hours, minutes] = timeString.split(':').map(Number);
        // 스케줄 시간은 이미 한국 시간이므로 그대로 사용
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('시간 변환 오류:', error, timeString);
        return timeString.substring(0, 5); // 파싱 실패 시 원본 반환
      }
    }
    
    // ISO 날짜 형식인 경우 - 이미 한국 시간이므로 추가 변환 불필요
    try {
      const date = new Date(timeString);
      
      // 이미 한국 시간이므로 추가 변환 없이 바로 시간 추출
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('시간 변환 오류:', error, timeString);
      return timeString; // 파싱 실패 시 원본 반환
    }
  };

  // 근무 시간 포맷팅 함수
  const formatWorkTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  // 스케줄 시간 포맷팅 함수
  const formatScheduleDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    
    try {
      const startTime = new Date(`2000-01-01T${start}`);
      const endTime = new Date(`2000-01-01T${end}`);
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      return `${Math.round(diffHours)}h`;
    } catch (error) {
      return '-';
    }
  };

  // 상태 확인 함수 - 휴식 상태 감지 로직 및 시간 기반 상태 판단 추가
  const getActualStatus = (record: AttendanceRecord) => {
    // 휴식 상태 확인 (schedules 테이블의 status가 'break'인 경우)
    if (record.status === 'break') {
      return 'break';
    }
    
    // 휴식 메모 확인 (employee_note에 '휴식 시작'이 있는 경우)
    if (record.employee_note && 
        record.employee_note.includes('휴식 시작') && 
        !record.employee_note.includes('휴식 후 복귀')) {
      return 'break';
    }
    
    // attendance 테이블의 notes 필드에서 휴식 상태 확인
    if (record.notes && 
        record.notes.includes('휴식 시작') && 
        !record.notes.includes('휴식 후 복귀')) {
      return 'break';
    }
    
    // 출근한 경우
    if (record.actual_start) {
      if (!record.actual_end) return 'working';
      return 'completed';
    }
    
    // 출근하지 않은 경우 - 스케줄 시간을 고려한 상태 판단
    if (record.scheduled_start) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // 현재 시간을 분으로 변환
      
      // 스케줄 시작 시간을 분으로 변환
      const [scheduleHour, scheduleMinute] = record.scheduled_start.split(':').map(Number);
      const scheduleStartTime = scheduleHour * 60 + scheduleMinute;
      
      // 아직 출근 시간이 안된 경우
      if (currentTime < scheduleStartTime) {
        return 'pending';
      }
      
      // 출근 시간이 지났는데 출근하지 않은 경우
      return 'not_checked_in';
    }
    
    // 스케줄이 없는 경우
    return 'not_checked_in';
  };

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'working': return 'text-blue-600 bg-blue-100';
      case 'break': return 'text-orange-600 bg-orange-100';
      case 'not_checked_in': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'working': return <Clock className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'not_checked_in': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'working': return '근무중';
      case 'break': return '휴식중';
      case 'not_checked_in': return '미출근';
      case 'pending': return '대기중';
      default: return '대기';
    }
  };

  // 필터링된 데이터
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // 통계 계산 - 직원별로 중복 제거하여 계산
  const uniqueEmployees = new Map();
  filteredRecords.forEach(record => {
    if (!uniqueEmployees.has(record.employee_id)) {
      uniqueEmployees.set(record.employee_id, record);
    }
  });
  
  const uniqueRecords = Array.from(uniqueEmployees.values());
  const completedCount = uniqueRecords.filter(r => getActualStatus(r) === 'completed').length;
  const workingCount = uniqueRecords.filter(r => getActualStatus(r) === 'working').length;
  const breakCount = uniqueRecords.filter(r => getActualStatus(r) === 'break').length;
  const notCheckedInCount = uniqueRecords.filter(r => getActualStatus(r) === 'not_checked_in').length;
  const pendingCount = uniqueRecords.filter(r => getActualStatus(r) === 'pending').length;
  
  const avgHours = filteredRecords.length > 0 
    ? filteredRecords.reduce((sum, r) => sum + r.total_hours, 0) / filteredRecords.length 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">출근 관리</h1>
              <p className="mt-2 text-gray-600">직원들의 출근체크 위치/시간 확인 및 관리</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={convertCoordinatesToAddress}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                좌표→주소 변환
              </button>
              <button 
                onClick={clearLocationData}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                위치 데이터 초기화
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                디버그 보기
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                엑셀 다운로드
              </button>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체 부서">전체 부서</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="이름 또는 사번"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                필터 적용
              </button>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">출근 완료</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">근무 중</p>
                <p className="text-2xl font-bold text-blue-600">{workingCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Coffee className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">휴식 중</p>
                <p className="text-2xl font-bold text-orange-600">{breakCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">미출근</p>
                <p className="text-2xl font-bold text-red-600">{notCheckedInCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 근무시간</p>
                <p className="text-2xl font-bold text-purple-600">
                  {avgHours > 0 ? formatWorkTime(avgHours) : '0h 0m'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 출근 기록 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">출근 기록</h2>
            <p className="text-sm text-gray-600">총 {uniqueRecords.length}명의 기록 ({filteredRecords.length}개 스케줄)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    스케줄
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실제 출근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    휴식 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실제 퇴근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    근무 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    위치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const actualStatus = getActualStatus(record);
                  return (
                    <tr key={record.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {record.employee_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.employee_id_code} • {record.employment_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.scheduled_start && record.scheduled_end ? (
                            <>
                              {formatTime(record.scheduled_start)} - {formatTime(record.scheduled_end)}
                              <br />
                              <span className="text-xs text-gray-500">
                                ({formatScheduleDuration(record.scheduled_start, record.scheduled_end)})
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">---</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRecord === record.employee_id_code ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium mb-1">실제 출근</div>
                            <input
                              type="time"
                              value={editForm.checkInTime}
                              onChange={(e) => setEditForm({...editForm, checkInTime: e.target.value})}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">실제 출근</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(record.actual_start)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="text-sm text-gray-900 cursor-pointer hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                          onClick={() => editBreakTime(record)}
                          title="클릭하여 휴식 시간 수정"
                        >
                          {record.total_break_minutes && record.total_break_minutes > 0 
                            ? `${Math.floor(record.total_break_minutes / 60)}h ${record.total_break_minutes % 60}m`
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRecord === record.employee_id_code ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium mb-1">실제 퇴근</div>
                            <input
                              type="time"
                              value={editForm.checkOutTime}
                              onChange={(e) => setEditForm({...editForm, checkOutTime: e.target.value})}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">실제 퇴근</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(record.actual_end)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">
                          {record.location 
                            ? (record.location.address || 
                               record.location.note || 
                               (record.location.latitude && record.location.longitude 
                                 ? `위치 추적됨 (${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)})`
                                 : '위치 추적됨'))
                            : '위치 없음'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(actualStatus)}`}>
                          {getStatusIcon(actualStatus)}
                          <span className="ml-1">{getStatusText(actualStatus)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingRecord === record.employee_id_code ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => saveEdit(record)}
                              className="text-green-600 hover:text-green-900"
                              title="저장"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-900"
                              title="취소"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => startEdit(record)}
                              className="text-blue-600 hover:text-blue-900"
                              title="출근/퇴근 시간 수정"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => viewDetails(record)}
                              className="text-indigo-600 hover:text-indigo-900" 
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => viewStatistics(record)}
                              className="text-green-600 hover:text-green-900" 
                              title="통계보기"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => editBreakTime(record)}
                              className="text-orange-600 hover:text-orange-900" 
                              title="휴식 시간 수정"
                            >
                              <Coffee className="w-4 h-4" />
                            </button>
                            {record.scheduled_start && record.scheduled_end ? (
                              <button 
                                onClick={() => deleteSchedule(record)}
                                className="text-red-600 hover:text-red-900" 
                                title="스케줄 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => deleteAttendanceRecord(record)}
                                className="text-red-600 hover:text-red-900" 
                                title="출근 기록 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}