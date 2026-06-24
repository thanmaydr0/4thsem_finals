import type { Question } from '../types';

export interface PredictedQuestion extends Question {
  probabilityScore: number; // 0 to 100
  predictionReason: string;
}

export function generateExamPredictions(questions: Question[]): PredictedQuestion[] {
  if (!questions || questions.length === 0) return [];

  // 1. Determine the timeline of exam cycles
  const allCycles = new Set<string>();
  questions.forEach(q => {
    if (q.exam_cycles) {
      q.exam_cycles.forEach(c => allCycles.add(c));
    }
  });

  // Sort cycles by year then month (Jan before July)
  const sortedCycles = Array.from(allCycles).sort((a, b) => {
    const parseCycle = (c: string) => {
      const parts = c.split(' ');
      const month = parts[0]?.toLowerCase() === 'jan' ? 0 : 1; // Assuming Jan or July
      const year = parseInt(parts[1] || '0', 10);
      return year * 10 + month;
    };
    return parseCycle(a) - parseCycle(b);
  });

  const mostRecentCycle = sortedCycles[sortedCycles.length - 1];

  // 2. Score each question
  const scoredQuestions: PredictedQuestion[] = questions.map(q => {
    let score = 30; // Base score
    let reason = "Standard syllabus topic.";

    const freq = q.frequency || 0;
    const cycles = q.exam_cycles || [];

    // Frequency factor
    if (freq >= 4) {
      score += 40;
      reason = "Highly frequent staple question. VTU rarely skips this.";
    } else if (freq === 3) {
      score += 25;
      reason = "Important recurring topic.";
    } else if (freq === 2) {
      score += 15;
    }

    // Recency factor
    const appearedLast = cycles.includes(mostRecentCycle);
    
    if (appearedLast) {
      if (freq >= 3) {
        score += 10;
        reason = "Appeared recently, but is so fundamental it will likely repeat.";
      } else {
        score -= 15;
        reason = "Appeared in the last exam cycle. Less likely to immediately repeat.";
      }
    } else {
      if (freq > 0) {
        score += 20;
        reason = "Overdue. Has appeared before but skipped the last cycle.";
      }
    }

    // Cap score at 99
    score = Math.max(15, Math.min(99, score));
    
    // Add a tiny bit of random noise for realism (0 to 2%)
    score += Math.floor(Math.random() * 3);
    score = Math.min(99, score);

    return {
      ...q,
      probabilityScore: score,
      predictionReason: reason
    };
  });

  // 3. Select top 10 questions, ensuring distribution across modules
  // We want roughly 2 questions per module (assuming 5 modules)
  scoredQuestions.sort((a, b) => b.probabilityScore - a.probabilityScore);

  const selectedQuestions: PredictedQuestion[] = [];
  const moduleCounts: Record<string, number> = {};

  for (const sq of scoredQuestions) {
    if (selectedQuestions.length >= 10) break;
    
    const modId = sq.module_id;
    if (!moduleCounts[modId]) moduleCounts[modId] = 0;

    // Try to limit to 2 or 3 per module
    if (moduleCounts[modId] < 3) {
      selectedQuestions.push(sq);
      moduleCounts[modId]++;
    }
  }

  // If we couldn't get 10, fill with the highest scores regardless of module
  if (selectedQuestions.length < 10) {
    for (const sq of scoredQuestions) {
      if (selectedQuestions.length >= 10) break;
      if (!selectedQuestions.find(s => s.id === sq.id)) {
        selectedQuestions.push(sq);
      }
    }
  }

  // Re-sort final paper by module number / logic (here we just sort by module_id string for grouping)
  selectedQuestions.sort((a, b) => a.module_id.localeCompare(b.module_id));

  return selectedQuestions;
}

export async function generatePredictionRationale(questions: PredictedQuestion[]): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("Missing OpenAI API Key");
  }

  const prompt = `You are an elite, highly secretive predictive algorithm designed to forecast the next VTU University exam paper.
I am providing you with the top 10 questions selected for the next exam based on historical frequency and pattern analysis.

Questions:
${questions.map((q, i) => `${i + 1}. [${q.probabilityScore}% Prob] ${q.question_text}`).join('\n')}

Write a "Predictive Analysis Report" (about 3-4 paragraphs) explaining to the student WHY these topics are highly probable. 
Adopt a tone that is serious, analytical, slightly hacker/cypherpunk, and "dangerously accurate".
Talk about VTU paper setter psychology, repeating patterns, and topics that are "overdue".
Do NOT just list the questions back. Summarize the thematic focus.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to generate rationale");
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
