const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase envs. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY exist in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const MEAL_PER_DAY = 7000;

async function getEmployeeByName(name) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name')
    .eq('name', name)
    .single();
  if (error) throw error;
  return data;
}

function uniqueDateCount(dailyDetails) {
  if (!Array.isArray(dailyDetails)) return 0;
  const set = new Set();
  for (const d of dailyDetails) {
    if (!d?.date) continue;
    const iso = new Date(d.date).toISOString().split('T')[0];
    set.add(iso);
  }
  return set.size;
}

async function backfillForEmployee(employeeId) {
  const { data: payslips, error } = await supabase
    .from('payslips')
    .select('id, period, daily_details, meal_allowance, total_earnings, net_salary, tax_amount')
    .eq('employee_id', employeeId);
  if (error) throw error;

  for (const p of payslips) {
    const days = uniqueDateCount(p.daily_details || []);
    const meal = days * MEAL_PER_DAY;
    const newTotal = (p.total_earnings || 0) - (p.meal_allowance || 0) + meal;
    const newNet = (p.net_salary || 0) - (p.meal_allowance || 0) + meal; // 공제는 유지

    const { error: upErr } = await supabase
      .from('payslips')
      .update({
        meal_allowance: meal,
        total_earnings: newTotal,
        net_salary: newNet,
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.id);
    if (upErr) {
      console.error(`Update failed ${p.period}:`, upErr.message);
    } else {
      console.log(`✅ ${p.period} updated: meal ${meal.toLocaleString()}원`);
    }
  }
}

async function main() {
  try {
    const choi = await getEmployeeByName('최형호');
    await backfillForEmployee(choi.id);

    console.log('Done.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();


