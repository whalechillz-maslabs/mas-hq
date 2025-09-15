const fs = require('fs');
const path = require('path');

const filePath = 'src/app/admin/attendance-management/page.tsx';

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

// 1. formatTime 함수 수정 (getUTCHours() → getHours())
content = content.replace(
  /const hours = koreaTime\.getUTCHours\(\)\.toString\(\)\.padStart\(2, '0'\);\s*const minutes = koreaTime\.getUTCMinutes\(\)\.toString\(\)\.padStart\(2, '0'\);/,
  `const hours = koreaTime.getHours().toString().padStart(2, '0');
      const minutes = koreaTime.getMinutes().toString().padStart(2, '0');`
);

// 2. formatWorkTime 함수 추가 (formatTime 함수 아래에)
const formatWorkTimeFunction = `
  const formatWorkTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return \`\${wholeHours}h \${minutes}m\`;
  };`;

content = content.replace(
  /const formatTime = \(timeString: string \| null\) => \{[\s\S]*?\};/,
  (match) => match + formatWorkTimeFunction
);

// 3. 근무시간 표시 형식 수정 (toFixed(2) → formatWorkTime)
content = content.replace(
  /\{record\.total_hours > 0 \? `\$\{record\.total_hours\.toFixed\(2\)\}시간` : '-'\}/,
  '{record.total_hours > 0 ? formatWorkTime(record.total_hours) : \'-\'}'
);

// 4. 위치 정보 표시 숨김 (실제 출근/퇴근 시간 표시 시)
const locationDisplayPattern = /\{record\.check_in_location \? \([\s\S]*?\) : \(\s*<span className="text-xs text-gray-500">위치 없음<\/span>\s*\)\}/;
content = content.replace(
  locationDisplayPattern,
  '<span className="text-xs text-gray-500">위치 없음</span>'
);

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ 관리자 페이지 표시 문제 수정 완료!');
console.log('수정된 내용:');
console.log('1. formatTime 함수: getUTCHours() → getHours()');
console.log('2. formatWorkTime 함수 추가');
console.log('3. 근무시간 표시: 8.93시간 → 8h 56m 형식');
console.log('4. 위치 정보 표시 숨김');
