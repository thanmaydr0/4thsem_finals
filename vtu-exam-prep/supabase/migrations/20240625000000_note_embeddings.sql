-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store note embeddings
CREATE TABLE IF NOT EXISTS note_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
    subject_id text NOT NULL,
    content text NOT NULL,
    embedding vector(1536) NOT NULL, -- 1536 is the dimension for text-embedding-3-small
    created_at timestamptz DEFAULT now()
);

-- Create an index for faster similarity searches
CREATE INDEX IF NOT EXISTS note_embeddings_embedding_idx ON note_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read embeddings (or restrict if needed, but notes are public for now)
CREATE POLICY "Note embeddings are readable by everyone" ON note_embeddings FOR SELECT USING (true);
CREATE POLICY "Note embeddings are insertable by authenticated/anon" ON note_embeddings FOR INSERT WITH CHECK (true);

-- Create a match_note_embeddings function for similarity search
CREATE OR REPLACE FUNCTION match_note_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_subject_id text
)
RETURNS TABLE (
  id uuid,
  note_id uuid,
  content text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    note_embeddings.id,
    note_embeddings.note_id,
    note_embeddings.content,
    1 - (note_embeddings.embedding <=> query_embedding) AS similarity
  FROM note_embeddings
  WHERE 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
    AND note_embeddings.subject_id = filter_subject_id
  ORDER BY note_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;
