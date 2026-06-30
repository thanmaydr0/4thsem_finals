import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const openaiKey = process.env.VITE_OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}
if (!openaiKey) {
  console.error('Missing OpenAI credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function processSectionWithAI(textContent, sourceName, hasAnswers) {
  const prompt = `
  You are an expert in Universal Human Values (UHV). I have a set of multiple-choice questions from a previous year paper (${sourceName}).
  ${hasAnswers ? "The text includes the correct answers." : "The text does NOT include correct answers. Please solve them based on standard UHV principles."}
  
  Extract ALL the questions and return them as a JSON array of objects.
  Each object MUST have:
  - question_text (string)
  - option_a (string)
  - option_b (string)
  - option_c (string)
  - option_d (string)
  - correct_answer (string: "A", "B", "C", or "D")
  - explanation_a (string: brief explanation why A is correct or incorrect)
  - explanation_b (string: brief explanation why B is correct or incorrect)
  - explanation_c (string: brief explanation why C is correct or incorrect)
  - explanation_d (string: brief explanation why D is correct or incorrect)

  Here is the text:
  ---
  ${textContent}
  ---
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    tools: [
      {
        type: "function",
        function: {
          name: "output_questions",
          description: "Outputs the extracted and solved questions",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_text: { type: "string" },
                    option_a: { type: "string" },
                    option_b: { type: "string" },
                    option_c: { type: "string" },
                    option_d: { type: "string" },
                    correct_answer: { type: "string", enum: ["A", "B", "C", "D"] },
                    explanation_a: { type: "string" },
                    explanation_b: { type: "string" },
                    explanation_c: { type: "string" },
                    explanation_d: { type: "string" }
                  },
                  required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation_a", "explanation_b", "explanation_c", "explanation_d"]
                }
              }
            },
            required: ["questions"]
          }
        }
      }
    ],
    tool_choice: { type: "function", function: { name: "output_questions" } }
  });

  const toolCall = response.choices[0].message.tool_calls[0];
  const data = JSON.parse(toolCall.function.arguments);
  
  const formatted = data.questions.map(q => ({
    ...q,
    source_type: 'qp',
    source_name: sourceName,
    frequency: 1
  }));

  return formatted;
}

async function main() {
  console.log('Reading pasted_pyqs.txt...');
  const text = fs.readFileSync('scripts/pasted_pyqs.txt', 'utf-8');
  
  // Split the text into sections
  const sections = text.split(/Part \d+[A-D]? – /g).filter(s => s.trim().length > 100);
  console.log(`Found ${sections.length} sections to process.`);
  // [0]: June 2024 Qs only (we can skip this since Part 2 has the answers)
  // [1]: Part 2A
  // [2]: Part 2B
  // [3]: Part 2C
  // [4]: Part 2D
  // [5]: Part 3
  // [6]: Part 4
  // [7]: Part 5
  
  const mappings = [
    { text: sections[1], sourceName: 'June/July 2024', hasAnswers: true },
    { text: sections[2], sourceName: 'June/July 2024', hasAnswers: true },
    { text: sections[3], sourceName: 'June/July 2024', hasAnswers: true },
    { text: sections[4], sourceName: 'June/July 2024', hasAnswers: true },
    { text: sections[5], sourceName: 'Dec 2024 / Jan 2025', hasAnswers: false },
    { text: sections[6], sourceName: 'June/July 2025', hasAnswers: false },
    { text: sections[7], sourceName: 'Dec 2025 / Jan 2026', hasAnswers: false }
  ];

  let totalInserted = 0;

  for (let i = 0; i < mappings.length; i++) {
    const map = mappings[i];
    if (!map.text) continue;
    console.log(`\nProcessing ${map.sourceName} (Section ${i+1}/${mappings.length})...`);
    try {
      const questions = await processSectionWithAI(map.text, map.sourceName, map.hasAnswers);
      console.log(`  -> Extracted ${questions.length} questions.`);
      
      if (questions.length > 0) {
        // Insert to Supabase in batches
        for (let j = 0; j < questions.length; j += 50) {
          const batch = questions.slice(j, j + 50);
          const { error } = await supabase.from('uhv_questions').insert(batch);
          if (error) {
            console.error(`  -> Failed to insert batch: ${error.message}`);
          } else {
            console.log(`  -> Inserted ${batch.length} questions.`);
            totalInserted += batch.length;
          }
        }
      }
    } catch (err) {
      console.error(`  -> Error processing ${map.sourceName}: ${err.message}`);
    }
  }

  console.log(`\nDone! Total questions inserted: ${totalInserted}`);
}

main().catch(console.error);
