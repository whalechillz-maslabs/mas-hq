// 포맷 관련 유틸리티 함수

/**
 * 숫자를 통화 형식으로 포맷
 * @param amount - 금액
 * @returns 포맷된 금액 (예: ₩1,234,567)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₩0';
  
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷
 * @param num - 숫자
 * @returns 포맷된 숫자 (예: 1,234,567)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  return new Intl.NumberFormat('ko-KR').format(num);
}

/**
 * 백분율 포맷
 * @param value - 값 (0-1 또는 0-100)
 * @param isDecimal - 0-1 범위인지 여부
 * @returns 포맷된 백분율 (예: 75.5%)
 */
export function formatPercentage(value: number, isDecimal: boolean = false): string {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
}

/**
 * 파일 크기 포맷
 * @param bytes - 바이트 크기
 * @returns 포맷된 크기 (예: 1.5 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 이름 마스킹
 * @param name - 이름
 * @returns 마스킹된 이름 (예: 홍*동)
 */
export function maskName(name: string | null | undefined): string {
  if (!name || name.length < 2) return name || '';
  
  if (name.length === 2) {
    return `${name[0]}*`;
  }
  
  const firstChar = name[0];
  const lastChar = name[name.length - 1];
  const masked = '*'.repeat(name.length - 2);
  
  return `${firstChar}${masked}${lastChar}`;
}

/**
 * 이메일 마스킹
 * @param email - 이메일
 * @returns 마스킹된 이메일 (예: h***@example.com)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  if (username.length <= 3) {
    return `${username[0]}***@${domain}`;
  }
  
  const visibleChars = Math.min(3, Math.floor(username.length / 2));
  const masked = username.slice(0, visibleChars) + '***';
  
  return `${masked}@${domain}`;
}

/**
 * 사번 생성
 * @param prefix - 접두사 (기본: MASLABS)
 * @param number - 번호
 * @param digits - 자릿수 (기본: 3)
 * @returns 사번 (예: MASLABS-001)
 */
export function generateEmployeeId(
  number: number,
  prefix: string = 'MASLABS',
  digits: number = 3
): string {
  const paddedNumber = String(number).padStart(digits, '0');
  return `${prefix}-${paddedNumber}`;
}

/**
 * 상태 라벨 가져오기
 */
export function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': '활성',
    'inactive': '비활성',
    'pending': '대기',
    'confirmed': '확정',
    'completed': '완료',
    'refunded': '환불',
    'cancelled': '취소',
    'approved': '승인',
    'rejected': '반려',
    'draft': '임시저장',
    'paid': '지급완료',
    'on_leave': '휴직',
    'resigned': '퇴사'
  };
  
  return statusMap[status] || status;
}

/**
 * 상태별 색상 클래스 가져오기
 */
export function getStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'refunded': 'bg-red-100 text-red-800',
    'cancelled': 'bg-red-100 text-red-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'draft': 'bg-gray-100 text-gray-800',
    'paid': 'bg-purple-100 text-purple-800',
    'on_leave': 'bg-orange-100 text-orange-800',
    'resigned': 'bg-gray-100 text-gray-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * 우선순위별 색상 클래스
 */
export function getPriorityColor(priority: string): string {
  const colorMap: { [key: string]: string } = {
    'low': 'bg-gray-100 text-gray-600',
    'normal': 'bg-blue-100 text-blue-600',
    'high': 'bg-orange-100 text-orange-600',
    'urgent': 'bg-red-100 text-red-600'
  };
  
  return colorMap[priority] || 'bg-gray-100 text-gray-600';
}

/**
 * 우선순위 라벨
 */
export function getPriorityLabel(priority: string): string {
  const labelMap: { [key: string]: string } = {
    'low': '낮음',
    'normal': '보통',
    'high': '높음',
    'urgent': '긴급'
  };
  
  return labelMap[priority] || priority;
}

/**
 * 고용 형태 라벨
 */
export function getEmploymentTypeLabel(type: string): string {
  const typeMap: { [key: string]: string } = {
    'full_time': '정규직',
    'part_time': '파트타임',
    'contract': '계약직',
    'intern': '인턴',
    'freelance': '프리랜서'
  };
  
  return typeMap[type] || type;
}

/**
 * 시간을 읽기 쉬운 형식으로
 * @param hours - 시간
 * @returns 포맷된 시간 (예: 8시간 30분)
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/**
 * 초기값 설정
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return name.slice(0, 2).toUpperCase();
  }
  
  return parts.map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * 은행 계좌 포맷
 */
export function formatBankAccount(account?: {
  bank_name: string;
  account_number: string;
  account_holder: string;
}): string {
  if (!account) return '-';
  
  return `${account.bank_name} ${account.account_number} (${account.account_holder})`;
}

/**
 * 주소 요약
 */
export function summarizeAddress(address: string | null | undefined): string {
  if (!address) return '-';
  
  // 시/도와 구/군만 추출
  const parts = address.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  
  return address;
}

/**
 * 문서 타입 라벨
 */
export function getDocumentTypeLabel(type: string): string {
  const typeMap: { [key: string]: string } = {
    'employment': '근로계약서',
    'nda': '비밀유지서약서',
    'manual': '매뉴얼',
    'guide': '가이드',
    'policy': '정책',
    'report': '보고서',
    'other': '기타'
  };
  
  return typeMap[type] || type;
}

/**
 * 배열을 문자열로 조인
 */
export function joinArray(arr: string[] | null | undefined, separator: string = ', '): string {
  if (!arr || arr.length === 0) return '-';
  return arr.join(separator);
}

/**
 * 널 체크 및 기본값 반환
 */
export function defaultValue<T>(value: T | null | undefined, defaultVal: T): T {
  return value !== null && value !== undefined ? value : defaultVal;
}

/**
 * 클래스 네임 조합
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
