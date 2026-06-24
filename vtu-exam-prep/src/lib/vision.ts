export interface EvaluationResult {
  score: number;
  maxScore: number;
  feedback: string;
  missingPoints: string[];
}

export async function evaluateHandwrittenAnswer(
  imageBase64: string,
  questionText: string,
  subjectName: string = "VTU Computer Science"
): Promise<EvaluationResult> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('VITE_OPENAI_API_KEY is not configured in .env');
  }

  const prompt = `You are an incredibly strict, precise VTU (Visvesvaraya Technological University) external examiner evaluating a student's handwritten answer for a ${subjectName} exam.
  
Question: "${questionText}"

Examine the provided image of the student's handwritten answer carefully. 
- Look for correct definitions, standard architectural diagrams, mathematical proofs, and key technical terminology.
- Be highly critical. If they missed core components that a textbook would require, penalize them.
- If diagrams are requested or implicitly required (like for 3-Schema Architecture), penalize if missing.
- Grade the answer out of 10 marks.

Return the result STRICTLY as a JSON object with the following schema:
{
  "score": <number between 0 and 10>,
  "maxScore": 10,
  "feedback": "<detailed 2-3 sentence paragraph critiquing the answer, mentioning exactly what was good and what was bad>",
  "missingPoints": ["<point 1 that should have been included>", "<point 2>", ...]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a JSON-only evaluation API."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Vision API error:", errorBody);
    throw new Error("Failed to evaluate answer. Please try again.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content received from AI.");
  }

  try {
    const parsed = JSON.parse(content) as EvaluationResult;
    return parsed;
  } catch (err) {
    console.error("Failed to parse evaluation JSON:", content);
    throw new Error("Failed to parse evaluation results.");
  }
}
