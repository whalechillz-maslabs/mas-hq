const { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } = require('date-fns');
const { ko } = require('date-fns/locale');

// 2025년 8월 1일 확인
const august1 = new Date(2025, 7, 1); // 월은 0부터 시작하므로 7이 8월
console.log('📅 2025년 8월 1일 요일 확인:');
console.log(`- 날짜: ${format(august1, 'yyyy-MM-dd')}`);
console.log(`- 요일: ${format(august1, 'EEEE', { locale: ko })} (${format(august1, 'EEE', { locale: ko })})`);
console.log(`- 요일 번호: ${august1.getDay()} (0=일요일, 1=월요일, ..., 6=토요일)`);

console.log('\n📅 2025년 8월 달력 구조:');
const startOfAug = startOfMonth(august1);
const endOfAug = endOfMonth(august1);
const startOfWeekAug = startOfWeek(startOfAug, { locale: ko, weekStartsOn: 0 }); // 일요일부터 시작
const endOfWeekAug = endOfWeek(endOfAug, { locale: ko, weekStartsOn: 0 });

console.log(`- 8월 시작: ${format(startOfAug, 'yyyy-MM-dd EEEE', { locale: ko })}`);
console.log(`- 8월 끝: ${format(endOfAug, 'yyyy-MM-dd EEEE', { locale: ko })}`);
console.log(`- 달력 시작: ${format(startOfWeekAug, 'yyyy-MM-dd EEEE', { locale: ko })}`);
console.log(`- 달력 끝: ${format(endOfWeekAug, 'yyyy-MM-dd EEEE', { locale: ko })}`);

console.log('\n📅 8월 첫 주 날짜들:');
for (let i = 0; i < 7; i++) {
  const date = new Date(startOfWeekAug);
  date.setDate(startOfWeekAug.getDate() + i);
  console.log(`${format(date, 'MM-dd')} (${format(date, 'EEE', { locale: ko })})`);
}
