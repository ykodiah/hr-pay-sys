-- ML-Powered Employee Analytics Schema
-- This migration adds machine learning features for retention, performance, promotion, and learning

-- Create employee analytics table for ML features
CREATE TABLE IF NOT EXISTS employee_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Retention Risk Analysis
    retention_risk_score DECIMAL(5,2) DEFAULT 0.0 CHECK (retention_risk_score >= 0 AND retention_risk_score <= 100),
    retention_risk_factors JSONB DEFAULT '[]',
    retention_prediction_confidence DECIMAL(5,2) DEFAULT 0.0,
    last_retention_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance Predictions
    performance_trend_score DECIMAL(5,2) DEFAULT 0.0 CHECK (performance_trend_score >= 0 AND performance_trend_score <= 100),
    performance_potential_score DECIMAL(5,2) DEFAULT 0.0 CHECK (performance_potential_score >= 0 AND performance_potential_score <= 100),
    performance_ml_insights JSONB DEFAULT '{}',
    last_performance_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Promotion Readiness
    promotion_readiness_score DECIMAL(5,2) DEFAULT 0.0 CHECK (promotion_readiness_score >= 0 AND promotion_readiness_score <= 100),
    promotion_recommendations JSONB DEFAULT '[]',
    next_promotion_probability DECIMAL(5,2) DEFAULT 0.0,
    last_promotion_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Learning & Development
    skill_gaps JSONB DEFAULT '[]',
    learning_recommendations JSONB DEFAULT '[]',
    career_path_suggestions JSONB DEFAULT '[]',
    learning_effectiveness_score DECIMAL(5,2) DEFAULT 0.0,
    last_learning_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Sentiment Analysis
    overall_sentiment_score DECIMAL(3,2) DEFAULT 0.0 CHECK (overall_sentiment_score >= -1 AND overall_sentiment_score <= 1),
    sentiment_trend VARCHAR(20) DEFAULT 'neutral' CHECK (sentiment_trend IN ('positive', 'neutral', 'negative', 'improving', 'declining')),
    sentiment_analysis_data JSONB DEFAULT '{}',
    last_sentiment_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- Create employee feedback analysis table
CREATE TABLE IF NOT EXISTS employee_feedback_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    feedback_source VARCHAR(50) NOT NULL CHECK (feedback_source IN ('performance_review', 'exit_interview', 'survey', 'peer_feedback', 'manager_feedback', 'self_assessment')),
    feedback_text TEXT NOT NULL,
    
    -- ML Analysis Results
    sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    emotion_labels JSONB DEFAULT '[]',
    key_topics JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Analysis Metadata
    analysis_confidence DECIMAL(5,2) DEFAULT 0.0,
    model_version VARCHAR(50) DEFAULT '1.0',
    processing_time_ms INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skill assessment table
CREATE TABLE IF NOT EXISTS employee_skill_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    skill_category VARCHAR(100) NOT NULL,
    skill_name VARCHAR(200) NOT NULL,
    current_level INTEGER NOT NULL CHECK (current_level >= 1 AND current_level <= 5),
    target_level INTEGER NOT NULL CHECK (target_level >= 1 AND target_level <= 5),
    assessment_method VARCHAR(50) NOT NULL CHECK (assessment_method IN ('self_assessment', 'peer_review', 'manager_review', 'test', 'project_evaluation', 'ml_prediction')),
    
    -- ML Predictions
    predicted_level DECIMAL(3,2),
    confidence_score DECIMAL(5,2),
    improvement_potential DECIMAL(5,2),
    learning_recommendations JSONB DEFAULT '[]',
    
    -- Assessment Metadata
    assessor_id UUID REFERENCES employees(id),
    assessment_date DATE NOT NULL,
    next_assessment_due DATE,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning path recommendations table
CREATE TABLE IF NOT EXISTS learning_path_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('skill_development', 'career_advancement', 'role_transition', 'leadership_development', 'technical_upgrade')),
    
    -- Recommendation Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority_score DECIMAL(5,2) NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    estimated_duration_days INTEGER,
    difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Learning Resources
    recommended_courses JSONB DEFAULT '[]',
    suggested_mentors JSONB DEFAULT '[]',
    required_skills JSONB DEFAULT '[]',
    learning_objectives JSONB DEFAULT '[]',
    
    -- ML Metadata
    ml_confidence DECIMAL(5,2) DEFAULT 0.0,
    recommendation_reasons JSONB DEFAULT '[]',
    success_probability DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'paused')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance prediction models table
