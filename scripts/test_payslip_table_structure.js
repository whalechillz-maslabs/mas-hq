/**
 * 급여명세서 테이블 구조 확인 스크립트
 */

const fs = require('fs');

const filePath = 'src/app/admin/payslip-generator/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('📊 테이블 헤더 구조 확인:\n');

// 헤더 찾기
let headerStart = -1;
for (let i = 5405; i < 5445; i++) {
  if (lines[i]?.includes('<thead')) {
    headerStart = i;
    break;
  }
}

if (headerStart > 0) {
  console.log('헤더 시작:', headerStart);
  for (let i = headerStart; i < headerStart + 40; i++) {
    if (lines[i]?.includes('직원명')) {
      console.log(`\n${i}: ${lines[i].trim()}`);
    }
    if (lines[i]?.includes('발행일')) {
      console.log(`${i}: ${lines[i].trim()}`);
    }
    if (lines[i]?.includes('지급일')) {
      console.log(`${i}: ${lines[i].trim()}`);
    }
    if (lines[i]?.includes('작업')) {
      console.log(`${i}: ${lines[i].trim()}`);
    }
  }
}

console.log('\n📊 테이블 데이터 구조 확인:\n');

// 데이터 행 찾기
let dataStart = -1;
for (let i = 5488; i < 5505; i++) {
  if (lines[i]?.includes('issued_at')) {
    console.log(`발행일 데이터: ${i}: ${lines[i].trim()}`);
  }
  if (lines[i]?.includes('paid_at')) {
    console.log(`지급일 데이터: ${i}: ${lines[i].trim()}`);
  }
}

// 컬럼 개수 확인
let thCount = 0;
let tdCount = 0;
for (let i = 5407; i < 5441; i++) {
  if (lines[i]?.includes('<th')) thCount++;
}
for (let i = 5444; i < 5501; i++) {
  if (lines[i]?.includes('<td') && !lines[i]?.includes('showActionsColumn')) tdCount++;
}

console.log(`\n헤더 컬럼 수: ${thCount}`);
console.log(`데이터 컬럼 수 (작업 제외): ${tdCount}`);
