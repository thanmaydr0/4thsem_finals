import { supabase } from './supabase';

export const DBMS_SYSTEM_PROMPT = `You are an expert DBMS tutor specializing in VTU BCS403 Database Management Systems
for 4th semester B.E. students under the 2022 scheme. Your role is to help students
understand and prepare for their DBMS examinations.

You have deep expertise in all 5 modules:
Module 1: ER Modeling, Three-Schema Architecture, DBMS components, data independence
Module 2: Relational Algebra, integrity constraints, ER-to-relational mapping
Module 3: Normalization (1NF/2NF/3NF/BCNF/4NF/5NF), Armstrong's rules, functional
          dependencies, minimal cover, SQL DDL/DML
Module 4: Advanced SQL (correlated subqueries, triggers, assertions, cursors, embedded
          SQL), ACID properties, transaction states, concurrency anomalies, serializability
Module 5: Two-Phase Locking (2PL), wait-die/wound-wait protocols, multiple granularity
          locking, MongoDB CRUD, Neo4j graph databases, NoSQL categories, CAP theorem

When a student asks a question:
1. Answer clearly and precisely in the context of VTU exam expectations.
2. For mathematical topics (relational algebra, normalization, Armstrong's rules, 2PL
   serializability proofs), show step-by-step working with formal notation.
3. For ER diagram questions, describe the diagram verbally since you cannot draw.
4. Flag high-frequency exam topics (those that appeared in all 4 exam cycles: July 2024,
   Jan 2025, July 2025, Jan 2026) with a ⭐ when relevant.
5. Use standardized academic schemas in your examples: COMPANY database, EMP/DEPT/
   PROJECT, Sailors/Boats/Reserves, Student/Instructor.
6. Keep answers concise enough for exam-style writing (aim for 10–15 mark answer length
   where appropriate).
7. If a student says "explain for exam" or "how to write this in exam", give a structured
   answer with headings and sub-points formatted for exam writing.

You must not answer questions unrelated to DBMS or computer science.
Under no circumstances should you use phrases like "As an AI language model" or "I am an AI". Just provide the answer directly without meta-commentary.`;

export async function sendDBMSChatMessage({
  sessionId,
  message,
  questionContext,
  studentName,
  useRag = false,
}: {
  sessionId: string | null;
  message: string;
  questionContext?: string | null;
  studentName?: string | null;
  useRag?: boolean;
}): Promise<{ sessionId: string; reply: string }> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('VITE_OPENAI_API_KEY is not configured in .env');
  }

  // 1. Ensure a session exists
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const { data: newSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({ subject_id: 'dbms', student_name: studentName })
      .select("id")
      .single();

    if (sessionError) throw new Error('Failed to create chat session: ' + sessionError.message);
    activeSessionId = newSession.id;
  }

  // 2. Save user message locally to supabase
  await supabase.from("chat_messages").insert({
    session_id: activeSessionId,
    role: "user",
    content: message,
  });

  // 2.5 RAG Pipeline: Fetch context from note embeddings
  let ragContextChunks: string[] = [];
  if (useRag) {
    try {
      // Generate embedding for the user message
      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: message,
        }),
      });
      
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const embedding = embedData.data[0].embedding;

        // Match against pgvector
        const { data: matches, error: matchError } = await supabase.rpc('match_note_embeddings', {
          query_embedding: embedding,
          match_threshold: 0.70, // cosine similarity threshold
          match_count: 3, // top 3 chunks
          filter_subject_id: 'dbms'
        });

        if (!matchError && matches && matches.length > 0) {
          ragContextChunks = matches.map((m: any) => m.content);
        }
      }
    } catch (err) {
      console.warn("RAG retrieval failed, proceeding without context:", err);
    }
  }

  // 3. Fetch history for context (fetch newest 20, then reverse to chronological order)
  const { data: historyData } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", activeSessionId)
    .order("created_at", { ascending: false })
    .limit(20);

  const history = historyData ? historyData.reverse() : [];

  // 4. Build messages payload
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: DBMS_SYSTEM_PROMPT },
  ];

  if (questionContext) {
    messages.push({
      role: "system",
      content: `The student is currently looking at this exam question: "${questionContext}". Help them understand and prepare for it. Do NOT display the question back to them — they can already see it.`,
    });
  }

  if (useRag) {
    if (ragContextChunks.length > 0) {
      const contextStr = ragContextChunks.map((chunk, i) => `--- Note Excerpt ${i + 1} ---\n${chunk}`).join('\n\n');
      messages.push({
        role: "system",
        content: `You are a strict Document Q&A bot. The student has uploaded class notes. Here are relevant excerpts retrieved based on their question:\n\n${contextStr}\n\nUse this context heavily to answer their question. If the answer is not in the context, tell them it's not in their notes. If you use this context, explicitly cite it.`
      });
    } else {
      messages.push({
        role: "system",
        content: `You are a Document Q&A bot, but no relevant notes were found for this query. Inform the student that you couldn't find anything in their uploaded notes matching this question, and provide a brief general answer if possible.`
      });
    }
  } else if (ragContextChunks.length > 0) {
    const contextStr = ragContextChunks.map((chunk, i) => `--- Note Excerpt ${i + 1} ---\n${chunk}`).join('\n\n');
    messages.push({
      role: "system",
      content: `The student has uploaded class notes. Here are relevant excerpts retrieved based on their question:\n\n${contextStr}\n\nUse this context heavily to answer their question, ensuring your answer aligns with their class materials. If you use this context, explicitly cite it (e.g. "According to your notes...").`
    });
  }

  if (history) {
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // 5. Call OpenAI directly
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!openaiRes.ok) {
    const errBody = await openaiRes.text();
    console.error("OpenAI API error:", errBody);
    throw new Error('Failed to get response from AI. Please try again.');
  }

  const completion = await openaiRes.json();
  const assistantMessage =
    completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

  // 6. Save assistant message
  await supabase.from("chat_messages").insert({
    session_id: activeSessionId as string,
    role: "assistant",
    content: assistantMessage,
  });

  return {
    sessionId: activeSessionId as string,
    reply: assistantMessage,
  };
}
