-- Create tasks table to track action items from minutes and general tasks
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    minute_id UUID REFERENCES minutes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
    assignee_name VARCHAR(255),
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    category VARCHAR(100),
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES members(id),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_building_id ON tasks(building_id);
CREATE INDEX idx_tasks_minute_id ON tasks(minute_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view tasks from their buildings" ON tasks
    FOR SELECT
    USING (
        building_id IN (
            SELECT building_id FROM members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admin users can insert tasks" ON tasks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members 
            WHERE user_id = auth.uid() 
            AND building_id = tasks.building_id
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admin users can update tasks" ON tasks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE user_id = auth.uid() 
            AND building_id = tasks.building_id
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admin users can delete tasks" ON tasks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE user_id = auth.uid() 
            AND building_id = tasks.building_id
            AND role IN ('admin', 'manager')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- Create function to set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_tasks_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update completed_at
CREATE TRIGGER update_tasks_completed_at_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_completed_at();