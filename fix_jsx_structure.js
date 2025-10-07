import fs from 'fs';

// Read the file
const content = fs.readFileSync('/workspace/app/app/settings/page.tsx', 'utf8');
const lines = content.split('\n');

// Find all div opening and closing tags
const divOpenings = [];
const divClosings = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Find opening div tags
  const openMatches = line.match(/<div[^>]*>/g);
  if (openMatches) {
    openMatches.forEach(() => {
      divOpenings.push({ line: lineNum, content: line.trim() });
    });
  }
  
  // Find closing div tags
  const closeMatches = line.match(/<\/div>/g);
  if (closeMatches) {
    closeMatches.forEach(() => {
      divClosings.push({ line: lineNum, content: line.trim() });
    });
  }
});

console.log(`Found ${divOpenings.length} opening div tags and ${divClosings.length} closing div tags`);

// Check for mismatches around the error lines
const errorLines = [6907, 6908, 7099, 7225, 7226, 7227];

errorLines.forEach(errorLine => {
  console.log(`\nAround line ${errorLine}:`);
  const start = Math.max(0, errorLine - 5);
  const end = Math.min(lines.length, errorLine + 5);
  
  for (let i = start; i < end; i++) {
    const marker = i + 1 === errorLine ? '>>> ' : '    ';
    console.log(`${marker}${i + 1}: ${lines[i]}`);
  }
});

// Check div balance
let balance = 0;
let maxBalance = 0;
let maxBalanceLine = 0;

lines.forEach((line, index) => {
  const openCount = (line.match(/<div[^>]*>/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  
  balance += openCount - closeCount;
  
  if (balance > maxBalance) {
    maxBalance = balance;
    maxBalanceLine = index + 1;
  }
  
  if (balance < 0) {
    console.log(`\nNegative balance at line ${index + 1}: ${balance}`);
    console.log(`Line: ${line}`);
  }
});

console.log(`\nFinal balance: ${balance}`);
console.log(`Max balance: ${maxBalance} at line ${maxBalanceLine}`);