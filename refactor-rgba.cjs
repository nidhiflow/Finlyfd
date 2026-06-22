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

    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0\.[0-9]+)\s*\)/g, (match, p1) => {
      let percent = Math.round(parseFloat(p1) * 100);
      return `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFilesCount++;
      console.log('Modified:', filePath);
    }
  }
});

console.log(`Finished refactoring. Modified ${modifiedFilesCount} files.`);
