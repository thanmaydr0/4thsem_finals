-- Create the site_rating_feedback table
CREATE TABLE IF NOT EXISTS public.site_rating_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_rating_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Allow insert access to site_rating_feedback" ON public.site_rating_feedback FOR INSERT WITH CHECK (true);

-- Allow select for stats purposes later
CREATE POLICY "Allow read access to site_rating_feedback" ON public.site_rating_feedback FOR SELECT USING (true);
