-- Create the uhv_questions table for storing UHV subject MCQs
CREATE TABLE IF NOT EXISTS public.uhv_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('qp', 'notes')),
    source_name TEXT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation_a TEXT,
    explanation_b TEXT,
    explanation_c TEXT,
    explanation_d TEXT,
    frequency INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.uhv_questions ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access to uhv_questions" 
ON public.uhv_questions
FOR SELECT
USING (true);

-- Insert UHV into subjects table
INSERT INTO public.subjects (id, name, course_code)
VALUES ('uhv', 'Universal Human Values', 'BUHK408')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  course_code = EXCLUDED.course_code;
