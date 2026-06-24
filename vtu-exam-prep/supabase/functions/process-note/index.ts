import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import pdf from "npm:pdf-parse";
import { Buffer } from "node:buffer";

// Add CORS headers so we can call this from the browser
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessNoteRequest {
  noteId: string;
  filePath: string;
  subjectId: string;
  bucketName: string;
  fileType: "pdf" | "image";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    if (!openaiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { noteId, filePath, subjectId, bucketName, fileType } = await req.json() as ProcessNoteRequest;

    if (!noteId || !filePath || !bucketName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let extractedText = "";

    // 2. Extract Text
    if (fileType === "pdf") {
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
    } else {
      // For images, we could use OpenAI Vision to transcribe notes
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe all the handwritten or printed text in this image accurately. Do not include any conversational filler, just the text." },
                { type: "image_url", image_url: { url: `data:${fileData.type};base64,${base64}` } }
              ]
            }
          ]
        })
      });

      if (!visionRes.ok) throw new Error("Vision API failed to transcribe image");
      const visionData = await visionRes.json();
      extractedText = visionData.choices[0].message.content;
    }

    if (!extractedText || extractedText.trim() === "") {
      return new Response(JSON.stringify({ message: "No text found to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Chunk the text (rough approximation by paragraphs)
    // A more sophisticated chunker would split by tokens, but this works for a POC
    const chunks = extractedText
      .split(/\n\s*\n/)
      .map(c => c.trim())
      .filter(c => c.length > 50);

    let totalChunksProcessed = 0;

    // Process chunks in batches to avoid rate limits
    for (const chunk of chunks) {
      // 4. Generate Embedding for chunk
      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: chunk
        })
      });

      if (!embedRes.ok) continue;

      const embedData = await embedRes.json();
      const embedding = embedData.data[0].embedding;

      // 5. Store in pgvector
      const { error: insertError } = await supabase
        .from("note_embeddings")
        .insert({
          note_id: noteId,
          subject_id: subjectId,
          content: chunk,
          embedding: embedding
        });

      if (!insertError) {
        totalChunksProcessed++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      chunksProcessed: totalChunksProcessed 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
