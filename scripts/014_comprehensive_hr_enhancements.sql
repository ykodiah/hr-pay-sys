-- Comprehensive HR System Enhancements Database Schema

-- Create salary grades and steps table
CREATE TABLE IF NOT EXISTS salary_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    grade_name VARCHAR(50) NOT NULL,
    grade_level INTEGER NOT NULL,
    step_1 DECIMAL(12,2) NOT NULL,
    step_2 DECIMAL(12,2) NOT NULL,
    step_3 DECIMAL(12,2) NOT NULL,
    step_4 DECIMAL(12,2) NOT NULL,
    step_5 DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, grade_name),
    UNIQUE(company_id, grade_level)
);

-- Create leave policies table
CREATE TABLE IF NOT EXISTS leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL, -- 'annual', 'sick', 'maternity', 'paternity', 'casual', 'emergency', 'study'
    max_days INTEGER NOT NULL,
    accrual_rate DECIMAL(5,2) DEFAULT 0, -- days per month
    carry_over_days INTEGER DEFAULT 0,
    requires_approval BOOLEAN DEFAULT true,
    notice_period_days INTEGER DEFAULT 0,
    medical_certificate_required BOOLEAN DEFAULT false,
    medical_certificate_after_days INTEGER DEFAULT 3,
    max_consecutive_days INTEGER DEFAULT NULL,
    paid_percentage DECIMAL(5,2) DEFAULT 100.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, policy_name)
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    initiated_by UUID REFERENCES employees(id),
    
    -- Current position details
    current_grade VARCHAR(50) NOT NULL,
    current_step VARCHAR(20) NOT NULL,
    current_salary DECIMAL(12,2) NOT NULL,
    current_position VARCHAR(200),
    
    -- Proposed position details
    proposed_grade VARCHAR(50) NOT NULL,
    proposed_step VARCHAR(20) NOT NULL,
    proposed_salary DECIMAL(12,2) NOT NULL,
    proposed_position VARCHAR(200),
    
    -- Promotion details
    effective_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approval_stage VARCHAR(50) DEFAULT 'Line Manager',
    
    -- Eligibility checks
    tenure_check BOOLEAN DEFAULT false,
    appraisal_check BOOLEAN DEFAULT false,
    training_check BOOLEAN DEFAULT false,
    disciplinary_check BOOLEAN DEFAULT false,
    budget_check BOOLEAN DEFAULT false,
    
    -- Approval tracking
    line_manager_approval BOOLEAN DEFAULT NULL,
    line_manager_approved_by UUID REFERENCES employees(id),
    line_manager_approved_at TIMESTAMP WITH TIME ZONE,
    
    hod_approval BOOLEAN DEFAULT NULL,
    hod_approved_by UUID REFERENCES employees(id),
    hod_approved_at TIMESTAMP WITH TIME ZONE,
    
    hr_approval BOOLEAN DEFAULT NULL,
    hr_approved_by UUID REFERENCES employees(id),
    hr_approved_at TIMESTAMP WITH TIME ZONE,
    
    finance_approval BOOLEAN DEFAULT NULL,
    finance_approved_by UUID REFERENCES employees(id),
    finance_approved_at TIMESTAMP WITH TIME ZONE,
    
    ceo_approval BOOLEAN DEFAULT NULL,
    ceo_approved_by UUID REFERENCES employees(id),
    ceo_approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Final approval
    final_approved_at TIMESTAMP WITH TIME ZONE,
    final_approved_by UUID REFERENCES employees(id),
    
    -- Rejection details
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES employees(id),
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotion comments table
CREATE TABLE IF NOT EXISTS promotion_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES employees(id),
    comment TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'approval', 'rejection', 'query')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotion attachments table
CREATE TABLE IF NOT EXISTS promotion_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES employees(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee communications table
CREATE TABLE IF NOT EXISTS employee_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'group', 'announcement', 'system')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Message status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_starred BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Thread management
    thread_id UUID,
    parent_message_id UUID REFERENCES employee_communications(id),
    
    -- Attachments
    has_attachments BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create communication attachments table
CREATE TABLE IF NOT EXISTS communication_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES employee_communications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group communications table
CREATE TABLE IF NOT EXISTS communication_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    group_name VARCHAR(200) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES employees(id),
    group_type VARCHAR(20) DEFAULT 'department' CHECK (group_type IN ('department', 'project', 'custom', 'company')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group members table
CREATE TABLE IF NOT EXISTS communication_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES communication_groups(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, employee_id)
);

-- Create online meetings table
CREATE TABLE IF NOT EXISTS online_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    meeting_title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Meeting details
    meeting_type VARCHAR(20) DEFAULT 'video' CHECK (meeting_type IN ('video', 'audio', 'screen_share')),
    meeting_url TEXT,
    meeting_password VARCHAR(50),
    
    -- Scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Meeting status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    -- Host details
    host_id UUID REFERENCES employees(id),
    
    -- Recording
    is_recorded BOOLEAN DEFAULT false,
    recording_url TEXT,
    recording_size INTEGER,
    
    -- AI Features
    ai_transcription TEXT,
    ai_summary TEXT,
    ai_action_items JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES online_meetings(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Participation details
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'co_host', 'participant', 'observer')),
    invitation_status VARCHAR(20) DEFAULT 'invited' CHECK (invitation_status IN ('invited', 'accepted', 'declined', 'tentative')),
    
    -- Attendance tracking
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, employee_id)
);

