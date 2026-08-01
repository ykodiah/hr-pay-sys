import { read, utils } from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('data/PAYE_SCHEDULE_2026.-PHARMACY-JUNE-1b5df4.xlsx');
const workbook = read(file, { cellDates: true });

console.log('Sheet names:', workbook.SheetNames);
console.log('\n=== First Sheet Data ===');
const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const data = utils.sheet_to_json(firstSheet);
console.log('Total rows:', data.length);
console.log('Column headers:', Object.keys(data[0] || {}));
console.log('\nFirst 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));
