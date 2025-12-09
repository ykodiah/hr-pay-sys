-- Create AI chat logs table for learning system
CREATE TABLE IF NOT EXISTS ai_chat_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(50),
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    helpful BOOLEAN DEFAULT true,
    module_context VARCHAR(100),
    sentiment VARCHAR(20),
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI knowledge base table for continuous learning
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question_pattern TEXT NOT NULL,
    response_template TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create AI feedback table for response improvement
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_log_id UUID REFERENCES ai_chat_logs(id),
    employee_id VARCHAR(50),
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'incomplete')),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial knowledge base entries for employee portal
INSERT INTO ai_knowledge_base (category, question_pattern, response_template, confidence_score) VALUES
('leave_request', 'how to request leave|apply for leave|submit leave request', 
 'To request leave: 1. Go to "Leave Requests" in the sidebar 2. Click "Request Leave" 3. Select leave type and dates 4. Add reason and submit 5. Your request will be routed to your supervisor for approval', 
 0.9),
('payslip_access', 'view payslip|download payslip|access salary slip', 
 'To access your payslips: 1. Click "Payslips" in the sidebar 2. Select the month you want 3. Click the PDF button to download 4. Your payslip shows net pay, allowances, and deductions', 
 0.9),
('leave_balance', 'check leave balance|remaining leave days|leave days left', 
 'Your current leave balance is {leaveBalance} days. You can see this on your dashboard or in the Leave Requests section. Annual leave resets each year based on your employment anniversary.', 
 0.8),
('loan_application', 'apply for loan|request loan|loan application process', 
 'To apply for a loan: 1. Go to "Loan Requests" in the sidebar 2. Click "Apply for Loan" 3. Select loan type and amount 4. Fill in required details 5. Submit for approval. Processing typically takes 3-5 business days.', 
 0.8),
('performance_goals', 'view goals|track performance|goal progress', 
 'To view your performance goals: 1. Go to "My Goals" in the sidebar 2. See your current goals and progress 3. Update goal status as you complete milestones 4. Your manager will review during performance evaluations.', 
 0.8);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_employee_id ON ai_chat_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_created_at ON ai_chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_chat_log_id ON ai_feedback(chat_log_id);

-- Enable RLS
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own chat logs" ON ai_chat_logs
    FOR SELECT USING (auth.uid()::text = employee_id);

CREATE POLICY "Users can insert their own chat logs" ON ai_chat_logs
    FOR INSERT WITH CHECK (auth.uid()::text = employee_id);

CREATE POLICY "Everyone can read knowledge base" ON ai_knowledge_base
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can provide feedback" ON ai_feedback
    FOR INSERT WITH CHECK (auth.uid()::text = employee_id);

-- Create function for daily AI learning updates
CREATE OR REPLACE FUNCTION update_ai_knowledge_daily()
RETURNS void AS $$
BEGIN
    -- Update confidence scores based on feedback
    UPDATE ai_knowledge_base 
    SET confidence_score = LEAST(1.0, confidence_score + 0.1)
    WHERE id IN (
        SELECT DISTINCT kb.id 
        FROM ai_knowledge_base kb
        JOIN ai_chat_logs cl ON cl.response ILIKE '%' || kb.response_template || '%'
        JOIN ai_feedback f ON f.chat_log_id = cl.id
        WHERE f.feedback_type = 'helpful'
        AND f.created_at > NOW() - INTERVAL '1 day'
    );
    
    -- Decrease confidence for unhelpful responses
    UPDATE ai_knowledge_base 
    SET confidence_score = GREATEST(0.1, confidence_score - 0.1)
    WHERE id IN (
        SELECT DISTINCT kb.id 
        FROM ai_knowledge_base kb
        JOIN ai_chat_logs cl ON cl.response ILIKE '%' || kb.response_template || '%'
        JOIN ai_feedback f ON f.chat_log_id = cl.id
        WHERE f.feedback_type IN ('not_helpful', 'incorrect')
        AND f.created_at > NOW() - INTERVAL '1 day'
    );
    
    -- Update usage counts
    UPDATE ai_knowledge_base 
    SET usage_count = usage_count + 1,
        last_updated = NOW()
    WHERE id IN (
        SELECT DISTINCT kb.id 
        FROM ai_knowledge_base kb
        JOIN ai_chat_logs cl ON cl.question ILIKE '%' || kb.question_pattern || '%'
        WHERE cl.created_at > NOW() - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE ai_chat_logs IS 'Stores all AI chat interactions for learning and improvement';
COMMENT ON TABLE ai_knowledge_base IS 'Contains AI knowledge patterns and responses for continuous learning';
COMMENT ON TABLE ai_feedback IS 'Stores user feedback on AI responses for improvement';
COMMENT ON FUNCTION update_ai_knowledge_daily() IS 'Daily function to update AI knowledge based on user interactions and feedback';
