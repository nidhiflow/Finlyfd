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

    // Replace various dark linear-gradients with var(--bg-deep)
    content = content.replace(/linear-gradient\(\s*180deg\s*,\s*#0B0F1A\s*0%\s*,\s*#121826\s*100%\s*\)/g, 'var(--bg-deep)');
    content = content.replace(/linear-gradient\(\s*180deg\s*,\s*#192225\s*0%\s*,\s*#10171A\s*100%\s*\)/g, 'var(--bg-deep)');
    content = content.replace(/linear-gradient\(\s*180deg\s*,\s*#1A2238\s*0%\s*,\s*#101828\s*100%\s*\)/g, 'var(--bg-deep)');
    content = content.replace(/linear-gradient\(\s*180deg\s*,\s*#1A2238\s*0%\s*,\s*#131825\s*100%\s*\)/g, 'var(--bg-deep)');
    content = content.replace(/linear-gradient\(\s*135deg\s*,\s*#212C30\s*0%\s*,\s*#10171A\s*100%\s*\)/g, 'var(--surface)');
    content = content.replace(/linear-gradient\(\s*135deg\s*,\s*#212C30\s*,\s*#10171A\s*\)/g, 'var(--surface)');
    content = content.replace(/linear-gradient\(\s*180deg\s*,\s*#212C30\s*0%\s*,\s*#10171A\s*100%\s*\)/g, 'var(--surface)');
    content = content.replace(/linear-gradient\(\s*135deg\s*,\s*#0F1623\s*0%\s*,\s*#111827\s*100%\s*\)/g, 'var(--bg-deep)');
    content = content.replace(/linear-gradient\(\s*0deg\s*,\s*#0B0F1A\s*60%\s*,\s*transparent\s*100%\s*\)/g, 'linear-gradient(0deg, var(--bg-deep) 60%, transparent 100%)');
    
    // Also fix any other standalone hex colors that are strictly for dark backgrounds
    content = content.replace(/bg-\[#1B2130\]/g, 'bg-[var(--surface)]');
    content = content.replace(/bg-\[#0D0F14\]/g, 'bg-[var(--bg-deep)]');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFilesCount++;
      console.log('Modified:', filePath);
    }
  }
});

console.log(`Finished refactoring gradients. Modified ${modifiedFilesCount} files.`);
