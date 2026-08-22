const fs = require('fs');
const path = require('path');

const replacements = [
  [/CogniCore/g, 'Shiftly'],
  [/Dayflow/g, 'Shiftly'],
];

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [regex, replacement] of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

walk('/Users/venkat/Desktop/Dayflow/frontend/src');
console.log("Branding renamed to Shiftly.");
