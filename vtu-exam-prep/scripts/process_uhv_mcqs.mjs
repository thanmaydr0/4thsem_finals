import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function makeExp(optKey, ans, optText, correctText) {
  if (optKey === ans) return "Correct. '" + optText + "' is the right answer.";
  return "Incorrect. The correct answer is " + ans + ") " + correctText + ".";
}

function parseMarkdownFile(filepath, sourceName) {
  console.log('    Reading file...');
  const content = fs.readFileSync(filepath, 'utf-8');
  console.log('    File read OK. Length: ' + content.length);

  // Detect format: does it have "> **Answer:" lines?
  const hasAnswerLines = content.includes('> **Answer:');
  console.log('    Format: ' + (hasAnswerLines ? 'Answer block' : 'Inline checkmark'));

  const questions = [];

  if (hasAnswerLines) {
    // Format 1: > **Answer: X**
    const pattern = /\*\*(\d+)\.\*\*\s*([\s\S]*?)\n\n-\s*A\)\s*(.*)\n-\s*B\)\s*(.*)\n-\s*C\)\s*(.*)\n-\s*D\)\s*(.*)\n\n>\s*\*\*Answer:\s*([A-D])\*\*/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const [, , qText, optA, optB, optC, optD, ans] = match;
      const opts = { A: optA.trim(), B: optB.trim(), C: optC.trim(), D: optD.trim() };
      questions.push({
        source_type: 'notes', source_name: sourceName,
        question_text: qText.trim(),
        option_a: opts.A, option_b: opts.B, option_c: opts.C, option_d: opts.D,
        correct_answer: ans.trim(),
        explanation_a: makeExp('A', ans, opts.A, opts[ans]),
        explanation_b: makeExp('B', ans, opts.B, opts[ans]),
        explanation_c: makeExp('C', ans, opts.C, opts[ans]),
        explanation_d: makeExp('D', ans, opts.D, opts[ans]),
        frequency: 1,
      });
    }
  } else {
    // Format 2: inline checkmark
    // Split by question headers
    const qPattern = /\*\*(\d+)\.\*\*/g;
    const positions = [];
    let m;
    while ((m = qPattern.exec(content)) !== null) {
      positions.push({ index: m.index, num: m[1] });
    }

    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i + 1 < positions.length ? positions[i + 1].index : content.length;
      const block = content.substring(start, end);

      // Get question text (between **N.** and first option)
      const qTextMatch = block.match(/\*\*\d+\.\*\*\s*([\s\S]*?)(?=\n\s*-\s*[A-D]\))/);
      if (!qTextMatch) continue;

      const qText = qTextMatch[1].trim();
      const opts = {};
      let correctAnswer = null;

      // Extract each option line
      const optLines = block.match(/-\s*[A-D]\)\s*.+/g);
      if (!optLines || optLines.length < 4) continue;

      for (const line of optLines) {
        const optMatch = line.match(/-\s*([A-D])\)\s*(.*)/);
        if (!optMatch) continue;
        const key = optMatch[1];
        let text = optMatch[2].trim();
        // Remove checkmark and mark as correct
        if (text.includes('\u2705') || text.includes('\u2713')) {
          correctAnswer = key;
          text = text.replace(/[\u2705\u2713]/g, '').trim();
        }
        opts[key] = text;
      }

      if (!opts.A || !opts.B || !opts.C || !opts.D || !correctAnswer) continue;

      questions.push({
        source_type: 'notes', source_name: sourceName,
        question_text: qText,
        option_a: opts.A, option_b: opts.B, option_c: opts.C, option_d: opts.D,
        correct_answer: correctAnswer,
        explanation_a: makeExp('A', correctAnswer, opts.A, opts[correctAnswer]),
        explanation_b: makeExp('B', correctAnswer, opts.B, opts[correctAnswer]),
        explanation_c: makeExp('C', correctAnswer, opts.C, opts[correctAnswer]),
        explanation_d: makeExp('D', correctAnswer, opts.D, opts[correctAnswer]),
        frequency: 1,
      });
    }
  }

  return questions;
}

async function main() {
  console.log('============================================================');
  console.log('UHV MCQ Processing Script');
  console.log('============================================================');

  console.log('\n[STEP 1] Processing Notes MCQs...');
  const notesDir = 'C:/4thsem/4thsem_finals/uhv/notes_mcq';
  const mdFiles = fs.readdirSync(notesDir).filter(f => f.endsWith('.md')).sort();

  let allQuestions = [];
  for (const filename of mdFiles) {
    const filepath = path.join(notesDir, filename);
    const sourceName = filename.replace('.md', '');
    console.log('  Processing ' + sourceName + '...');
    try {
      const questions = parseMarkdownFile(filepath, sourceName);
      console.log('    Parsed ' + questions.length + ' questions');
      allQuestions = allQuestions.concat(questions);
    } catch (err) {
      console.error('    ERROR parsing ' + sourceName + ': ' + err.message);
    }
  }

  console.log('\n  Total notes questions: ' + allQuestions.length);

  if (allQuestions.length === 0) {
    console.log('  No questions to insert. Exiting.');
    return;
  }

  console.log('  Inserting into Supabase (batch)...');

  for (let i = 0; i < allQuestions.length; i += 50) {
    const batch = allQuestions.slice(i, i + 50);
    try {
      const { error } = await supabase.from('uhv_questions').insert(batch);
      if (error) {
        console.error('  Batch ' + (Math.floor(i / 50) + 1) + ' FAILED: ' + error.message);
      } else {
        console.log('  Inserted batch ' + (Math.floor(i / 50) + 1) + ' (' + batch.length + ' rows)');
      }
    } catch (err) {
      console.error('  Network error on batch ' + (Math.floor(i / 50) + 1) + ': ' + err.message);
    }
  }

  console.log('\n[OK] Notes MCQs done.');

  // PDFs skipped - need Vision API
  console.log('\n[STEP 2] PDF Question Papers');
  console.log('  Skipped - scanned PDFs need a valid OpenAI API key for Vision extraction.');

  console.log('\n============================================================');
  console.log('Done! Check your Supabase uhv_questions table.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
