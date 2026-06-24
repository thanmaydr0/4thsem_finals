-- Create table for AI paper survey results
CREATE TABLE IF NOT EXISTS ai_paper_survey (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rating text NOT NULL, -- 'easy', 'medium', 'hard'
    created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_paper_survey ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert survey results" ON ai_paper_survey FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read survey results" ON ai_paper_survey FOR SELECT USING (true);
