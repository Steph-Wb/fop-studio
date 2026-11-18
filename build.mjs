import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { build as bundle } from 'esbuild';

async function source(path) {
  const code = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import\s+(?:type\s+)?\{[\s\S]*?\}\s*from\s*'[^']+';?\s*/gm, '')
    .replace(/^export /gm, '');
  if (/^\s*import\s/m.test(code))
    throw new Error('Unerwarteter Import in ' + path + ' übrig – das Bundle wäre defekt.');
  return code;
}

const [core, mermaidGenerator, app, config, templateSource, mermaidLicense] = await Promise.all([
  source('./src/core.ts'),
  source('./src/mermaid.ts'),
  source('./src/app.ts'),
  readFile(new URL('./publication.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('./src/index.html', import.meta.url), 'utf8'),
  readFile(new URL('./node_modules/mermaid/LICENSE', import.meta.url), 'utf8'),
]);
const mermaidBundle = await bundle({
  stdin: {
    contents: "import mermaid from 'mermaid'; globalThis.fopMermaid = mermaid;",
    resolveDir: new URL('.', import.meta.url).pathname,
    sourcefile: 'mermaid-global.js',
    loader: 'js',
  },
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  legalComments: 'inline',
  write: false,
});
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
const scriptText = (value) => value.replace(/<\/script/gi, '<\\/script');
const template = templateSource
  .replace('<!-- SUPPORT_LINK -->', supportLink())
  .replace('<!-- MERMAID_LICENSE -->', () => '<!--\nMermaid license:\n' + mermaidLicense.replace(/--/g, '—') + '\n-->')
  .replace('/* MERMAID_BUNDLE */', () => scriptText(mermaidBundle.outputFiles[0].text));
const html = template.replace('/* BUNDLE */', () => scriptText(core + '\n' + mermaidGenerator + '\n' + app));
await mkdir(new URL('./dist', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/FOP-Studio.html', import.meta.url), html);
console.log('dist/FOP-Studio.html built; Mermaid and application embedded for offline use.');
