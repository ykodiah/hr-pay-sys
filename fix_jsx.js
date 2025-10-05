import fs from 'fs';

// Read the file
const content = fs.readFileSync('/workspace/app/app/settings/page.tsx', 'utf8');

// The issue seems to be with missing closing div tags
// Let me add the missing closing div tag for the space-y-4 div that was opened at line 6164
const lines = content.split('\n');

// Find the line with the closing CardContent that has the error
let fixed = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</CardContent>') && i === 6906) { // line 6907 (0-indexed)
    // Add the missing closing div tag before this CardContent
    lines.splice(i, 0, '                </div>');
    fixed = true;
    break;
  }
}

if (fixed) {
  fs.writeFileSync('/workspace/app/app/settings/page.tsx', lines.join('\n'));
  console.log('Fixed missing closing div tag');
} else {
  console.log('Could not find the specific line to fix');
}