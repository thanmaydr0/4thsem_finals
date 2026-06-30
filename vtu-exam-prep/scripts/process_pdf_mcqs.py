import os
import json
import base64
import fitz  # PyMuPDF
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv('.env.local')
load_dotenv('.env')

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SECRET_KEY")
openai_api_key = os.environ.get("VITE_OPENAI_API_KEY")

if not supabase_url or not supabase_key:
    print("Missing Supabase credentials. Check .env")
    exit(1)

if not openai_api_key:
    print("Missing OpenAI API key. Check .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)
client = OpenAI(api_key=openai_api_key)

def process_pdf_with_vision(filepath, source_name):
    print(f"\nProcessing PDF {filepath} with Vision API...")
    doc = fitz.open(filepath)
    
    all_questions = []
    
    for page_num in range(len(doc)):
        print(f"  Processing page {page_num + 1}/{len(doc)}...")
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0)) # 2x resolution
        
        # Save temporarily
        temp_img_path = f"temp_page_{page_num}.png"
        pix.save(temp_img_path)
        
        with open(temp_img_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
        os.remove(temp_img_path)
        
        # Send to OpenAI
        prompt = """
        Extract all the Multiple Choice Questions (MCQs) from this question paper image.
        For each question, also PROVIDE the correct answer based on Universal Human Values (UHV) concepts.
        Provide a brief explanation for why each option is correct or incorrect.
        
        Return the result EXACTLY as a JSON array of objects with the following schema:
        [
            {
                "question_text": "...",
                "option_a": "...",
                "option_b": "...",
                "option_c": "...",
                "option_d": "...",
                "correct_answer": "A", // or "B", "C", "D"
                "explanation_a": "...",
                "explanation_b": "...",
                "explanation_c": "...",
                "explanation_d": "..."
            }
        ]
        
        If there are no MCQs on this page, return an empty array [].
        Do NOT output markdown code blocks like ```json. Just output the raw JSON array.
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2048,
                temperature=0.1
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean up markdown if model outputs it
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
                
            page_questions = json.loads(result_text)
            
            for q in page_questions:
                q["source_type"] = "qp"
                q["source_name"] = source_name
                q["frequency"] = 1
                
            all_questions.extend(page_questions)
            print(f"    -> Extracted {len(page_questions)} questions from this page.")
            
        except Exception as e:
            print(f"    -> Error processing page {page_num + 1}: {e}")
            
    # Insert to Supabase in batches
    if all_questions:
        print(f"  Inserting {len(all_questions)} questions into Supabase...")
        inserted = 0
        for i in range(0, len(all_questions), 50):
            batch = all_questions[i:i+50]
            try:
                supabase.table('uhv_questions').insert(batch).execute()
                inserted += len(batch)
            except Exception as e:
                print(f"    -> Failed to insert batch {i//50 + 1}: {e}")
        print(f"  [OK] Successfully inserted {inserted}/{len(all_questions)} questions for {source_name}.")
    else:
        print(f"  [WARN] No questions extracted from {source_name}.")


# ─── MAIN ──────────────────────────────────────────────
print("=" * 60)
print("UHV PDF Processing Script (Using OpenAI Vision)")
print("=" * 60)

qp_dir = 'C:/4thsem/4thsem_finals/uhv/qp_uhv'
for filename in sorted(os.listdir(qp_dir)):
    if filename.endswith('.pdf'):
        process_pdf_with_vision(os.path.join(qp_dir, filename), filename.replace('.pdf', ''))

print("\n[OK] All QP PDFs processed.")
print("=" * 60)
print("Done! Check your Supabase uhv_questions table.")
