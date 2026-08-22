const fs = require('fs');
const path = require('path');

const dir = '/Users/venkat/Desktop/Dayflow/frontend/src';

const replacements = [
  [/bg-white/g, 'bg-[#050505]'],
  [/bg-slate-50/g, 'bg-[#0a0a0a]'],
  [/bg-gray-50/g, 'bg-[#0a0a0a]'],
  [/bg-slate-100/g, 'bg-white/5'],
  [/bg-slate-200/g, 'bg-white/10'],
  [/text-slate-900/g, 'text-white'],
  [/text-slate-950/g, 'text-white'],
  [/text-gray-900/g, 'text-white'],
  [/text-slate-800/g, 'text-gray-200'],
  [/text-slate-700/g, 'text-gray-300'],
  [/text-slate-600/g, 'text-gray-400'],
  [/border-slate-100/g, 'border-white/5'],
  [/border-slate-200/g, 'border-white/10'],
  [/border-gray-200/g, 'border-white/10'],
  [/shadow-sm/g, 'shadow-2xl'],
  // Rename Dayflow references? The user said "adjust the captions in the whole website the branding nd all according to this website".
  // The CogniCore logo is already in the navbar, and it says "Dayflow". I'll rename "Dayflow" to "CogniCore" in most places if the user wants "exact" branding.
  // Actually, I should just make sure the UI matches exactly.
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

walk(dir);
console.log("Dark mode replacement complete.");
