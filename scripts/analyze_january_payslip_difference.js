/**
 * 1월 명세서 차이 분석
 * 현재: 차인지급액 2,241,810원
 * 세무사: 차인지급액 2,240,330원
 * 차이: 1,480원
 */

const baseSalary = 2340000;

// 현재 계산
const currentHealthInsurance = Math.max(0, Math.floor(baseSalary * 0.03545) - 3); // 82,950
const currentLongTermCare = Math.floor(baseSalary * 0.00459); // 10,740
const currentEmployment = Math.round(baseSalary * (4500 / 2340000)); // 4,500
const currentTotalInsurance = currentHealthInsurance + currentLongTermCare + currentEmployment; // 98,190
const currentNetSalary = baseSalary - currentTotalInsurance; // 2,241,810

// 세무사 차인지급액
const taxAccountantNetSalary = 2240330;
const taxAccountantTotalInsurance = baseSalary - taxAccountantNetSalary; // 99,670

console.log('📊 현재 계산:');
console.log('   기본급:', baseSalary.toLocaleString(), '원');
console.log('   건강보험:', currentHealthInsurance.toLocaleString(), '원');
console.log('   고용보험:', currentEmployment.toLocaleString(), '원');
console.log('   장기요양보험료:', currentLongTermCare.toLocaleString(), '원');
console.log('   공제액계:', currentTotalInsurance.toLocaleString(), '원');
console.log('   차인지급액:', currentNetSalary.toLocaleString(), '원');

console.log('\n📊 세무사 명세서:');
console.log('   차인지급액:', taxAccountantNetSalary.toLocaleString(), '원');
console.log('   역산 공제액계:', taxAccountantTotalInsurance.toLocaleString(), '원');

console.log('\n🔍 차이 분석:');
console.log('   차인지급액 차이:', (currentNetSalary - taxAccountantNetSalary).toLocaleString(), '원');
console.log('   공제액계 차이:', (taxAccountantTotalInsurance - currentTotalInsurance).toLocaleString(), '원');

// 세무사 공제액계로 역산
const difference = taxAccountantTotalInsurance - currentTotalInsurance; // 1,480원

console.log('\n🔍 가능한 원인:');
console.log('   1. 건강보험 계산 차이:', difference, '원');
console.log('   2. 고용보험 계산 차이:', difference, '원');
console.log('   3. 장기요양보험료 계산 차이:', difference, '원');
console.log('   4. 다른 공제 항목 추가:', difference, '원');

// 각 항목별로 1,480원 차이가 나는 경우 계산
console.log('\n📝 각 항목별 1,480원 차이 시 계산값:');
console.log('   건강보험 + 1,480원:', (currentHealthInsurance + difference).toLocaleString(), '원');
console.log('   고용보험 + 1,480원:', (currentEmployment + difference).toLocaleString(), '원');
console.log('   장기요양보험료 + 1,480원:', (currentLongTermCare + difference).toLocaleString(), '원');

// 건강보험 역산
const taxAccountantHealthInsurance = (taxAccountantTotalInsurance - currentLongTermCare - currentEmployment);
console.log('\n🔍 세무사 건강보험 역산:', taxAccountantHealthInsurance.toLocaleString(), '원');
console.log('   현재 건강보험:', currentHealthInsurance.toLocaleString(), '원');
console.log('   차이:', (taxAccountantHealthInsurance - currentHealthInsurance).toLocaleString(), '원');

// 건강보험 요율 역산
const healthInsuranceRate = taxAccountantHealthInsurance / baseSalary;
console.log('\n   건강보험 요율 역산:', (healthInsuranceRate * 100).toFixed(4), '%');
console.log('   현재 요율:', '3.545%');
