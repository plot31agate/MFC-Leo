// Assembles the static web app into ./www so Capacitor can bundle it into the
// native iOS / Android shells. Mirrors the asset list the PWA service worker
// caches. Run via `npm run copy:web` (or automatically through `npm run sync`).
import { rmSync, mkdirSync, cpSync } from 'node:fs';

const OUT = 'www';

// Only the files the running app actually needs — no node_modules, native
// projects, git data, README or source PDFs.
const ASSETS = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  '.nojekyll',
  'css',
  'js',
  'data',
  'icons',
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const entry of ASSETS) {
  cpSync(entry, `${OUT}/${entry}`, { recursive: true });
}

console.log(`Copied ${ASSETS.length} entries into ./${OUT}/`);
