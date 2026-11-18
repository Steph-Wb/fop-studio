import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import './build.mjs';
const config = JSON.parse(await readFile(new URL('./publication.json', import.meta.url), 'utf8'));
const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const link = (url, label, cls = '') =>
  url
    ? '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>'
    : '';
if (config.repositoryUrl) {
  const u = new URL(config.repositoryUrl);
  if (u.protocol !== 'https:' || u.hostname !== 'github.com') throw Error('Invalid repository URL');
}
await mkdir(new URL('./site', import.meta.url), { recursive: true });
for (const [template, output, sourceLabel] of [
  ['index.html', 'index.html', 'Quellcode auf GitHub'],
  ['index.en.html', 'en.html', 'Source code on GitHub'],
]) {
  let html = await readFile(new URL('./website/' + template, import.meta.url), 'utf8');
  html = html
    .replace('<!-- SUPPORT_LINK -->', link(config.supportUrl, '☕ Buy me a coffee', 'button support'))
    .replace('<!-- REPOSITORY_LINK -->', link(config.repositoryUrl, 'GitHub ↗'))
    .replace('<!-- SOURCE_BUTTON -->', link(config.repositoryUrl, sourceLabel, 'button'))
    .replace('<!-- COPYRIGHT -->', esc(config.copyrightHolder));
  await writeFile(new URL('./site/' + output, import.meta.url), html);
}
await copyFile(new URL('./dist/FOP-Studio.html', import.meta.url), new URL('./site/FOP-Studio.html', import.meta.url));
await writeFile(new URL('./site/.nojekyll', import.meta.url), '');
console.log('GitHub Pages site built in site/.');
