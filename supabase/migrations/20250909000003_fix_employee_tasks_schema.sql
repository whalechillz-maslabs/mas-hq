-- Fix employee_tasks table schema
-- Add missing achievement_status column

-- Add achievement_status column if it doesn't exist
ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS achievement_status VARCHAR(20) DEFAULT 'pending';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_employee_tasks_achievement_status 
ON employee_tasks(achievement_status);

-- Update existing records to have default value
UPDATE employee_tasks 
SET achievement_status = 'pending' 
WHERE achievement_status IS NULL;

-- Add other potentially missing columns
ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS task_priority VARCHAR(20) DEFAULT 'normal';

ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS task_time TIME;

ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS sales_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS memo TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_employee_tasks_task_priority 
ON employee_tasks(task_priority);

CREATE INDEX IF NOT EXISTS idx_employee_tasks_task_date 
ON employee_tasks(task_date);

-- Update RLS policies if needed
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_tasks" ON employee_tasks;
CREATE POLICY "Allow authenticated users to insert employee_tasks"
ON employee_tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update employee_tasks" ON employee_tasks;
CREATE POLICY "Allow authenticated users to update employee_tasks"
ON employee_tasks FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to select employee_tasks" ON employee_tasks;
CREATE POLICY "Allow authenticated users to select employee_tasks"
ON employee_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete employee_tasks" ON employee_tasks;
CREATE POLICY "Allow authenticated users to delete employee_tasks"
ON employee_tasks FOR DELETE TO authenticated USING (true);
