-- Enhanced Communication Module Schema
-- This script adds Slack-like features to the communication system

-- Create user presence table for online status and last seen
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_typing BOOLEAN DEFAULT false,
    current_channel_id UUID,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create read receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES employee_communications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES employee_communications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Create channels table (like Slack channels)
CREATE TABLE IF NOT EXISTS communication_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(20) DEFAULT 'public' CHECK (channel_type IN ('public', 'private', 'direct')),
    description TEXT,
    created_by UUID REFERENCES employees(id),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, channel_name)
);

-- Create channel members table
CREATE TABLE IF NOT EXISTS channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(channel_id, user_id)
);

-- Create message threads table
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_message_id UUID REFERENCES employee_communications(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
    thread_name VARCHAR(255),
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds'),
    UNIQUE(channel_id, user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS communication_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES communication_channels(id) ON DELETE CASCADE,
    message_id UUID REFERENCES employee_communications(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) DEFAULT 'mention' CHECK (notification_type IN ('mention', 'direct_message', 'channel_message', 'reaction', 'thread_reply')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel_id ON typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at ON typing_indicators(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON communication_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON communication_notifications(is_read);

-- Add RLS policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_presence
CREATE POLICY "Users can view all presence data" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can update their own presence" ON user_presence FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own presence" ON user_presence FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for message_read_receipts
CREATE POLICY "Users can view read receipts for their messages" ON message_read_receipts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employee_communications 
        WHERE id = message_id 
        AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
);
CREATE POLICY "Users can create read receipts" ON message_read_receipts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for message_reactions
CREATE POLICY "Users can view all reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON message_reactions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own reactions" ON message_reactions FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for communication_channels
CREATE POLICY "Users can view channels in their company" ON communication_channels FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND company_id = communication_channels.company_id
    )
);
CREATE POLICY "Users can create channels" ON communication_channels FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND company_id = communication_channels.company_id
    )
);

-- RLS Policies for channel_members
CREATE POLICY "Users can view channel members" ON channel_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND company_id = (SELECT company_id FROM communication_channels WHERE id = channel_id)
    )
);
CREATE POLICY "Users can join channels" ON channel_members FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for message_threads
CREATE POLICY "Users can view threads in their channels" ON message_threads FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM channel_members 
        WHERE channel_id = message_threads.channel_id 
        AND user_id = auth.uid()
    )
);

-- RLS Policies for typing_indicators
CREATE POLICY "Users can view typing indicators in their channels" ON typing_indicators FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM channel_members 
        WHERE channel_id = typing_indicators.channel_id 
        AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can create typing indicators" ON typing_indicators FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for communication_notifications
CREATE POLICY "Users can view their own notifications" ON communication_notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own notifications" ON communication_notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communication_channels_updated_at BEFORE UPDATE ON communication_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
    p_user_id UUID,
    p_status VARCHAR(20),
    p_current_channel_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, current_channel_id, last_seen)
    VALUES (p_user_id, p_status, p_current_channel_id, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        current_channel_id = EXCLUDED.current_channel_id,
        last_seen = EXCLUDED.last_seen,
        updated_at = NOW();
END;
$$ language 'plpgsql';

-- Create function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(
    p_message_id UUID,
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    INSERT INTO message_read_receipts (message_id, user_id, read_at)
    VALUES (p_message_id, p_user_id, NOW())
    ON CONFLICT (message_id, user_id) DO NOTHING;
    
    UPDATE employee_communications 
    SET is_read = true, read_at = NOW()
    WHERE id = p_message_id AND recipient_id = p_user_id;
END;
$$ language 'plpgsql';

-- Create function to add reaction
CREATE OR REPLACE FUNCTION add_message_reaction(
    p_message_id UUID,
    p_user_id UUID,
    p_emoji VARCHAR(10)
)
RETURNS void AS $$
BEGIN
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES (p_message_id, p_user_id, p_emoji)
    ON CONFLICT (message_id, user_id, emoji) DO NOTHING;
END;
$$ language 'plpgsql';

-- Create function to remove reaction
CREATE OR REPLACE FUNCTION remove_message_reaction(
    p_message_id UUID,
    p_user_id UUID,
    p_emoji VARCHAR(10)
)
RETURNS void AS $$
BEGIN
    DELETE FROM message_reactions 
    WHERE message_id = p_message_id 
    AND user_id = p_user_id 
    AND emoji = p_emoji;
END;
$$ language 'plpgsql';

-- Insert some default channels
INSERT INTO communication_channels (company_id, channel_name, channel_type, description, created_by)
SELECT 
    c.id,
    'general',
    'public',
    'General discussion for the team',
    e.id
FROM companies c
CROSS JOIN employees e
WHERE e.role = 'admin'
LIMIT 1
ON CONFLICT (company_id, channel_name) DO NOTHING;

INSERT INTO communication_channels (company_id, channel_name, channel_type, description, created_by)
SELECT 
    c.id,
    'random',
    'public',
    'Random discussions and water cooler chat',
    e.id
FROM companies c
CROSS JOIN employees e
WHERE e.role = 'admin'
LIMIT 1
ON CONFLICT (company_id, channel_name) DO NOTHING;

-- Add all employees to general channel
INSERT INTO channel_members (channel_id, user_id, role)
SELECT 
    cc.id,
    e.id,
    CASE WHEN e.role = 'admin' THEN 'admin' ELSE 'member' END
FROM communication_channels cc
CROSS JOIN employees e
WHERE cc.channel_name = 'general'
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- Add all employees to random channel
INSERT INTO channel_members (channel_id, user_id, role)
SELECT 
    cc.id,
    e.id,
    CASE WHEN e.role = 'admin' THEN 'admin' ELSE 'member' END
FROM communication_channels cc
CROSS JOIN employees e
WHERE cc.channel_name = 'random'
ON CONFLICT (channel_id, user_id) DO NOTHING;