CREATE TABLE IF NOT EXISTS performance_prediction_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('retention', 'performance', 'promotion', 'learning', 'sentiment')),
    model_version VARCHAR(20) NOT NULL,
    
    -- Model Configuration
    model_config JSONB NOT NULL,
    feature_importance JSONB DEFAULT '{}',
    model_metrics JSONB DEFAULT '{}',
    
    -- Training Data
    training_data_size INTEGER DEFAULT 0,
    training_accuracy DECIMAL(5,4) DEFAULT 0.0,
    validation_accuracy DECIMAL(5,4) DEFAULT 0.0,
    last_trained_at TIMESTAMP WITH TIME ZONE,
    
    -- Model Status
    is_active BOOLEAN DEFAULT false,
    is_production_ready BOOLEAN DEFAULT false,
    deployment_status VARCHAR(20) DEFAULT 'training' CHECK (deployment_status IN ('training', 'validating', 'deployed', 'retired', 'failed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ML prediction logs table
CREATE TABLE IF NOT EXISTS ml_prediction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES performance_prediction_models(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL,
    
    -- Prediction Details
    input_features JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    actual_outcome JSONB,
    
    -- Performance Tracking
    prediction_accuracy DECIMAL(5,4),
    prediction_error DECIMAL(5,4),
    is_correct BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE
);

-- Create employee engagement metrics table
CREATE TABLE IF NOT EXISTS employee_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Engagement Scores
    overall_engagement_score DECIMAL(5,2) DEFAULT 0.0 CHECK (overall_engagement_score >= 0 AND overall_engagement_score <= 100),
    work_satisfaction_score DECIMAL(5,2) DEFAULT 0.0,
    team_collaboration_score DECIMAL(5,2) DEFAULT 0.0,
    career_development_score DECIMAL(5,2) DEFAULT 0.0,
    work_life_balance_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Behavioral Indicators
    meeting_participation_rate DECIMAL(5,2) DEFAULT 0.0,
    project_completion_rate DECIMAL(5,2) DEFAULT 0.0,
    peer_interaction_frequency DECIMAL(5,2) DEFAULT 0.0,
    learning_activity_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- ML Insights
    engagement_trend VARCHAR(20) DEFAULT 'stable' CHECK (engagement_trend IN ('increasing', 'stable', 'decreasing', 'volatile')),
    risk_indicators JSONB DEFAULT '[]',
    improvement_areas JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    
    -- Data Sources
    data_sources JSONB DEFAULT '[]',
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- Create career progression predictions table
CREATE TABLE IF NOT EXISTS career_progression_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Career Path Predictions
    next_role_probability JSONB DEFAULT '{}',
    promotion_timeline_months INTEGER,
    salary_increase_potential DECIMAL(5,2),
    leadership_readiness_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Skill Development Needs
    critical_skills_gaps JSONB DEFAULT '[]',
    recommended_certifications JSONB DEFAULT '[]',
    suggested_mentors JSONB DEFAULT '[]',
    networking_opportunities JSONB DEFAULT '[]',
    
    -- ML Predictions
    career_success_probability DECIMAL(5,2) DEFAULT 0.0,
    retention_likelihood DECIMAL(5,2) DEFAULT 0.0,
    job_satisfaction_prediction DECIMAL(5,2) DEFAULT 0.0,
    
    -- Prediction Metadata
    prediction_confidence DECIMAL(5,2) DEFAULT 0.0,
    model_version VARCHAR(20) DEFAULT '1.0',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_analytics_employee_id ON employee_analytics(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_analytics_retention_risk ON employee_analytics(retention_risk_score);
CREATE INDEX IF NOT EXISTS idx_employee_analytics_performance_trend ON employee_analytics(performance_trend_score);
CREATE INDEX IF NOT EXISTS idx_employee_analytics_promotion_readiness ON employee_analytics(promotion_readiness_score);

CREATE INDEX IF NOT EXISTS idx_feedback_analysis_employee_id ON employee_feedback_analysis(employee_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_sentiment ON employee_feedback_analysis(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_priority ON employee_feedback_analysis(priority_level);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_employee_id ON employee_skill_assessments(employee_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill_category ON employee_skill_assessments(skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_current_level ON employee_skill_assessments(current_level);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_employee_id ON learning_path_recommendations(employee_id);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_priority ON learning_path_recommendations(priority_score);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_status ON learning_path_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_engagement_metrics_employee_id ON employee_engagement_metrics(employee_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_engagement_score ON employee_engagement_metrics(overall_engagement_score);

CREATE INDEX IF NOT EXISTS idx_career_predictions_employee_id ON career_progression_predictions(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_predictions_success_probability ON career_progression_predictions(career_success_probability);

-- Enable RLS
ALTER TABLE employee_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_feedback_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_prediction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_progression_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_analytics
CREATE POLICY "Users can view analytics for their company" ON employee_analytics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND company_id = employee_analytics.company_id
    )
);

-- RLS Policies for employee_feedback_analysis
CREATE POLICY "Users can view feedback analysis for their company" ON employee_feedback_analysis FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees e1
        JOIN employees e2 ON e1.company_id = e2.company_id
        WHERE e2.id = auth.uid() 
        AND e1.id = employee_feedback_analysis.employee_id
    )
);

-- RLS Policies for employee_skill_assessments
CREATE POLICY "Users can view skill assessments for their company" ON employee_skill_assessments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees e1
        JOIN employees e2 ON e1.company_id = e2.company_id
        WHERE e2.id = auth.uid() 
        AND e1.id = employee_skill_assessments.employee_id
    )
);

-- RLS Policies for learning_path_recommendations
CREATE POLICY "Users can view learning recommendations for their company" ON learning_path_recommendations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees e1
        JOIN employees e2 ON e1.company_id = e2.company_id
        WHERE e2.id = auth.uid() 
        AND e1.id = learning_path_recommendations.employee_id
    )
);

-- RLS Policies for performance_prediction_models
CREATE POLICY "Users can view prediction models" ON performance_prediction_models FOR SELECT USING (true);

-- RLS Policies for ml_prediction_logs
CREATE POLICY "Users can view prediction logs for their company" ON ml_prediction_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND company_id = (SELECT company_id FROM employees WHERE id = ml_prediction_logs.employee_id)
    )
);

