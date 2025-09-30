const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log('🔧 Restore Na Su-jin payslips (2025-04 ~ 2025-09)');

  // Find employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .eq('name', '나수진')
    .single();

  if (empError || !employee) {
    console.error('Employee lookup failed:', empError);
    process.exit(1);
  }

  console.log(`Employee: ${employee.name} (${employee.employee_id})`);

  // Target corrections defined by the user
  const corrections = [
    {
      period: '2025-04',
      base_salary: 800000,
      fuel_allowance: 200000,
      additional_work: 50000, // 4/14 오전 3시간 5만원
      meal_allowance: 7000 * 10, // 7만원
    },
    {
      period: '2025-05',
      base_salary: 800000,
      fuel_allowance: 200000,
      additional_work: 0,
      meal_allowance: 7000 * 8, // 56,000
    },
    {
      period: '2025-06',
      base_salary: 800000,
      fuel_allowance: 200000,
      additional_work: 0,
      meal_allowance: 7000 * 9, // 63,000
    },
    {
      period: '2025-07',
      base_salary: 800000,
      fuel_allowance: 200000,
      additional_work: 200000, // 7/7, 7/21 각 10만원
      meal_allowance: 7000 * 11, // 77,000
    },
    {
      period: '2025-08',
      base_salary: 800000,
      fuel_allowance: 200000,
      additional_work: 0,
      meal_allowance: 7000 * 8, // 56,000
    },
    {
      period: '2025-09',
      base_salary: 800000,
      fuel_allowance: 200000,
      additional_work: 200000, // 9/26, 9/29 각 10만원
      meal_allowance: 7000 * 11, // 77,000
    },
  ].map((c) => ({
    ...c,
    total_earnings:
      c.base_salary + c.fuel_allowance + c.additional_work + c.meal_allowance,
  }));

  for (const c of corrections) {
    console.log(`\n➡️ Updating ${c.period}`);
    // Fetch existing payslip to avoid creating new ones
    const { data: payslip, error: getErr } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('period', c.period)
      .single();

    if (getErr) {
      console.error('Fetch payslip failed:', getErr);
      continue;
    }

    const updatePayload = {
      base_salary: c.base_salary,
      fuel_allowance: c.fuel_allowance,
      additional_work: c.additional_work,
      meal_allowance: c.meal_allowance,
      weekly_holiday_pay: 0,
      overtime_pay: 0,
      incentive: 0,
      point_bonus: 0,
      total_earnings: c.total_earnings,
      tax_amount: 0,
      net_salary: c.total_earnings,
      // Keep other fields as-is; do not touch daily_details/status/dates
      updated_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase
      .from('payslips')
      .update(updatePayload)
      .eq('id', payslip.id);

    if (updErr) {
      console.error('Update failed:', updErr);
    } else {
      console.log(
        `✅ ${c.period} set to total ${c.total_earnings.toLocaleString()}원 (meal ${c.meal_allowance.toLocaleString()} / fuel ${c.fuel_allowance.toLocaleString()} / add ${c.additional_work.toLocaleString()})`
      );
    }
  }

  console.log('\n✅ Completed corrections.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


