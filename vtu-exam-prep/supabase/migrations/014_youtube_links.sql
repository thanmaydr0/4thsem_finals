-- Migration 014: Add youtube_links JSONB to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS youtube_links JSONB;
