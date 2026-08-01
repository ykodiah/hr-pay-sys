import { read, utils } from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('data/PAYE_SCHEDULE_2026.-PHARMACY-JUNE-1b5df4.xlsx');
const workbook = read(file, { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Get as object array to find the header row
const data = utils.sheet_to_json(sheet, { defval: '', header: 1 });

// Find the header row (row 14 has "Ser. No", "TIN / GHANA CARD NO.", etc.)
const headerRowIdx = 14; // 0-indexed
const headers = data[headerRowIdx];

console.log('=== GRA PAYE Schedule Column Structure ===');
console.log('Total columns:', headers.length);
console.log('\nColumn Headers:');
headers.forEach((h, i) => {
  console.log(`${i+1}. ${h}`);
});

// Show sample data row structure
if (data.length > headerRowIdx + 2) {
  console.log('\nSample data row (first employee):');
  const sampleRow = data[headerRowIdx + 3];
  headers.forEach((h, i) => {
    if (h && h.trim()) {
      console.log(`${h}: ${sampleRow[i] ?? 'N/A'}`);
    }
  });
}
