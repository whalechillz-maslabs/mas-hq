const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase envs. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
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
  if (error || !data) throw error || new Error('employee not found');
  return data;
}

function getPeriodRangeFromDailyDetails(dailyDetails) {
  if (!Array.isArray(dailyDetails) || dailyDetails.length === 0) return null;
  const dates = dailyDetails
    .filter(d => d?.date)
    .map(d => new Date(d.date))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return null;
  // inclusive range
  const start = new Date(Date.UTC(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate()));
  const end = new Date(Date.UTC(dates[dates.length - 1].getFullYear(), dates[dates.length - 1].getMonth(), dates[dates.length - 1].getDate()));
  const toISO = (d) => new Date(d).toISOString().split('T')[0];
  return { start: toISO(start), end: toISO(end) };
}

function uniqueWorkingDays(dailyDetails) {
  if (!Array.isArray(dailyDetails)) return 0;
  const set = new Set();
  for (const d of dailyDetails) {
    if (!d?.date) continue;
    const iso = new Date(d.date).toISOString().split('T')[0];
    set.add(iso);
  }
  return set.size;
}

async function computePointBonus(employeeId, range) {
  if (!range) return 0;
  const { data, error } = await supabase
    .from('employee_tasks')
    .select('task_date, operation_types(points)')
    .eq('employee_id', employeeId)
    .gte('task_date', range.start)
    .lte('task_date', range.end);
  if (error) throw error;
  const points = (data || []).reduce((sum, t) => sum + (t.operation_types?.points || 0), 0);
  return points * 100; // 1포인트=100원
}

async function backfillForEmployees(names) {
  for (const name of names) {
    const emp = await getEmployeeByName(name);
    const { data: payslips, error } = await supabase
      .from('payslips')
      .select('id, period, daily_details, meal_allowance, point_bonus, total_earnings, net_salary')
      .eq('employee_id', emp.id);
    if (error) throw error;

    for (const p of payslips) {
      const range = getPeriodRangeFromDailyDetails(p.daily_details || []);
      const workDays = uniqueWorkingDays(p.daily_details || []);
      const meal = workDays * MEAL_PER_DAY;
      const pointBonus = await computePointBonus(emp.id, range);

      const prevMeal = p.meal_allowance || 0;
      const prevPoint = p.point_bonus || 0;

      const total = (p.total_earnings || 0) - prevMeal - prevPoint + meal + pointBonus;
      const net = (p.net_salary || 0) - prevMeal - prevPoint + meal + pointBonus; // 세금은 변경하지 않음

      const { error: upErr } = await supabase
        .from('payslips')
        .update({
          meal_allowance: meal,
          point_bonus: pointBonus,
          total_earnings: total,
          net_salary: net,
          updated_at: new Date().toISOString(),
        })
        .eq('id', p.id);
      if (upErr) {
        console.error(`❌ ${name} ${p.period} update failed:`, upErr.message);
      } else {
        console.log(`✅ ${name} ${p.period}: meal ${meal.toLocaleString()}원, point ${pointBonus.toLocaleString()}원`);
      }
    }
  }
}

async function main() {
  try {
    await backfillForEmployees(['최형호', '나수진']);
    console.log('Done.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();


