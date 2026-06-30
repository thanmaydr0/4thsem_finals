// ── Database row types ──

export interface Subject {
  id: string;
  name: string;
  course_code: string;
}

export interface Module {
  id: string;
  subject_id: string;
  module_number: number;
  title: string;
  description: string | null;
}

export interface Question {
  id: string;
  module_id: string;
  subject_id: string;
  question_text: string;
  exam_cycles: string[] | null;
  frequency: number | null;
  course_outcome: string | null;
  youtube_url: string | null;
  youtube_title: string | null;
  youtube_channel: string | null;
  youtube_links?: {
    gate_smashers?: string;
    neso_academy?: string;
    fallback?: string;
  } | null;
  topic_tags: string[] | null;
  sort_order: number | null;
}

export interface Note {
  id: string;
  subject_id: string;
  module_id: string | null;
  title: string;
  file_path: string;
  file_type: 'pdf' | 'image';
  sort_order: number | null;
}

export interface ChatSession {
  id: string;
  question_id: string | null;
  subject_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface StudyProgress {
  id: string;
  question_id: string;
  status: 'not_started' | 'reviewing' | 'confident';
  last_reviewed_at: string | null;
  notes_text: string | null;
}

// ── Derived / UI types ──

export interface ModuleWithStats extends Module {
  questionCount: number;
  avgFrequency: number | null; // only meaningful for ADA
}

export type SubjectId = 'ada' | 'ai' | 'dbms' | 'uhv';
