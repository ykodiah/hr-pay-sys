import { read, utils } from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('data/PAYE_SCHEDULE_2026.-PHARMACY-JUNE-1b5df4.xlsx');
const workbook = read(file, { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Get raw data to see actual structure
const data = utils.sheet_to_json(sheet, { defval: '', header: 1 }); // array format
console.log('Total rows:', data.length);
console.log('\nAll rows:');
data.forEach((row, i) => {
  console.log(`Row ${i}:`, row.filter(v => v !== '' && v !== undefined).slice(0, 15));
});
