/**
 * 세무사 명세서 분석 스크립트
 * 세무사가 실제 발행한 명세서와 우리 계산 비교
 */

console.log('📊 세무사 명세서 분석\n');
console.log('='.repeat(60));

// 세무사 명세서 기준
const baseSalary = 2340000;
const taxAccountantDeductions = {
  healthInsurance: 82950,
  employmentInsurance: 4500,  // ⚠️ 우리 계산: 21,060원
  longTermCareInsurance: 10740, // ⚠️ 우리 계산: 761원
  total: 98190
};

console.log('\n📋 세무사 명세서 기준:');
console.log('   기본급:', baseSalary.toLocaleString(), '원');
console.log('   건강보험:', taxAccountantDeductions.healthInsurance.toLocaleString(), '원');
console.log('   고용보험:', taxAccountantDeductions.employmentInsurance.toLocaleString(), '원');
console.log('   장기요양보험료:', taxAccountantDeductions.longTermCareInsurance.toLocaleString(), '원');
console.log('   공제액계:', taxAccountantDeductions.total.toLocaleString(), '원');
console.log('   차인지급액:', (baseSalary - taxAccountantDeductions.total).toLocaleString(), '원');

// 우리가 계산한 값
const ourCalculation = {
  healthInsurance: Math.max(0, Math.floor(baseSalary * 0.03545) - 3), // 82,950
  longTermCareInsurance: Math.floor(82950 * 0.009182), // 761
  employmentInsurance: Math.floor(baseSalary * 0.009), // 21,060
  nationalPension: Math.floor(baseSalary * 0.045), // 105,300
  total: 0
};
ourCalculation.total = ourCalculation.healthInsurance + ourCalculation.longTermCareInsurance + 
                      ourCalculation.employmentInsurance + ourCalculation.nationalPension; // 210,071

console.log('\n📋 우리 계산 기준:');
console.log('   건강보험:', ourCalculation.healthInsurance.toLocaleString(), '원 ✅');
console.log('   장기요양보험:', ourCalculation.longTermCareInsurance.toLocaleString(), '원 ❌ (세무사: 10,740원)');
console.log('   고용보험:', ourCalculation.employmentInsurance.toLocaleString(), '원 ❌ (세무사: 4,500원)');
console.log('   국민연금:', ourCalculation.nationalPension.toLocaleString(), '원 (세무사 명세서에 없음)');
console.log('   총 공제액:', ourCalculation.total.toLocaleString(), '원 ❌ (세무사: 98,190원)');

// 역산: 세무사 값으로 요율 계산
console.log('\n🔍 세무사 값 역산 분석:');
console.log('='.repeat(60));

// 고용보험 요율 역산
const employmentInsuranceRate = taxAccountantDeductions.employmentInsurance / baseSalary;
console.log(`\n고용보험 요율 역산: ${taxAccountantDeductions.employmentInsurance} / ${baseSalary} = ${(employmentInsuranceRate * 100).toFixed(4)}%`);
console.log('   → 약 0.1923% (우리 계산: 0.9%)');

// 장기요양보험 요율 역산
const longTermCareRate = taxAccountantDeductions.longTermCareInsurance / baseSalary;
console.log(`\n장기요양보험 요율 역산: ${taxAccountantDeductions.longTermCareInsurance} / ${baseSalary} = ${(longTermCareRate * 100).toFixed(4)}%`);
console.log('   → 약 0.4590% (우리 계산: 건강보험료 × 0.9182% = 761원)');
console.log('   → 보수월액 기준 0.459%로 계산하면:', Math.floor(baseSalary * 0.00459).toLocaleString(), '원 ✅');

// 건강보험 요율 확인
const healthInsuranceRate = taxAccountantDeductions.healthInsurance / baseSalary;
console.log(`\n건강보험 요율 확인: ${taxAccountantDeductions.healthInsurance} / ${baseSalary} = ${(healthInsuranceRate * 100).toFixed(4)}%`);
console.log('   → 약 3.545% ✅ (일치)');

console.log('\n' + '='.repeat(60));
console.log('📝 결론:');
console.log('='.repeat(60));
console.log('1. 건강보험: 82,950원 ✅ (일치)');
console.log('2. 장기요양보험: 세무사는 보수월액 × 0.459% = 10,740원 사용');
console.log('   → 우리 계산(건강보험료 × 0.9182% = 761원)과 다름');
console.log('3. 고용보험: 세무사는 4,500원 사용 (요율 약 0.1923%)');
console.log('   → 우리 계산(보수월액 × 0.9% = 21,060원)과 다름');
console.log('4. 국민연금: 세무사 명세서에 없음 (공제하지 않음?)');
console.log('\n⚠️ 세무사 명세서 기준으로 수정이 필요합니다!');
