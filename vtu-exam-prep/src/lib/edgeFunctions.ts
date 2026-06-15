import { supabase } from './supabase';

interface ChatRequest {
  sessionId: string | null;
  message: string;
  subjectId: string;
  questionContext?: string | null;
}

interface ChatResponse {
  sessionId: string;
  reply: string;
}

/**
 * Send a chat message through the Supabase Edge Function
 * which securely proxies the OpenAI API call.
 */
export async function sendChatMessage(
  req: ChatRequest
): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: {
      sessionId: req.sessionId,
      message: req.message,
      subjectId: req.subjectId,
      questionContext: req.questionContext,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to reach AI assistant.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    sessionId: data.sessionId,
    reply: data.reply,
  };
}
