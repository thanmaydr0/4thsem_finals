-- Enable the pgcrypto extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. subjects table
-- ==========================================
CREATE TABLE subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course_code TEXT NOT NULL
);

-- ==========================================
-- 2. modules table
-- ==========================================
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

-- ==========================================
-- 3. questions table
-- ==========================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    exam_cycles TEXT[],
    frequency INT,
    course_outcome TEXT,
    youtube_url TEXT,
    youtube_title TEXT,
    youtube_channel TEXT,
    topic_tags TEXT[],
    sort_order INT
);

-- ==========================================
-- 4. notes table
-- ==========================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
    sort_order INT
);

-- ==========================================
-- 5. chat_sessions table
-- ==========================================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. chat_messages table
-- ==========================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 7. study_progress table
-- ==========================================
CREATE TABLE study_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'reviewing', 'confident')),
    last_reviewed_at TIMESTAMPTZ,
    notes_text TEXT
);

-- ==========================================
-- Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Create permissive policies (No Auth required)
-- ==========================================
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on modules" ON modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_sessions" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on study_progress" ON study_progress FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- Storage Buckets Setup Instructions
-- ==========================================
/*
To create the storage buckets, you can either use the Supabase Dashboard UI
under "Storage" -> "New bucket", or run the following SQL (if you have the 
required privileges on the storage schema):

INSERT INTO storage.buckets (id, name, public) VALUES ('ada-notes', 'ada-notes', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-notes', 'ai-notes', true);

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Permissive policies for storage buckets
CREATE POLICY "Allow all access to ada-notes bucket" 
ON storage.objects FOR ALL 
USING (bucket_id = 'ada-notes') WITH CHECK (bucket_id = 'ada-notes');

CREATE POLICY "Allow all access to ai-notes bucket" 
ON storage.objects FOR ALL 
USING (bucket_id = 'ai-notes') WITH CHECK (bucket_id = 'ai-notes');
*/
