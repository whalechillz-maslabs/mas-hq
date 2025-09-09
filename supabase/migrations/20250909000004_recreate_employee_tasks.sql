-- Recreate employee_tasks table with proper schema
-- Drop existing table and recreate with all required columns

-- Drop existing table (this will remove all data)
DROP TABLE IF EXISTS employee_tasks CASCADE;

-- Create employee_tasks table with complete schema
CREATE TABLE employee_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    operation_type_id UUID NOT NULL REFERENCES operation_types(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    memo TEXT,
    task_time TIME,
    customer_name VARCHAR(255),
    sales_amount DECIMAL(10,2) DEFAULT 0,
    task_priority VARCHAR(20) DEFAULT 'normal',
    achievement_status VARCHAR(20) DEFAULT 'pending',
    task_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employee_tasks_employee_id ON employee_tasks(employee_id);
CREATE INDEX idx_employee_tasks_operation_type_id ON employee_tasks(operation_type_id);
CREATE INDEX idx_employee_tasks_task_date ON employee_tasks(task_date);
CREATE INDEX idx_employee_tasks_achievement_status ON employee_tasks(achievement_status);
CREATE INDEX idx_employee_tasks_task_priority ON employee_tasks(task_priority);
CREATE INDEX idx_employee_tasks_created_at ON employee_tasks(created_at);

-- Enable RLS
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to insert employee_tasks"
ON employee_tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employee_tasks"
ON employee_tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to select employee_tasks"
ON employee_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete employee_tasks"
ON employee_tasks FOR DELETE TO authenticated USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_tasks_updated_at 
    BEFORE UPDATE ON employee_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
