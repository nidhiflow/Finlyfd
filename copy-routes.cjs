const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('dist/index.html not found!');
  process.exit(1);
}

const routes = ['privacy', 'terms', 'account-deletion'];

routes.forEach((route) => {
  const routeDir = path.join(distDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'));
  console.log(`Created static route: dist/${route}/index.html`);
});

// Also copy to 404.html as a general fallback for static hosting
fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
console.log('Created dist/404.html fallback');