-- RLS Policies for employee_engagement_metrics
CREATE POLICY "Users can view engagement metrics for their company" ON employee_engagement_metrics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND company_id = employee_engagement_metrics.company_id
    )
);

-- RLS Policies for career_progression_predictions
CREATE POLICY "Users can view career predictions for their company" ON career_progression_predictions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees e1
        JOIN employees e2 ON e1.company_id = e2.company_id
        WHERE e2.id = auth.uid() 
        AND e1.id = career_progression_predictions.employee_id
    )
);

-- Create ML functions
CREATE OR REPLACE FUNCTION calculate_retention_risk_score(
    p_employee_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    risk_score DECIMAL(5,2) := 0.0;
    performance_score DECIMAL(5,2);
    engagement_score DECIMAL(5,2);
    tenure_months INTEGER;
    recent_feedback_sentiment DECIMAL(3,2);
BEGIN
    -- Get performance score
    SELECT COALESCE(AVG(rating), 3.0) INTO performance_score
    FROM performance_reviews 
    WHERE employee_id = p_employee_id 
    AND created_at >= NOW() - INTERVAL '12 months';
    
    -- Get engagement score
    SELECT COALESCE(overall_engagement_score, 50.0) INTO engagement_score
    FROM employee_engagement_metrics 
    WHERE employee_id = p_employee_id;
    
    -- Calculate tenure in months
    SELECT EXTRACT(MONTH FROM AGE(NOW(), hire_date)) INTO tenure_months
    FROM employees WHERE id = p_employee_id;
    
    -- Get recent feedback sentiment
    SELECT COALESCE(AVG(sentiment_score), 0.0) INTO recent_feedback_sentiment
    FROM employee_feedback_analysis 
    WHERE employee_id = p_employee_id 
    AND created_at >= NOW() - INTERVAL '6 months';
    
    -- Calculate risk score (0-100, higher = more risk)
    risk_score := 100 - (
        (performance_score * 0.3) + 
        (engagement_score * 0.3) + 
        (LEAST(tenure_months / 12.0, 5) * 10 * 0.2) + 
        ((recent_feedback_sentiment + 1) * 50 * 0.2)
    );
    
    RETURN GREATEST(0, LEAST(100, risk_score));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_promotion_readiness(
    p_employee_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    readiness_score DECIMAL(5,2) := 0.0;
    performance_avg DECIMAL(5,2);
    skill_gap_count INTEGER;
    leadership_experience INTEGER;
    project_success_rate DECIMAL(5,2);
BEGIN
    -- Get average performance rating
    SELECT COALESCE(AVG(rating), 3.0) INTO performance_avg
    FROM performance_reviews 
    WHERE employee_id = p_employee_id 
    AND created_at >= NOW() - INTERVAL '24 months';
    
    -- Count skill gaps
    SELECT COUNT(*) INTO skill_gap_count
    FROM employee_skill_assessments 
    WHERE employee_id = p_employee_id 
    AND current_level < target_level;
    
    -- Calculate leadership experience (simplified)
    SELECT COALESCE(COUNT(*), 0) INTO leadership_experience
    FROM performance_reviews 
    WHERE employee_id = p_employee_id 
    AND rating >= 4.0
    AND created_at >= NOW() - INTERVAL '12 months';
    
    -- Calculate project success rate (simplified)
    SELECT COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0) * 100.0 / 
           NULLIF(COUNT(*), 0) INTO project_success_rate
    FROM projects 
    WHERE assigned_to = p_employee_id;
    
    -- Calculate readiness score
    readiness_score := (
        (performance_avg * 20) + 
        (GREATEST(0, 20 - (skill_gap_count * 2))) + 
        (LEAST(leadership_experience * 5, 20)) + 
        (COALESCE(project_success_rate * 0.4, 0))
    );
    
    RETURN GREATEST(0, LEAST(100, readiness_score));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION analyze_employee_sentiment(
    p_employee_id UUID
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    sentiment_score DECIMAL(3,2) := 0.0;
    feedback_count INTEGER;
    avg_sentiment DECIMAL(3,2);
BEGIN
    -- Get average sentiment from recent feedback
    SELECT 
        COUNT(*),
        COALESCE(AVG(sentiment_score), 0.0)
    INTO feedback_count, avg_sentiment
    FROM employee_feedback_analysis 
    WHERE employee_id = p_employee_id 
    AND created_at >= NOW() - INTERVAL '6 months';
    
    -- Weight the sentiment based on feedback count
    IF feedback_count > 0 THEN
        sentiment_score := avg_sentiment * LEAST(feedback_count / 5.0, 1.0);
    ELSE
        -- Default neutral sentiment if no feedback
        sentiment_score := 0.0;
    END IF;
    
    RETURN GREATEST(-1.0, LEAST(1.0, sentiment_score));
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_ml_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update employee analytics when performance reviews are added
    IF TG_TABLE_NAME = 'performance_reviews' THEN
        UPDATE employee_analytics 
        SET 
            performance_trend_score = calculate_promotion_readiness(NEW.employee_id),
            promotion_readiness_score = calculate_promotion_readiness(NEW.employee_id),
            last_performance_analysis = NOW(),
            updated_at = NOW()
        WHERE employee_id = NEW.employee_id;
        
        -- Insert if doesn't exist
        INSERT INTO employee_analytics (employee_id, company_id, performance_trend_score, promotion_readiness_score, last_performance_analysis)
        SELECT NEW.employee_id, e.company_id, calculate_promotion_readiness(NEW.employee_id), calculate_promotion_readiness(NEW.employee_id), NOW()
        FROM employees e
        WHERE e.id = NEW.employee_id
        AND NOT EXISTS (SELECT 1 FROM employee_analytics WHERE employee_id = NEW.employee_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for performance reviews
CREATE TRIGGER trigger_update_ml_analytics_performance
    AFTER INSERT OR UPDATE ON performance_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_analytics();

-- Create function to refresh all ML analytics
CREATE OR REPLACE FUNCTION refresh_ml_analytics()
RETURNS void AS $$
BEGIN
    -- Update retention risk scores
    UPDATE employee_analytics 
    SET 
        retention_risk_score = calculate_retention_risk_score(employee_id),
        last_retention_analysis = NOW(),
        updated_at = NOW();
    
    -- Update promotion readiness scores
    UPDATE employee_analytics 
    SET 
        promotion_readiness_score = calculate_promotion_readiness(employee_id),
        last_promotion_analysis = NOW(),
        updated_at = NOW();
    
    -- Update sentiment scores
    UPDATE employee_analytics 
    SET 
        overall_sentiment_score = analyze_employee_sentiment(employee_id),
        last_sentiment_analysis = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert sample ML models
INSERT INTO performance_prediction_models (model_name, model_type, model_version, model_config, is_active, is_production_ready, deployment_status)
VALUES 
    ('Retention Risk Model v1.0', 'retention', '1.0', '{"algorithm": "random_forest", "features": ["performance", "engagement", "tenure", "sentiment"]}', true, true, 'deployed'),
    ('Performance Prediction Model v1.0', 'performance', '1.0', '{"algorithm": "gradient_boosting", "features": ["historical_performance", "skills", "projects"]}', true, true, 'deployed'),
    ('Promotion Readiness Model v1.0', 'promotion', '1.0', '{"algorithm": "logistic_regression", "features": ["performance", "skills", "leadership", "tenure"]}', true, true, 'deployed'),
    ('Learning Recommendation Model v1.0', 'learning', '1.0', '{"algorithm": "collaborative_filtering", "features": ["skills", "interests", "career_goals"]}', true, true, 'deployed'),
    ('Sentiment Analysis Model v1.0', 'sentiment', '1.0', '{"algorithm": "transformer", "features": ["feedback_text", "context", "tone"]}', true, true, 'deployed');
