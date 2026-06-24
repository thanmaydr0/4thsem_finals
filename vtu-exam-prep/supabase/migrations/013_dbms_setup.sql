-- Insert DBMS into the unified subjects table
INSERT INTO public.subjects (id, name, course_code)
VALUES ('dbms', 'Database Management Systems', 'BCS403')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  course_code = EXCLUDED.course_code;

-- Create the dbms-notes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dbms-notes', 'dbms-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the new storage bucket
CREATE POLICY "Public Access dbms-notes" ON storage.objects FOR SELECT USING (bucket_id = 'dbms-notes');
CREATE POLICY "Public Insert dbms-notes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dbms-notes');
