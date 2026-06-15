import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, 
  process.env.SUPABASE_SECRET_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('questions')
    .select('youtube_url')
    .eq('subject_id', 'ada')
    .not('youtube_url', 'is', null);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Verified! Found ${data.length} ADA questions with youtube_urls saved in the database.`);
  }
}

check();
