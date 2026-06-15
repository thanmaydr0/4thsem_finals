# VTU Exam Prep

A complete exam preparation platform specifically built for VTU Computer Science students taking BCS401 (ADA) and BAD402 (AI).

Features a distraction-free UI, detailed progress tracking, smart study plans based on past exam frequency, integrated handwritten notes, and an AI tutor sidekick.

## Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd vtu-exam-prep
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials and optionally a YouTube Data API Key.

3. **Run Dev Server**
   ```bash
   npm run dev
   ```

---

## 🗄️ Supabase Setup & Migrations

This project requires a Supabase project. Once created, run the migrations in order from `supabase/migrations/` to set up the schema and insert the seed data.

1. **001_schema.sql**: Creates the base tables (`modules`, `questions`, `study_progress`, `notes`, `chat_messages`).
2. **002_seed_ada.sql**: Seeds ADA modules and questions.
3. **003_seed_ai.sql**: Seeds AI modules and questions.

### Storage Buckets

You must manually create two **public** storage buckets in your Supabase dashboard:
- `ada-notes`
- `ai-notes`

---

## 🤖 AI Assistant (Edge Function)

The AI tutor chat feature runs through a Supabase Edge Function that securely proxies calls to OpenAI. The API key never touches the client.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Set your OpenAI API key as a Supabase secret:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
3. Deploy the edge function:
   ```bash
   supabase functions deploy chat
   ```

> [!NOTE]
> The edge function uses `gpt-4o-mini` for cost efficiency. A typical student session costs less than $0.01.

---

## 📂 Scripts

The project includes handy Node.js scripts in the `scripts/` folder to populate extra metadata.

### 1. Upload Notes (`upload-notes.mjs`)
Batch uploads PDFs or images to Supabase Storage and inserts records into the `notes` table.
```bash
node scripts/upload-notes.mjs --subject=ada --folder=./path/to/notes
```

### 2. Resolve YouTube Links (`resolve-youtube-links.mjs`)
Finds and links the best YouTube tutorial videos for ADA questions (e.g., Abdul Bari).
Requires `YOUTUBE_API_KEY` in `.env`.

> [!WARNING] 
> **Daily Quota Limits**: Google's free tier allows ~100 searches/day. Use `--dry-run` or `--module=1` to test incrementally.

```bash
node scripts/resolve-youtube-links.mjs --module=1
```

---

## ⌨️ Keyboard Shortcuts

Press `?` in the app to view shortcuts.
- `j` / `k` — Scroll questions
- `n` / `a` — Toggle Notes / AI Assistant
- `1-5` — Jump to modules
- `0` — All modules
- `f` — Toggle Focus Mode
- `Esc` — Close modals/focus
