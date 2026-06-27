import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionId, message, subjectId, questionContext, studentName } = await req.json();

    if (!message || !subjectId) {
      return new Response(
        JSON.stringify({ error: "message and subjectId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const courseCode = subjectId === "ada" ? "BCS401" : "BAD402";

    // Create or reuse session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({ subject_id: subjectId, student_name: studentName })
        .select("id")
        .single();

      if (sessionError) throw sessionError;
      activeSessionId = newSession.id;
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      session_id: activeSessionId,
      role: "user",
      content: message,
    });

    // Fetch last 20 messages for context (newest first, then reverse to chronological)
    const { data: historyData } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", activeSessionId)
      .order("created_at", { ascending: false })
      .limit(20);

    const history = historyData ? historyData.reverse() : [];

    // Build messages array for OpenAI
    const systemPrompt = `You are a patient, encouraging tutor helping a VTU engineering student prepare for their ${subjectId.toUpperCase()} exam (course code ${courseCode}). When discussing a specific exam question, help the student understand concepts, walk through approaches step-by-step, and ask them questions to check understanding — but if they ask you to 'just give the answer', you may provide a full worked solution since this is for their personal exam prep. Keep explanations exam-focused: VTU rubrics reward stating definitions formally, showing step-by-step traces/derivations, and drawing diagrams in words when relevant. Be concise but thorough. Under no circumstances should you use phrases like "As an AI language model" or "I am an AI". Just provide the answer directly without meta-commentary.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add question context if provided
    if (questionContext) {
      messages.push({
        role: "system",
        content: `The student is currently looking at this exam question: "${questionContext}". Help them understand and prepare for it. Do NOT display the question back to them — they can already see it.`,
      });
    }

    // Append conversation history
    if (history) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("OpenAI API error:", errBody);
      return new Response(
        JSON.stringify({
          error: "Failed to get response from AI. Please try again.",
          details: openaiRes.status,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const completion = await openaiRes.json();
    const assistantMessage =
      completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    // Save assistant message
    await supabase.from("chat_messages").insert({
      session_id: activeSessionId,
      role: "assistant",
      content: assistantMessage,
    });

    return new Response(
      JSON.stringify({
        sessionId: activeSessionId,
        reply: assistantMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
