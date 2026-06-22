-- Create the ada_exam_feedback table
CREATE TABLE IF NOT EXISTS public.ada_exam_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ada_exam_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Allow insert access to ada_exam_feedback" ON public.ada_exam_feedback FOR INSERT WITH CHECK (true);

-- Optional: Allow anyone to read if we want to show stats later, but keeping it insert-only for security is fine,
-- but we might want to read it in the stats page later so we allow select.
CREATE POLICY "Allow read access to ada_exam_feedback" ON public.ada_exam_feedback FOR SELECT USING (true);
