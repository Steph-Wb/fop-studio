import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const core = stripTypeScriptTypes(await readFile(new URL('./src/core.ts', import.meta.url), 'utf8')).replace(
  /^export /gm,
  '',
);
const app = stripTypeScriptTypes(await readFile(new URL('./src/app.ts', import.meta.url), 'utf8')).replace(
  /^import\s*\{[\s\S]*?\}\s*from\s*'[^']+';?\s*/,
  '',
);
if (/^\s*import\s/m.test(app)) throw new Error('Unerwarteter Import in app.ts übrig – das Bundle wäre defekt.');
const config = JSON.parse(await readFile(new URL('./publication.json', import.meta.url), 'utf8'));
const escape = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function supportLink() {
  if (!config.supportUrl) return '';
  const u = new URL(config.supportUrl);
  if (u.protocol !== 'https:' || !['buymeacoffee.com', 'www.buymeacoffee.com'].includes(u.hostname))
    throw Error('Ungültiger Buy-Me-a-Coffee-Link');
  return (
    '<a class="support-link" href="' +
    escape(u.href) +
    '" target="_blank" rel="noopener noreferrer" title="Öffnet Buy Me a Coffee im Internet">☕ Buy me a coffee</a>'
  );
}
const template = (await readFile(new URL('./src/index.html', import.meta.url), 'utf8')).replace(
  '<!-- SUPPORT_LINK -->',
  supportLink(),
);
await mkdir(new URL('./dist', import.meta.url), { recursive: true });
await writeFile(
  new URL('./dist/FOP-Studio.html', import.meta.url),
  template.replace('/* BUNDLE */', () => (core + '\n' + app).replace(/<\/script/gi, '<\\/script')),
);
console.log('dist/FOP-Studio.html built; no external dependencies.');
