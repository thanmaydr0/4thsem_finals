import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fetchDBMSYouTubeLinks } from './fetchDBMSYouTube.js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Need service role key to bypass RLS, or ensure VITE_SUPABASE_PUBLISHABLE_KEY works if RLS allows updates
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching DBMS questions without YouTube links...");

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, module_id, question_text, modules!inner(module_number)')
    .eq('subject_id', 'dbms')
    .is('youtube_links', null);

  if (error) {
    console.error("Error fetching questions:", error);
    process.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.log("No DBMS questions need YouTube link population. Done.");
    process.exit(0);
  }

  console.log(`Found ${questions.length} questions to process.\n`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const moduleNum = q.modules?.module_number || '?';
    
    // Wait briefly between API calls to respect quotas
    if (i > 0) await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Module ${moduleNum} · Q[${i+1}]:`);
    
    const links = await fetchDBMSYouTubeLinks(q.question_text);
    
    if (links) {
      const gsMark = links.gate_smashers ? '✓' : '✗';
      const naMark = links.neso_academy ? '✓' : '✗';
      
      if (links.fallback) {
        console.log(`No priority-channel video found`);
        console.log(`Fallback video added`);
      } else {
        console.log(`Gate Smashers ${gsMark}`);
        console.log(`Neso Academy ${naMark}`);
      }

      const { error: updateError } = await supabase
        .from('questions')
        .update({ youtube_links: links })
        .eq('id', q.id);
        
      if (updateError) {
        console.error("Failed to update database:", updateError);
      }
    } else {
      console.log(`No videos found anywhere.`);
      // Optional: Set empty object or keep null so it can be retried later
      await supabase
        .from('questions')
        .update({ youtube_links: {} })
        .eq('id', q.id);
    }
    
    console.log('---');
  }

  console.log("\nPopulation script completed.");
}

run();
