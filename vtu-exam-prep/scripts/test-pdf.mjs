import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function run() {
  const dataBuffer = fs.readFileSync('C:\\4thsem\\4thsem_finals\\uhv\\qp_uhv\\jan2025.pdf');
  const data = await pdf(dataBuffer);
  console.log(data.text);
}
run();