-- Create meeting chat messages table
CREATE TABLE IF NOT EXISTS meeting_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES online_meetings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES employees(id),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'emoji', 'system')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default salary grades
INSERT INTO salary_grades (company_id, grade_name, grade_level, step_1, step_2, step_3, step_4, step_5) VALUES
('00000000-0000-0000-0000-000000000001', 'Grade 1', 1, 1800, 1950, 2100, 2250, 2400),
('00000000-0000-0000-0000-000000000001', 'Grade 2', 2, 2200, 2380, 2560, 2740, 2920),
('00000000-0000-0000-0000-000000000001', 'Grade 3', 3, 2600, 2810, 3020, 3230, 3440),
('00000000-0000-0000-0000-000000000001', 'Grade 4', 4, 3000, 3240, 3480, 3720, 3960),
('00000000-0000-0000-0000-000000000001', 'Grade 5', 5, 3400, 3670, 3940, 4210, 4480),
('00000000-0000-0000-0000-000000000001', 'Grade 6', 6, 3800, 4100, 4400, 4700, 5000),
('00000000-0000-0000-0000-000000000001', 'Grade 7', 7, 4200, 4530, 4860, 5190, 5520),
('00000000-0000-0000-0000-000000000001', 'Grade 8', 8, 4600, 4960, 5320, 5680, 6040),
('00000000-0000-0000-0000-000000000001', 'Grade 9', 9, 5000, 5390, 5780, 6170, 6560),
('00000000-0000-0000-0000-000000000001', 'Grade 10', 10, 5400, 5820, 6240, 6660, 7080)
ON CONFLICT (company_id, grade_name) DO NOTHING;

-- Insert default leave policies
INSERT INTO leave_policies (company_id, policy_name, policy_type, max_days, accrual_rate, carry_over_days, requires_approval, notice_period_days, description) VALUES
('00000000-0000-0000-0000-000000000001', 'Annual Leave', 'annual', 21, 1.75, 5, true, 14, 'Annual vacation leave with 1.75 days accrual per month'),
('00000000-0000-0000-0000-000000000001', 'Sick Leave', 'sick', 10, 0, 0, false, 0, 'Medical leave for illness or injury'),
('00000000-0000-0000-0000-000000000001', 'Casual Leave', 'casual', 5, 0, 0, true, 2, 'Short-term personal leave'),
('00000000-0000-0000-0000-000000000001', 'Maternity Leave', 'maternity', 90, 0, 0, true, 28, '12 weeks maternity leave'),
('00000000-0000-0000-0000-000000000001', 'Paternity Leave', 'paternity', 7, 0, 0, true, 14, '2 weeks paternity leave'),
('00000000-0000-0000-0000-000000000001', 'Emergency Leave', 'emergency', 3, 0, 0, false, 0, 'Emergency personal leave'),
('00000000-0000-0000-0000-000000000001', 'Study Leave', 'study', 30, 0, 0, true, 30, 'Educational and training leave')
ON CONFLICT (company_id, policy_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salary_grades_company_id ON salary_grades(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_grades_active ON salary_grades(is_active);

CREATE INDEX IF NOT EXISTS idx_leave_policies_company_id ON leave_policies(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_policies_type ON leave_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_leave_policies_active ON leave_policies(is_active);

CREATE INDEX IF NOT EXISTS idx_promotions_employee_id ON promotions(employee_id);
CREATE INDEX IF NOT EXISTS idx_promotions_company_id ON promotions(company_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_effective_date ON promotions(effective_date);

CREATE INDEX IF NOT EXISTS idx_promotion_comments_promotion_id ON promotion_comments(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_attachments_promotion_id ON promotion_attachments(promotion_id);

CREATE INDEX IF NOT EXISTS idx_employee_communications_sender ON employee_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_employee_communications_recipient ON employee_communications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_employee_communications_thread ON employee_communications(thread_id);
CREATE INDEX IF NOT EXISTS idx_employee_communications_read ON employee_communications(is_read);

CREATE INDEX IF NOT EXISTS idx_communication_groups_company_id ON communication_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_communication_group_members_group_id ON communication_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_communication_group_members_employee_id ON communication_group_members(employee_id);

CREATE INDEX IF NOT EXISTS idx_online_meetings_company_id ON online_meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_online_meetings_host_id ON online_meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_online_meetings_status ON online_meetings(status);
CREATE INDEX IF NOT EXISTS idx_online_meetings_scheduled_start ON online_meetings(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_employee_id ON meeting_participants(employee_id);

CREATE INDEX IF NOT EXISTS idx_meeting_chat_messages_meeting_id ON meeting_chat_messages(meeting_id);

-- Add RLS policies
ALTER TABLE salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON salary_grades
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON leave_policies
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON promotions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON promotion_comments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON promotion_attachments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON employee_communications
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON communication_attachments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON communication_groups
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON communication_group_members
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON online_meetings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON meeting_participants
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON meeting_chat_messages
    FOR ALL USING (auth.role() = 'authenticated');
