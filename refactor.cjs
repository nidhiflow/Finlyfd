const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

let modifiedFilesCount = 0;

walk(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Tailwind text colors
    content = content.replace(/text-white\/([0-9]+)/g, 'text-ink/$1');
    content = content.replace(/text-white\/\[([0-9.]+)\]/g, 'text-ink/[$1]');
    content = content.replace(/text-white/g, 'text-ink');
    
    // Tailwind background colors
    content = content.replace(/bg-white\/([0-9]+)/g, 'bg-ink/$1');
    content = content.replace(/bg-white\/\[([0-9.]+)\]/g, 'bg-ink/[$1]');
    
    // Tailwind border colors
    content = content.replace(/border-white\/([0-9]+)/g, 'border-ink/$1');
    content = content.replace(/border-white\/\[([0-9.]+)\]/g, 'border-ink/[$1]');

    // Inline color strings
    content = content.replace(/color:\s*['"]white['"]/g, 'color: "var(--ink)"');
    
    // Replace hardcoded divider backgrounds
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.0[7-9]\)/g, 'var(--divider)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1[0-5]?\)/g, 'var(--divider)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.2[0-5]?\)/g, 'var(--divider)'); // a bit hacky but catches borders

    // Replace hardcoded #10171a with var
    content = content.replace(/bg-\[\#10171A\]/gi, 'bg-[var(--bg-deep)]');
    content = content.replace(/bg-\[\#121826\]/gi, 'bg-[var(--bg-deep)]');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFilesCount++;
      console.log('Modified:', filePath);
    }
  }
});

console.log(`Finished refactoring. Modified ${modifiedFilesCount} files.`);
