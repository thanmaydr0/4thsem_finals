import os
import re
import json
import fitz  # PyMuPDF
import base64
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv('.env.local')
load_dotenv('.env')

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SECRET_KEY")

if not supabase_url or not supabase_key:
    print("Missing Supabase credentials. Check .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def generate_explanation(question_text, option_text, option_key, correct_answer, correct_text):
    """Generate a simple but helpful explanation for each option."""
    if option_key == correct_answer:
        return f"Correct. '{option_text}' is the right answer to this question."
    else:
        return f"Incorrect. The correct answer is {correct_answer}) {correct_text}."

def process_markdown_file(filepath, source_name):
    print(f"\nProcessing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = re.compile(
        r'\*\*(\d+)\.\*\*\s*(.*?)\n\n'
        r'-\s*A\)\s*(.*?)\n'
        r'-\s*B\)\s*(.*?)\n'
        r'-\s*C\)\s*(.*?)\n'
        r'-\s*D\)\s*(.*?)\n\n'
        r'>\s*\*\*Answer:\s*([A-D])\*\*',
        re.DOTALL
    )
    matches = pattern.findall(content)
    
    print(f"Found {len(matches)} questions in {source_name}.")
    
    inserted = 0
    for match in matches:
        q_num, q_text, opt_a, opt_b, opt_c, opt_d, ans = match
        q_text = q_text.strip()
        opt_a = opt_a.strip()
        opt_b = opt_b.strip()
        opt_c = opt_c.strip()
        opt_d = opt_d.strip()
        ans = ans.strip()
        
        options = {'A': opt_a, 'B': opt_b, 'C': opt_c, 'D': opt_d}
        correct_text = options[ans]
        
        row = {
            "source_type": "notes",
            "source_name": source_name,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_answer": ans,
            "explanation_a": generate_explanation(q_text, opt_a, 'A', ans, correct_text),
            "explanation_b": generate_explanation(q_text, opt_b, 'B', ans, correct_text),
            "explanation_c": generate_explanation(q_text, opt_c, 'C', ans, correct_text),
            "explanation_d": generate_explanation(q_text, opt_d, 'D', ans, correct_text),
            "frequency": 1
        }
        
        try:
            supabase.table('uhv_questions').insert(row).execute()
            inserted += 1
        except Exception as e:
            print(f"  Failed Q{q_num}: {e}")
    
    print(f"  [OK] Inserted {inserted}/{len(matches)} questions from {source_name}.")


def process_pdf_file(filepath, source_name):
    print(f"\nProcessing PDF {filepath}...")
    doc = fitz.open(filepath)
    
    full_text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        full_text += text + "\n"
    
    if len(full_text.strip()) < 100:
        print(f"  [WARN] PDF {source_name} has little/no extractable text (scanned image?). Skipping.")
        return
    
    # Try multiple patterns to extract MCQs from the PDF text
    # VTU papers typically have formats like:
    # 1. Question text
    # a) option  b) option  c) option  d) option
    # OR
    # 1. Question text
    # A. option  B. option  C. option  D. option
    
    # Clean up the text
    full_text = full_text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Pattern 1: numbered question with a/b/c/d options
    pattern1 = re.compile(
        r'(\d+)\.\s*(.*?)\s*'
        r'[aA][\.\)]\s*(.*?)\s*'
        r'[bB][\.\)]\s*(.*?)\s*'
        r'[cC][\.\)]\s*(.*?)\s*'
        r'[dD][\.\)]\s*(.*?)(?=\n\d+\.|$)',
        re.DOTALL
    )
    
    matches = pattern1.findall(full_text)
    
    if not matches:
        print(f"  [WARN] Could not parse MCQs from {source_name} text. Saving raw text for manual review.")
        with open(f"scripts/pdf_text_{source_name}.txt", 'w', encoding='utf-8') as f:
            f.write(full_text)
        print(f"  Saved raw text to scripts/pdf_text_{source_name}.txt")
        return
    
    print(f"  Found {len(matches)} questions in {source_name}.")
    
    inserted = 0
    for match in matches:
        q_num, q_text, opt_a, opt_b, opt_c, opt_d = match
        q_text = ' '.join(q_text.split()).strip()
        opt_a = ' '.join(opt_a.split()).strip()
        opt_b = ' '.join(opt_b.split()).strip()
        opt_c = ' '.join(opt_c.split()).strip()
        opt_d = ' '.join(opt_d.split()).strip()
        
        if not q_text or not opt_a or not opt_b:
            continue
        
        # Default to 'A' since we can't determine the answer from the PDF
        # This will need manual correction or a future AI pass
        ans = 'A'
        
        row = {
            "source_type": "qp",
            "source_name": source_name,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_answer": ans,
            "explanation_a": "Answer extracted from previous year paper. Verify with your notes.",
            "explanation_b": "Answer extracted from previous year paper. Verify with your notes.",
            "explanation_c": "Answer extracted from previous year paper. Verify with your notes.",
            "explanation_d": "Answer extracted from previous year paper. Verify with your notes.",
            "frequency": 1
        }
        
        try:
            supabase.table('uhv_questions').insert(row).execute()
            inserted += 1
        except Exception as e:
            print(f"  Failed Q{q_num}: {e}")
    
    print(f"  [OK] Inserted {inserted} questions from {source_name}.")


# ─── MAIN ──────────────────────────────────────────────
print("=" * 60)
print("UHV MCQ Processing Script (No OpenAI Required)")
print("=" * 60)

# Step 1: Process Notes MCQs (Markdown files)
print("\n[STEP 1] Processing Notes MCQs...")
notes_dir = 'C:/4thsem/4thsem_finals/uhv/notes_mcq'
for filename in sorted(os.listdir(notes_dir)):
    if filename.endswith('.md'):
        process_markdown_file(os.path.join(notes_dir, filename), filename.replace('.md', ''))

print("\n[OK] All Notes MCQs processed.")

# Step 2: Process QP PDFs
print("\n[STEP 2] Processing Question Paper PDFs...")
qp_dir = 'C:/4thsem/4thsem_finals/uhv/qp_uhv'
for filename in sorted(os.listdir(qp_dir)):
    if filename.endswith('.pdf'):
        process_pdf_file(os.path.join(qp_dir, filename), filename.replace('.pdf', ''))

print("\n[OK] All QP PDFs processed.")
print("=" * 60)
print("Done! Check your Supabase uhv_questions table.")
