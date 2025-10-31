-- Messaging Workspace Core Schema
-- Sprint 1: channel messaging foundation

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET application_name = 'supabase-migrations';

-- =====================================================================================
-- Extend existing channel members table with messaging-specific preferences
-- =====================================================================================

ALTER TABLE IF EXISTS communication_channels
    ADD COLUMN IF NOT EXISTS target_filter JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS icon TEXT,
    ADD COLUMN IF NOT EXISTS accent_color TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS channel_members
    ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS notification_level TEXT DEFAULT 'default' CHECK (notification_level IN ('default', 'mentions', 'mute')),
    ADD COLUMN IF NOT EXISTS last_read_message_id UUID;

CREATE INDEX IF NOT EXISTS idx_channel_members_last_read ON channel_members(last_read_at DESC);

-- =====================================================================================
-- Messaging tables
-- =====================================================================================

CREATE TABLE IF NOT EXISTS communication_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
    thread_id UUID,
    sender_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    content TEXT,
    rich_content JSONB DEFAULT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    visibility JSONB DEFAULT '{}'::jsonb,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_messages_channel ON communication_messages(channel_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_messages_thread ON communication_messages(thread_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_messages_sender ON communication_messages(sender_id, sent_at DESC);


CREATE TABLE IF NOT EXISTS communication_message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
    root_message_id UUID UNIQUE REFERENCES communication_messages(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    topic TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_message_threads_channel ON communication_message_threads(channel_id);


ALTER TABLE communication_messages
    ADD CONSTRAINT communication_messages_thread_id_fkey
    FOREIGN KEY (thread_id)
    REFERENCES communication_message_threads(id)
    ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS communication_message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES communication_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_read_receipts_message ON communication_message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_comm_read_receipts_user ON communication_message_read_receipts(user_id);


CREATE TABLE IF NOT EXISTS communication_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES communication_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    reacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comm_message_reactions_message ON communication_message_reactions(message_id);


CREATE TABLE IF NOT EXISTS communication_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES communication_messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_message_attachments_message ON communication_message_attachments(message_id);


CREATE TABLE IF NOT EXISTS communication_message_events (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES communication_messages(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_message_events_type ON communication_message_events(event_type, created_at DESC);


-- =====================================================================================
-- Row Level Security Policies
-- =====================================================================================

ALTER TABLE communication_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_message_events ENABLE ROW LEVEL SECURITY;

-- Helper EXISTS clause reused across policies
CREATE OR REPLACE FUNCTION communication_user_in_channel(p_channel uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM channel_members cm
        WHERE cm.channel_id = p_channel
          AND cm.user_id = auth.uid()
    );
$$;


-- Threads policies
CREATE POLICY comm_threads_select ON communication_message_threads
    FOR SELECT
    USING (
        communication_user_in_channel(channel_id)
    );

CREATE POLICY comm_threads_insert ON communication_message_threads
    FOR INSERT
    WITH CHECK (
        communication_user_in_channel(channel_id)
    );

CREATE POLICY comm_threads_update ON communication_message_threads
    FOR UPDATE
    USING (
        communication_user_in_channel(channel_id)
    )
    WITH CHECK (
        communication_user_in_channel(channel_id)
    );


-- Messages policies
CREATE POLICY comm_messages_select ON communication_messages
    FOR SELECT
    USING (
        communication_user_in_channel(channel_id)
    );

CREATE POLICY comm_messages_insert ON communication_messages
    FOR INSERT
    WITH CHECK (
        communication_user_in_channel(channel_id)
    );

CREATE POLICY comm_messages_update ON communication_messages
    FOR UPDATE
    USING (
        communication_user_in_channel(channel_id) AND sender_id = auth.uid()
    )
    WITH CHECK (
        communication_user_in_channel(channel_id)
    );

CREATE POLICY comm_messages_delete ON communication_messages
    FOR DELETE
    USING (
        communication_user_in_channel(channel_id) AND sender_id = auth.uid()
    );


-- Read receipts
CREATE POLICY comm_read_receipts_select ON communication_message_read_receipts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );

CREATE POLICY comm_read_receipts_insert ON communication_message_read_receipts
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );


-- Reactions
CREATE POLICY comm_reactions_select ON communication_message_reactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );

CREATE POLICY comm_reactions_insert ON communication_message_reactions
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );

CREATE POLICY comm_reactions_delete ON communication_message_reactions
    FOR DELETE
    USING (auth.uid() = user_id);


-- Attachments
CREATE POLICY comm_attachments_select ON communication_message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );

CREATE POLICY comm_attachments_insert ON communication_message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );


-- Message events (read-only to channel members)
CREATE POLICY comm_events_select ON communication_message_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM communication_messages m
            WHERE m.id = message_id
              AND communication_user_in_channel(m.channel_id)
        )
    );


-- =====================================================================================
-- Triggers & helpers
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_comm_message_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comm_messages_updated
    BEFORE UPDATE ON communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_comm_message_updated_at();


CREATE OR REPLACE FUNCTION trg_comm_thread_reply_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
        UPDATE communication_message_threads
        SET reply_count = reply_count + 1,
            last_reply_at = NOW()
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' AND OLD.thread_id IS NOT NULL THEN
        UPDATE communication_message_threads
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_comm_thread_reply_count_insert
    AFTER INSERT ON communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION trg_comm_thread_reply_count();

CREATE TRIGGER trg_comm_thread_reply_count_delete
    AFTER DELETE ON communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION trg_comm_thread_reply_count();


-- Log message events on create
CREATE OR REPLACE FUNCTION log_comm_message_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO communication_message_events (message_id, company_id, event_type, context)
    VALUES (NEW.id, NEW.company_id, 'MESSAGE.CREATED', jsonb_build_object('channel_id', NEW.channel_id));
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comm_message_created
    AFTER INSERT ON communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION log_comm_message_created();


-- =====================================================================================
-- Seed role permissions (optional safeguard)
-- =====================================================================================

INSERT INTO permissions (resource, action)
SELECT resource, action FROM (
    VALUES
        ('communication_messages', 'create'),
        ('communication_messages', 'read'),
        ('communication_messages', 'update'),
        ('communication_channels', 'manage')
) AS perm(resource, action)
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p WHERE p.resource = perm.resource AND p.action = perm.action
);

