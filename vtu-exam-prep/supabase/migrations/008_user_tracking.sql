-- Migration to add student_name to tracking tables

-- Add to site_visits
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS student_name text;

-- Add to chat_sessions
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS student_name text;

-- Add to study_progress
-- Note: if study_progress has a unique constraint on question_id, it might need to be dropped
-- and replaced with a unique constraint on (student_name, question_id).
-- Let's assume the previous constraint (if any) was just on id.
ALTER TABLE public.study_progress ADD COLUMN IF NOT EXISTS student_name text;
