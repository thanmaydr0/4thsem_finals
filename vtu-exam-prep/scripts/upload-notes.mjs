import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const args = process.argv.slice(2);
const subjectArg = args.find(a => a.startsWith('--subject='));
const folderArg = args.find(a => a.startsWith('--folder='));

if (!subjectArg || !folderArg) {
  console.error("Usage: node scripts/upload-notes.mjs --subject=<ada|ai> --folder=<path/to/notes>");
  process.exit(1);
}

const subjectId = subjectArg.split('=')[1].toLowerCase();
const folderPath = path.resolve(folderArg.split('=')[1]);

if (!['ada', 'ai'].includes(subjectId)) {
  console.error("Error: --subject must be 'ada' or 'ai'");
  process.exit(1);
}

const bucketName = `${subjectId}-notes`;

// Recursively find all target files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  // Sort files for consistent sort_order
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function cleanTitle(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

// Extract module number from folder path (e.g., "module-1" -> 1)
function getModuleNumber(filePath) {
  const match = filePath.match(/module-(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

async function run() {
  console.log(`Scanning folder: ${folderPath}`);
  if (!fs.existsSync(folderPath)) {
    console.error(`Error: Folder not found -> ${folderPath}`);
    process.exit(1);
  }

  const files = getFiles(folderPath);
  console.log(`Found ${files.length} valid files (.pdf, .jpg, .jpeg, .png).\n`);

  if (files.length === 0) return;

  // Fetch module mapping for the subject to map module_number -> module_id
  const { data: modules, error: modError } = await supabase
    .from('modules')
    .select('id, module_number')
    .eq('subject_id', subjectId);

  if (modError) {
    console.error("Error fetching modules:", modError);
    process.exit(1);
  }

  const moduleMap = {};
  modules.forEach(m => {
    moduleMap[m.module_number] = m.id;
  });

  let stats = {
    success: 0,
    failed: 0
  };

  // Process files
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const fileType = ext === '.pdf' ? 'pdf' : 'image';
    const title = cleanTitle(fileName);
    const moduleNum = getModuleNumber(filePath);
    const moduleId = moduleNum ? moduleMap[moduleNum] : null;

    // Use relative path structure for the storage key to avoid collisions
    const relativePath = path.relative(folderPath, filePath).replace(/\\/g, '/');
    const storagePath = relativePath; 

    console.log(`Processing [${i + 1}/${files.length}]: ${fileName}`);
    console.log(`  Title: ${title} | Type: ${fileType} | Module: ${moduleNum || 'General'}`);

    try {
      // 1. Upload to Storage
      const fileBuffer = fs.readFileSync(filePath);
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
          upsert: true,
          contentType: ext === '.pdf' ? 'application/pdf' : `image/${ext.replace('.', '')}`
        });

      if (uploadError) {
        throw new Error(`Upload Failed: ${uploadError.message}`);
      }
      
      console.log(`  ✅ Uploaded to bucket '${bucketName}' at '${storagePath}'`);

      // 2. Insert into notes table
      // Check if it already exists to avoid duplicates if run multiple times
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('file_path', storagePath)
        .single();
        
      if (!existing) {
        const { error: dbError } = await supabase
          .from('notes')
          .insert({
            subject_id: subjectId,
            module_id: moduleId,
            title: title,
            file_path: storagePath,
            file_type: fileType,
            sort_order: i + 1
          });

        if (dbError) {
          throw new Error(`Database Insert Failed: ${dbError.message}`);
        }
        console.log(`  ✅ Inserted database record for '${title}'`);
      } else {
        // Optionally update sort order / title
        await supabase
          .from('notes')
          .update({ title, module_id: moduleId, file_type: fileType, sort_order: i + 1 })
          .eq('id', existing.id);
        console.log(`  ✅ Updated existing database record for '${title}'`);
      }

      stats.success++;

    } catch (err) {
      console.error(`  ❌ Error processing file: ${err.message}`);
      stats.failed++;
    }
    console.log(''); // Blank line for readability
  }

  console.log(`=== UPLOAD SUMMARY ===`);
  console.log(`Subject : ${subjectId.toUpperCase()}`);
  console.log(`Bucket  : ${bucketName}`);
  console.log(`Success : ${stats.success}`);
  console.log(`Failed  : ${stats.failed}`);
}

run();
