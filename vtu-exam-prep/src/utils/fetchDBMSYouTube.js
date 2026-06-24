import dotenv from 'dotenv';

// Load .env.local if present, or .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error("Missing VITE_YOUTUBE_API_KEY in environment variables.");
}

const CHANNELS = [
  {
    key: "gate_smashers",
    name: "Gate Smashers",
    channelId: "UCJihyK0A38SZ6SdJirEdIOw",
  },
  {
    key: "neso_academy",
    name: "Neso Academy",
    channelId: "UCQYMhOMi_Cdj1CEAU-fv80A",
  },
];

const STOP_WORDS = new Set([
  'define', 'explain', 'discuss', 'the', 'concept', 'of', 'and', 'with', 'examples', 'what', 'is', 'a', 'an', 'in', 'detail', 'how', 'why', 'are', 'to', 'for', 'on', 'by', 'show', 'illustrate', 'describe', 'elaborate'
]);

export function buildSearchQuery(questionText) {
  // Strip filler words
  const words = questionText.toLowerCase().replace(/[^\w\s-]/g, '').split(/\s+/);
  
  const keywords = words.filter(word => !STOP_WORDS.has(word) && word.length > 2);
  
  // Take the first 4-6 key terms for a focused query
  const query = keywords.slice(0, 6).join(' ');
  return query + " DBMS";
}

async function searchYouTube(query, channelId = null) {
  if (!YOUTUBE_API_KEY) throw new Error("VITE_YOUTUBE_API_KEY is not defined");

  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
  
  if (channelId) {
    url += `&channelId=${channelId}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("YouTube API Error:", errorData);
    throw new Error(`YouTube API failed with status ${response.status}`);
  }

  const data = await response.json();
  
  if (data.items && data.items.length > 0) {
    return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
  }
  
  return null;
}

export async function fetchDBMSYouTubeLinks(questionText) {
  const query = buildSearchQuery(questionText);
  const links = {};

  // Search Priority Channels
  for (const channel of CHANNELS) {
    try {
      const url = await searchYouTube(query, channel.channelId);
      if (url) {
        links[channel.key] = url;
      }
    } catch (err) {
      console.error(`Error searching ${channel.name}:`, err.message);
    }
  }

  // Fallback if neither found
  if (!links.gate_smashers && !links.neso_academy) {
    try {
      const fallbackUrl = await searchYouTube(query);
      if (fallbackUrl) {
        links.fallback = fallbackUrl;
      }
    } catch (err) {
      console.error("Error searching fallback:", err.message);
    }
  }

  return Object.keys(links).length > 0 ? links : null;
}
