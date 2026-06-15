import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !YOUTUBE_API_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SECRET_KEY, YOUTUBE_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const moduleArg = args.find(a => a.startsWith('--module='));
const targetModule = moduleArg ? parseInt(moduleArg.split('=')[1], 10) : null;

// Sleep utility to handle API rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchYouTube(query, expectedChannelPattern = null) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.append('part', 'snippet');
  url.searchParams.append('q', query);
  url.searchParams.append('type', 'video');
  url.searchParams.append('maxResults', '3'); // Fetch a few to check channel names
  url.searchParams.append('key', YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`YouTube API Error: ${error.error?.message || res.statusText}`);
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  if (expectedChannelPattern) {
    // Try to find a result that matches the channel pattern
    const match = data.items.find(item => 
      item.snippet.channelTitle.toLowerCase().includes(expectedChannelPattern.toLowerCase())
    );
    if (match) return match;
    return null; // Return null if specific channel not found, so we can fallback
  }

  return data.items[0]; // Fallback to top result
}

async function run() {
  console.log(`Starting YouTube link resolution...`);
  if (isDryRun) console.log(`[DRY RUN MODE] - No database updates will be performed.`);
  if (targetModule) console.log(`Filtering for Module: ${targetModule}`);

  // Fetch ADA questions with module joining
  let queryBuilder = supabase
    .from('questions')
    .select(`
      id, 
      question_text, 
      topic_tags,
      modules!inner(module_number)
    `)
    .eq('subject_id', 'ada');

  if (targetModule) {
    queryBuilder = queryBuilder.eq('modules.module_number', targetModule);
  }

  const { data: questions, error } = await queryBuilder;
  if (error) {
    console.error("Error fetching questions:", error);
    process.exit(1);
  }

  console.log(`Found ${questions.length} questions to process.\n`);

  let stats = {
    abdulBari: 0,
    jennysLectures: 0,
    fallback: 0,
    failed: 0
  };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const tagsStr = (q.topic_tags || []).join(' ');
    // Use tags if available, else first 50 chars of question
    const searchBase = tagsStr ? tagsStr : q.question_text.slice(0, 50);
    
    console.log(`Processing [${i + 1}/${questions.length}]: ${searchBase}`);

    let videoData = null;
    let strategy = '';

    try {
      // 1st Attempt: Abdul Bari
      videoData = await searchYouTube(`${searchBase} algorithm Abdul Bari`, 'Abdul Bari');
      if (videoData) {
        strategy = 'abdulBari';
        stats.abdulBari++;
      }

      // 2nd Attempt: Jenny's Lectures
      if (!videoData) {
        await sleep(500); // Respect rate limit before next try
        videoData = await searchYouTube(`${searchBase} algorithm Jenny's Lectures CS IT`, 'Jenny');
        if (videoData) {
          strategy = 'jennysLectures';
          stats.jennysLectures++;
        }
      }

      // Fallback
      if (!videoData) {
        await sleep(500);
        videoData = await searchYouTube(`${searchBase} computer science algorithm tutorial`);
        if (videoData) {
          strategy = 'fallback';
          stats.fallback++;
        }
      }

      if (!videoData) {
        console.log(`  ❌ Failed to find any suitable video.`);
        stats.failed++;
      } else {
        const videoUrl = `https://www.youtube.com/watch?v=${videoData.id.videoId}`;
        const videoTitle = videoData.snippet.title;
        const channelName = videoData.snippet.channelTitle;

        console.log(`  ✅ Found [${strategy}]: ${videoTitle} (${channelName})`);

        if (!isDryRun) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              youtube_url: videoUrl,
              youtube_title: videoTitle,
              youtube_channel: channelName
            })
            .eq('id', q.id);
            
          if (updateError) {
            console.error(`  ❌ DB Update failed:`, updateError);
          }
        }
      }
    } catch (e) {
      console.error(`  ❌ Error during search:`, e.message);
      stats.failed++;
    }

    // Rate limit delay between questions
    await sleep(500);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Processed  : ${questions.length}`);
  console.log(`Abdul Bari       : ${stats.abdulBari}`);
  console.log(`Jenny's Lectures : ${stats.jennysLectures}`);
  console.log(`Fallback         : ${stats.fallback}`);
  console.log(`Failed           : ${stats.failed}`);
  if (isDryRun) {
    console.log(`\n(Note: This was a dry run. No changes were made to the database.)`);
  }
}

run();
