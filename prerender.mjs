// Runs after `vite build`. Writes dist/<route>/index.html for each public page with the
// page's text already in the HTML (the React app still loads and takes over), and a
// dist/404.html SPA fallback. Replaces copy-routes.cjs, which copied an empty shell.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html has no empty <div id="root"></div> to fill');
}

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Screens read localStorage (e.g. authAPI.isAuthenticated); there is no signed-in user at build time.
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const server = await createServer({
  root,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [],
  configFile: path.join(root, "vite.config.ts"),
});

try {
  const { pages, render } = await server.ssrLoadModule("/src/prerender-entry.tsx");
  for (const { path: route } of pages) {
    const { html, title, description } = render(route);
    const out = template
      .replace(/<title>.*?<\/title>/, `<title>${escapeAttr(title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    fs.mkdirSync(path.join(dist, route), { recursive: true });
    fs.writeFileSync(path.join(dist, route, "index.html"), out);
    console.log(`Prerendered dist/${route}/index.html (${html.length} chars of content)`);
  }
} finally {
  await server.close();
}

fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
console.log("Created dist/404.html fallback");
