-- Create the secret_chat table
CREATE TABLE IF NOT EXISTS public.secret_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.secret_chat ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated/anon users to read and insert
-- The application logic will enforce the token gate on the frontend
CREATE POLICY "Allow read access to secret_chat" ON public.secret_chat FOR SELECT USING (true);
CREATE POLICY "Allow insert access to secret_chat" ON public.secret_chat FOR INSERT WITH CHECK (true);

-- Enable realtime
-- Note: 'supabase_realtime' publication usually exists, we just add the table to it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'secret_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.secret_chat;
  END IF;
END $$;
