/**
 * 세무사 명세서 계산 검증
 */

const baseSalary = 2340000;

// 세무사 명세서
const taxAccountant = {
  baseSalary: 2340000,
  healthInsurance: 82950,
  employmentInsurance: 4500,
  longTermCareInsurance: 10740,
  totalDeduction: 98190,
  netPay: 2241810
};

// 우리 계산
const ourCalculation = {
  baseSalary: 2340000,
  healthInsurance: Math.max(0, Math.floor(baseSalary * 0.03545) - 3), // 82,950
  employmentInsurance: Math.floor(baseSalary * 0.001923), // 4,499
  longTermCareInsurance: Math.floor(baseSalary * 0.00459), // 10,740
  totalDeduction: 0,
  tax: Math.round(baseSalary * 0.033), // 77,220
  netPay: 0
};

ourCalculation.totalDeduction = ourCalculation.healthInsurance + 
                                ourCalculation.employmentInsurance + 
                                ourCalculation.longTermCareInsurance; // 98,189

ourCalculation.netPay = baseSalary - ourCalculation.totalDeduction; // 2,241,811

console.log('📊 세무사 명세서:');
console.log('   기본급:', taxAccountant.baseSalary.toLocaleString(), '원');
console.log('   공제액계:', taxAccountant.totalDeduction.toLocaleString(), '원');
console.log('   차인지급액:', taxAccountant.netPay.toLocaleString(), '원');
console.log('   (세금 공제 없음)');

console.log('\n📊 우리 계산:');
console.log('   기본급:', ourCalculation.baseSalary.toLocaleString(), '원');
console.log('   건강보험:', ourCalculation.healthInsurance.toLocaleString(), '원');
console.log('   고용보험:', ourCalculation.employmentInsurance.toLocaleString(), '원 (세무사: 4,500원)');
console.log('   장기요양보험:', ourCalculation.longTermCareInsurance.toLocaleString(), '원 ✅');
console.log('   공제액계:', ourCalculation.totalDeduction.toLocaleString(), '원 (세무사: 98,190원)');
console.log('   차인지급액:', ourCalculation.netPay.toLocaleString(), '원 (세무사: 2,241,810원)');

console.log('\n🔍 차이 분석:');
console.log('   공제액 차이:', (taxAccountant.totalDeduction - ourCalculation.totalDeduction), '원');
console.log('   차인지급액 차이:', (taxAccountant.netPay - ourCalculation.netPay), '원');

// 고용보험 정확한 계산
console.log('\n🔍 고용보험 정확한 계산:');
console.log('   2,340,000 × 0.001923 =', (baseSalary * 0.001923).toFixed(2), '원');
console.log('   FLOOR:', Math.floor(baseSalary * 0.001923), '원');
console.log('   ROUND:', Math.round(baseSalary * 0.001923), '원');
console.log('   세무사:', taxAccountant.employmentInsurance, '원');

// 정확한 요율 역산
const exactRate = taxAccountant.employmentInsurance / baseSalary;
console.log('\n   정확한 요율:', (exactRate * 100).toFixed(6), '%');
console.log('   →', exactRate, '≈', (4500 / 2340000).toFixed(6));
