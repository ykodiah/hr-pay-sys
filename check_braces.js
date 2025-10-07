import fs from 'fs';

// Read the file
const content = fs.readFileSync('/workspace/app/app/settings/page.tsx', 'utf8');
const lines = content.split('\n');

// Check for unmatched braces
let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Count opening and closing braces
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  const openParens = (line.match(/\(/g) || []).length;
  const closeParens = (line.match(/\)/g) || []).length;
  const openBrackets = (line.match(/\[/g) || []).length;
  const closeBrackets = (line.match(/\]/g) || []).length;
  
  braceCount += openBraces - closeBraces;
  parenCount += openParens - closeParens;
  bracketCount += openBrackets - closeBrackets;
  
  // Check for negative counts
  if (braceCount < 0) {
    console.log(`Negative brace count at line ${lineNum}: ${braceCount}`);
    console.log(`Line: ${line}`);
  }
  if (parenCount < 0) {
    console.log(`Negative paren count at line ${lineNum}: ${parenCount}`);
    console.log(`Line: ${line}`);
  }
  if (bracketCount < 0) {
    console.log(`Negative bracket count at line ${lineNum}: ${bracketCount}`);
    console.log(`Line: ${line}`);
  }
  
  // Check around the error line
  if (lineNum >= 4400 && lineNum <= 4410) {
    console.log(`Line ${lineNum}: braces=${braceCount}, parens=${parenCount}, brackets=${bracketCount}`);
    console.log(`Content: ${line}`);
  }
});

console.log(`\nFinal counts: braces=${braceCount}, parens=${parenCount}, brackets=${bracketCount}`);