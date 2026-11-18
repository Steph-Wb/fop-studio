export type Encoding = 'cp850' | 'cp437' | 'windows-1252' | 'utf-8' | 'unconfirmed';
export type Kind =
  | 'Level'
  | 'Block'
  | 'Frame'
  | 'Text'
  | 'If'
  | 'While'
  | 'Repeat'
  | 'OnSelector'
  | 'OnSelectorBranch'
  | 'Procedure'
  | 'Call'
  | 'And'
  | 'Or'
  | 'Not'
  | 'Dummy';
export interface Node {
  id: string;
  kind: Kind;
  text: string;
  slots: Record<string, string[]>;
  sourceLine?: number;
  sourceTag?: string;
  defaultBranch?: boolean;
}
export interface Diagnostic {
  line?: number;
  message: string;
}
export interface Document {
  format: 'fop-studio';
  version: 1;
  name: string;
  roots: string[];
  nodes: Record<string, Node>;
  nextId: number;
  diagnostics: Diagnostic[];
  metadata: Record<string, string>;
  profile: { encoding: Encoding; newline: 'LF' | 'CRLF'; codeLanguage?: 'de' | 'en' };
  view: {
    collapsed: string[];
    focus: string | null;
    readingMode?: boolean;
    language?: 'de' | 'en';
    caseLayout?: 'vertical' | 'horizontal';
  };
}
export interface Location {
  parent: string | null;
  slot: string;
  index: number;
}
export interface Patch {
  id: string;
  before: Node | null;
  after: Node | null;
}
export interface Command {
  patches: Patch[];
  beforeRoots: string[];
  afterRoots: string[];
}
export const kinds: Kind[] = [
  'Level',
  'Block',
  'Frame',
  'Text',
  'If',
  'While',
  'Repeat',
  'OnSelector',
  'OnSelectorBranch',
  'Procedure',
  'Call',
  'And',
  'Or',
  'Not',
  'Dummy',
];
export const slotNames: Record<Kind, string[]> = {
  Level: ['header', 'body'],
  Block: ['header', 'body'],
  Frame: ['header', 'body', 'footer'],
  Text: [],
  If: ['condition', 'then', 'else'],
  While: ['condition', 'body'],
  Repeat: ['body', 'condition'],
  OnSelector: ['condition', 'branches'],
  OnSelectorBranch: ['header', 'body'],
  Procedure: ['header', 'body'],
  Call: ['header'],
  And: ['operands'],
  Or: ['operands'],
  Not: ['operands'],
  Dummy: [],
};
export function emptyDocument(name = 'Neues Programm'): Document {
  return {
    format: 'fop-studio',
    version: 1,
    name,
    roots: [],
    nodes: Object.create(null),
    nextId: 1,
    diagnostics: [],
    metadata: { procedureKey: procedureKey(name) },
    profile: { encoding: 'utf-8', newline: 'LF', codeLanguage: 'de' },
    view: { caseLayout: 'vertical', collapsed: [], focus: null },
  };
}
export function addNode(doc: Document, kind: Kind): Node {
  const id = 'n' + doc.nextId++;
  const n: Node = { id, kind, text: '', slots: {} };
  for (const s of slotNames[kind]) n.slots[s] = [];
  doc.nodes[id] = n;
  return n;
}
const cp850 =
  '\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00f8\u00a3\u00d8\u00d7\u0192\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u00ae\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb\u2591\u2592\u2593\u2502\u2524\u00c1\u00c2\u00c0\u00a9\u2563\u2551\u2557\u255d\u00a2\u00a5\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u00e3\u00c3\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u00a4\u00f0\u00d0\u00ca\u00cb\u00c8\u0131\u00cd\u00ce\u00cf\u2518\u250c\u2588\u2584\u00a6\u00cc\u2580\u00d3\u00df\u00d4\u00d2\u00f5\u00d5\u00b5\u00fe\u00de\u00da\u00db\u00d9\u00fd\u00dd\u00af\u00b4\u2261\u00b1\u2017\u00be\u00b6\u00a7\u00f7\u00b8\u00b0\u00a8\u00b7\u00b9\u00b3\u00b2\u25a0\u00a0';
const cp437 =
  '\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00a2\u00a3\u00a5\u20a7\u0192\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u2310\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580\u03b1\u00df\u0393\u03c0\u03a3\u03c3\u00b5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u03c6\u03b5\u2229\u2261\u00b1\u2265\u2264\u2320\u2321\u00f7\u2248\u00b0\u2219\u00b7\u221a\u207f\u00b2\u25a0\u00a0';
export function decode(bytes: Uint8Array, encoding: Encoding): string {
  if (encoding === 'unconfirmed') throw Error('Zeichensatz zuerst auswählen.');
  if (encoding === 'cp850' || encoding === 'cp437') {
    const table = encoding === 'cp850' ? cp850 : cp437;
    return Array.from(bytes, (b) => (b < 128 ? String.fromCharCode(b) : table[b - 128])).join('');
  }
  return new TextDecoder(encoding, { fatal: true }).decode(bytes);
}
export function encode(text: string, encoding: Encoding): Uint8Array {
  if (encoding === 'unconfirmed') throw Error('Ausgabe-Zeichensatz im Exportprofil bestätigen.');
  if (encoding === 'utf-8') return new TextEncoder().encode(text);
  let table: string;
  if (encoding === 'cp850') table = cp850;
  else if (encoding === 'cp437') table = cp437;
  else table = new TextDecoder('windows-1252').decode(Uint8Array.from({ length: 128 }, (_, i) => i + 128));
  const map = new Map<string, number>();
  for (let i = 0; i < 128; i++) map.set(String.fromCharCode(i), i);
  Array.from(table).forEach((c, i) => map.set(c, 128 + i));
  const out: number[] = [];
  for (const c of text) {
    const b = map.get(c);
    if (b === undefined) throw Error('Zeichen nicht im Ausgabe-Zeichensatz darstellbar: ' + c);
    out.push(b);
  }
  return new Uint8Array(out);
}
export function importETF(bytes: Uint8Array, encoding: Encoding, name = 'Import'): Document {
  return parseETF(decode(bytes, encoding), name);
}
export function parseETF(text: string, name = 'Import'): Document {
  const doc = emptyDocument(name);
  const lines = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  const stack: { node: Node; slot: string; seen: Set<string> }[] = [];
  let section = '';
  let sawHeader = false;
  const error = (i: number, message: string) => doc.diagnostics.push({ line: i + 1, message });
  const append = (n: Node) => {
    const p = stack.at(-1);
    if (p) p.node.slots[p.slot].push(n.id);
    else doc.roots.push(n.id);
  };
  const markerMap: Record<string, [Kind, string]> = {
    LevelBody: ['Level', 'body'],
    BlockBody: ['Block', 'body'],
    FrameBody: ['Frame', 'body'],
    EndFrameBody: ['Frame', 'footer'],
    ProcedureBody: ['Procedure', 'body'],
    WhileBody: ['While', 'body'],
    Then: ['If', 'then'],
    Else: ['If', 'else'],
    Until: ['Repeat', 'condition'],
    OnSelectorList: ['OnSelector', 'branches'],
    OnSelectorBranchBody: ['OnSelectorBranch', 'body'],
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const top = stack.at(-1);
    if (top?.node.kind === 'Text') {
      if (line === 'EndText;') {
        stack.pop();
      } else if (line.startsWith('Line=')) {
        top.node.text += (top.seen.has('line') ? '\n' : '') + line.slice(5);
        top.seen.add('line');
      } else error(i, 'Erwartet Line= oder EndText;: ' + line);
      continue;
    }
    if (section) {
      if (line === 'End' + section + ';') {
        section = '';
      } else {
        doc.metadata[section + ':' + i] = line;
      }
      continue;
    }
    if (line.startsWith('EasyCASE=')) {
      if (i !== 0 || sawHeader) error(i, 'Unerwarteter Dateikopf.');
      sawHeader = true;
      doc.metadata.EasyCASE = line.slice(9);
      continue;
    }
    if (line === 'Options;' || line === 'ShortInfo;') {
      if (stack.length) error(i, 'Metadaten innerhalb einer Struktur.');
      section = line.slice(0, -1);
      continue;
    }
    const m = line.match(/^([A-Za-z]+)([:=].*)$/);
    if (m && kinds.includes(m[1] as Kind) && m[1] !== 'Dummy') {
      const kind = m[1] as Kind;
      if (!/^:\d+$/.test(m[2]) && !(kind === 'Level' && /^=\d+:\d+$/.test(m[2])))
        error(i, 'Ungültige Elementkennung: ' + line);
      const n = addNode(doc, kind);
      n.sourceLine = i + 1;
      n.sourceTag = line;
      if (kind === 'OnSelectorBranch' && top?.node.kind === 'OnSelector') n.defaultBranch = top.seen.has('rest');
      append(n);
      stack.push({ node: n, slot: slotNames[kind][0] || '', seen: new Set() });
      continue;
    }
    if (line === 'Dummy;') {
      const n = addNode(doc, 'Dummy');
      n.sourceLine = i + 1;
      append(n);
      continue;
    }
    const marker = line.endsWith(';') ? line.slice(0, -1) : '';
    if (markerMap[marker]) {
      const [kind, slot] = markerMap[marker];
      if (top?.node.kind !== kind) {
        error(i, 'Unerwarteter Marker ' + line);
        continue;
      }
      if (top.seen.has(marker)) error(i, 'Doppelter Marker ' + line);
      const order = slotNames[kind];
      if (order.indexOf(slot) <= order.indexOf(top.slot)) error(i, 'Falsche Markerreihenfolge: ' + line);
      top.seen.add(marker);
      top.slot = slot;
      continue;
    }
    if (line === 'OnSelectorRest;') {
      if (top?.node.kind !== 'OnSelector' || top.slot !== 'branches')
        error(i, 'Standardzweig ausserhalb einer Fallauswahl.');
      else {
        if (top.seen.has('rest')) error(i, 'Doppelter Standardzweig.');
        top.seen.add('rest');
      }
      continue;
    }
    const end = line.match(/^End([A-Za-z]+);$/);
    if (end && kinds.includes(end[1] as Kind)) {
      if (top?.node.kind !== end[1]) {
        error(i, 'Nicht passendes Ende: ' + line);
        continue;
      }
      const required: Partial<Record<Kind, string[]>> = {
        Level: ['LevelBody'],
        Block: ['BlockBody'],
        Frame: ['FrameBody', 'EndFrameBody'],
        Procedure: ['ProcedureBody'],
        While: ['WhileBody'],
        If: ['Then', 'Else'],
        Repeat: ['Until'],
        OnSelector: ['OnSelectorList'],
        OnSelectorBranch: ['OnSelectorBranchBody'],
      };
      for (const mark of required[top.node.kind] || [])
        if (!top.seen.has(mark)) error(i, 'Fehlender Marker ' + mark + ' in ' + top.node.kind);
      stack.pop();
      continue;
    }
    if (line === '') continue;
    error(i, 'Unbekannter ETF-Eintrag: ' + line.slice(0, 120));
  }
  if (!sawHeader) doc.diagnostics.push({ line: 1, message: 'EasyCASE-Dateikopf fehlt.' });
  if (section) doc.diagnostics.push({ message: 'Nicht geschlossener Metadatenbereich ' + section });
  for (const f of stack)
    doc.diagnostics.push({ line: f.node.sourceLine, message: 'Nicht geschlossen: ' + f.node.kind });
  return doc;
}

// SPX 6.5 / TREE 17: bounded binary reader; no recursion by program depth.
export function importSPX(bytes: Uint8Array, encoding: Encoding, name = 'Import'): Document {
  const doc = emptyDocument(name),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 0,
    limit = bytes.length;
  const fail = (message: string): never => {
    throw Error('SPX Byte ' + p + ': ' + message);
  };
  const need = (n: number) => {
    if (n < 0 || p + n > limit) fail('Datei abgeschnitten oder ungültige Länge.');
  };
  const u32 = () => {
    need(4);
    const n = view.getUint32(p, true);
    p += 4;
    return n;
  };
  const ascii = (n: number) => {
    need(n);
    let s = '';
    for (let i = 0; i < n; i++) s += String.fromCharCode(bytes[p++]);
    return s;
  };
  if (ascii(8) !== 'SPX\0' + '6.5\0') fail('Nicht unterstützte SPX-Version (erwartet 6.5).');
  let treeStart = -1,
    treeEnd = -1;
  while (p < limit) {
    const tag = ascii(4);
    need(6);
    const version = view.getUint16(p, true);
    p += 2;
    const size = u32();
    need(size);
    if (tag === 'TREE') {
      if (treeStart >= 0) fail('Mehrfacher TREE-Bereich.');
      if (version !== 17) fail('Nicht unterstützte TREE-Version ' + version);
      treeStart = p;
      treeEnd = p + size;
    } else if (!['KINF', 'DATE', 'PVER', 'ENDI', 'FOPT', 'OLEL'].includes(tag)) fail('Unbekannter Dateibereich ' + tag);
    p += size;
  }
  if (treeStart < 0) fail('TREE-Bereich fehlt.');
  p = treeStart;
  limit = treeEnd;
  const types: Record<number, Kind> = {
    1: 'Dummy',
    3: 'If',
    4: 'While',
    9: 'And',
    10: 'Or',
    11: 'Not',
    13: 'Block',
    14: 'Level',
    15: 'Text',
    16: 'OnSelector',
    17: 'OnSelectorBranch',
    19: 'Repeat',
    20: 'Call',
    48: 'Procedure',
    51: 'Frame',
  };
  type Seq = { ids: string[]; prefix?: boolean; end?: number; rest?: boolean };
  const work: Seq[] = [{ ids: doc.roots }];
  while (work.length) {
    const seq = work[work.length - 1];
    if (seq.prefix) {
      const start = p,
        size = u32();
      if (size < 13 || start + size > limit) fail('Ungültige Länge eines Level-Bereichs.');
      need(8);
      p += 8;
      seq.end = start + size;
      seq.prefix = false;
    }
    need(1);
    if (bytes[p] === 0xf0) {
      p++;
      if (seq.end !== undefined && p !== seq.end) fail('Level-Länge stimmt nicht mit dem Inhalt überein.');
      work.pop();
      continue;
    }
    const offset = p;
    if (bytes[p++] !== 0xff) fail('Elementanfang erwartet.');
    const type = u32(),
      external = u32();
    need(8);
    p += 8;
    const kind = types[type];
    if (!kind) fail('Unbekannter Elementtyp ' + type);
    const n = addNode(doc, kind);
    n.sourceTag = 'SPX ' + kind + ':' + external + ' @' + offset;
    if (seq.rest) n.defaultBranch = true;
    seq.ids.push(n.id);
    if (kind === 'Text') {
      const size = u32();
      if (size < 1) fail('Ungültige Textlänge.');
      need(size - 1);
      n.text = decode(bytes.subarray(p, p + size - 1), encoding).replace(/\r\n|\r/g, '\n');
      p += size - 1;
      continue;
    }
    if (kind === 'Dummy') {
      need(8);
      p += 8;
      continue;
    }
    if (kind === 'Level') {
      need(5);
      p += 5;
    }
    if (kind === 'OnSelector') {
      work.push({ ids: n.slots.branches, rest: true }, { ids: n.slots.branches }, { ids: n.slots.condition });
    } else
      for (const slot of slotNames[kind].slice().reverse())
        work.push({ ids: n.slots[slot], prefix: kind === 'Level' && slot === 'body' });
  }
  if (p !== limit) fail('Nicht verarbeitete Daten im TREE-Bereich.');
  doc.metadata.importFormat = 'SPX';
  doc.metadata.inputEncoding = encoding;
  doc.diagnostics.push(...validate(doc));
  return doc;
}

export function childIds(n: Node): string[] {
  return slotNames[n.kind].flatMap((s) => n.slots[s] || []);
}
export function locations(doc: Document): Map<string, Location> {
  const result = new Map<string, Location>();
  doc.roots.forEach((id, index) => result.set(id, { parent: null, slot: 'roots', index }));
  for (const n of Object.values(doc.nodes))
    for (const s of slotNames[n.kind])
      n.slots[s].forEach((id, index) => result.set(id, { parent: n.id, slot: s, index }));
  return result;
}
export function descendants(doc: Document, id: string): string[] {
  const result: string[] = [];
  const work = [id];
  const seen = new Set<string>();
  while (work.length) {
    const x = work.pop()!;
    if (seen.has(x)) throw Error('Zyklus in der Struktur.');
    seen.add(x);
    const n = doc.nodes[x];
    if (!n) throw Error('Unbekanntes Element ' + x);
    result.push(x);
    work.push(...childIds(n));
  }
  return result;
}
export function validate(doc: Document): Diagnostic[] {
  const problems: Diagnostic[] = [];
  const seen = new Set<string>();
  const work = doc.roots.map((id) => ({ id, parent: null as Node | null, slot: 'roots' }));
  while (work.length) {
    const { id, parent, slot } = work.pop()!;
    if (seen.has(id)) {
      problems.push({ message: 'Zyklus oder mehrfach verwendetes Element: ' + id });
      continue;
    }
    seen.add(id);
    const n = doc.nodes[id];
    if (!n) {
      problems.push({ message: 'Fehlendes Element: ' + id });
      continue;
    }
    const fail = (message: string) =>
      problems.push({ line: n.sourceLine, message: n.kind + ' ' + id + ': ' + message });
    if (parent?.kind === 'OnSelector' && slot === 'branches' && n.kind !== 'OnSelectorBranch')
      fail('Fallauswahl darf nur Fallzweige enthalten.');
    if (n.kind === 'OnSelectorBranch' && parent?.kind !== 'OnSelector') fail('Fallzweig ausserhalb einer Fallauswahl.');
    if (['condition', 'header', 'operands'].includes(slot) && !['Text', 'And', 'Or', 'Not', 'Dummy'].includes(n.kind))
      fail('Ungültiger Inhalt für ' + slot);
    if (n.kind === 'Text' && n.text.includes('\u0000')) fail('Nullzeichen im Text.');
    for (const s of ['condition', 'header'])
      if (n.slots[s] && n.slots[s].length !== 1) fail(s + ' muss genau einen Text oder Ausdruck enthalten.');
    if (n.kind === 'Not' && n.slots.operands.length !== 1) fail('NOT benötigt genau einen Operanden.');
    if (['And', 'Or'].includes(n.kind) && n.slots.operands.length < 2)
      fail('AND/OR benötigt mindestens zwei Operanden.');
    if (n.kind === 'OnSelector') {
      const branches = n.slots.branches.map((x) => doc.nodes[x]).filter(Boolean);
      if (branches.filter((x) => x.defaultBranch).length > 1) fail('Mehr als ein Standardzweig.');
      const at = branches.findIndex((x) => x.defaultBranch);
      if (at >= 0 && at !== branches.length - 1) fail('Standardzweig muss zuletzt stehen.');
    }
    for (const s of slotNames[n.kind]) for (const child of n.slots[s]) work.push({ id: child, parent: n, slot: s });
  }
  if (seen.size !== Object.keys(doc.nodes).length)
    problems.push({ message: 'Projekt enthält nicht erreichbare Elemente.' });
  return problems;
}
export function loadProject(text: string): Document {
  const x = JSON.parse(text);
  if (!x || x.format !== 'fop-studio' || x.version !== 1) throw Error('Unbekanntes Projektformat oder Version.');
  if (
    typeof x.name !== 'string' ||
    !Array.isArray(x.roots) ||
    !x.nodes ||
    typeof x.nodes !== 'object' ||
    Array.isArray(x.nodes)
  )
    throw Error('Ungültiger Projektaufbau.');
  const doc = emptyDocument(x.name);
  doc.roots = x.roots;
  let max = 0;
  for (const [id, v] of Object.entries(x.nodes)) {
    const n = v as Node;
    if (!/^n[1-9]\d*$/.test(id) || n.id !== id || !kinds.includes(n.kind) || typeof n.text !== 'string' || !n.slots)
      throw Error('Ungültiges Projektelement ' + id);
    max = Math.max(max, Number(id.slice(1)));
    const clean: Node = { id, kind: n.kind, text: n.text, slots: {} };
    for (const s of slotNames[n.kind]) {
      if (!Array.isArray(n.slots[s]) || !n.slots[s].every((a: unknown) => typeof a === 'string'))
        throw Error('Ungültiger Elementbereich ' + id);
      clean.slots[s] = n.slots[s];
    }
    if (Object.keys(n.slots).some((s) => !slotNames[n.kind].includes(s)))
      throw Error('Unbekannter Elementbereich ' + id);
    if (typeof n.sourceLine === 'number') clean.sourceLine = n.sourceLine;
    if (typeof n.sourceTag === 'string') clean.sourceTag = n.sourceTag;
    if (n.defaultBranch === true) clean.defaultBranch = true;
    doc.nodes[id] = clean;
  }
  if (!doc.roots.every((id) => typeof id === 'string')) throw Error('Ungültige Wurzelelemente.');
  doc.nextId = max + 1;
  if (
    !x.profile ||
    !['unconfirmed', 'cp850', 'cp437', 'windows-1252', 'utf-8'].includes(x.profile.encoding) ||
    !['LF', 'CRLF'].includes(x.profile.newline)
  )
    throw Error('Ungültiges Exportprofil.');
  if (x.profile.codeLanguage !== undefined && !['de', 'en'].includes(x.profile.codeLanguage))
    throw Error('Ungültige FOP-Code-Sprache.');
  doc.profile = { ...x.profile, codeLanguage: x.profile.codeLanguage || 'de' };
  if (!Array.isArray(x.diagnostics) || !x.diagnostics.every((d: Diagnostic) => d && typeof d.message === 'string'))
    throw Error('Ungültige Importdiagnosen.');
  doc.diagnostics = x.diagnostics;
  if (x.metadata && typeof x.metadata === 'object')
    for (const [k, v] of Object.entries(x.metadata))
      if (typeof v === 'string' && !['__proto__', 'constructor', 'prototype'].includes(k)) doc.metadata[k] = v;
  doc.view = {
    ...(typeof x.view?.readingMode === 'boolean' ? { readingMode: x.view.readingMode } : {}),
    ...(x.view?.language === 'en' || x.view?.language === 'de' ? { language: x.view.language } : {}),
    caseLayout: x.view?.caseLayout === 'horizontal' ? 'horizontal' : 'vertical',
    collapsed: Array.isArray(x.view?.collapsed)
      ? x.view.collapsed.filter((id: unknown) => typeof id === 'string' && doc.nodes[id])
      : [],
    focus: typeof x.view?.focus === 'string' && doc.nodes[x.view.focus] ? x.view.focus : null,
  };
  const errors = validate(doc);
  if (errors.length)
    throw Error(
      errors
        .slice(0, 5)
        .map((e) => e.message)
        .join('\n'),
    );
  return doc;
}
export function projectJSON(doc: Document): string {
  return JSON.stringify(doc, null, 2);
}
export function expression(doc: Document, ids: string[]): string {
  const out: string[] = [];
  const work: ({ id: string } | { literal: string })[] = ids
    .slice()
    .reverse()
    .map((id) => ({ id }));
  const de = doc.view.language !== 'en';
  while (work.length) {
    const task = work.pop()!;
    if ('literal' in task) {
      out.push(task.literal);
      continue;
    }
    const n = doc.nodes[task.id];
    if (!n) throw Error('Fehlender Ausdruck');
    if (n.kind === 'Text') {
      out.push(n.text);
      continue;
    }
    if (n.kind === 'Dummy') continue;
    if (n.kind === 'Not') {
      work.push({ literal: ')' }, { id: n.slots.operands[0] }, { literal: de ? 'NICHT (' : 'NOT (' });
      continue;
    }
    if (!['And', 'Or'].includes(n.kind)) throw Error('Ungültiger Ausdruck ' + n.kind);
    const children = n.slots.operands;
    for (let i = children.length - 1; i >= 0; i--) {
      work.push({ literal: ')' }, { id: children[i] }, { literal: '(' });
      if (i > 0) work.push({ literal: n.kind === 'And' ? (de ? ' UND ' : ' AND ') : de ? ' ODER ' : ' OR ' });
    }
  }
  return out.join('');
}
export function label(doc: Document, n: Node): string {
  if (n.kind === 'Text') return n.text;
  if (n.kind === 'Dummy') return '(leer)';
  if (n.slots.condition) return conditionDisplay(doc, n.slots.condition);
  const s = n.slots.header || n.slots.operands;
  return s ? expression(doc, s) : n.kind;
}
export class History {
  undoStack: Command[] = [];
  redoStack: Command[] = [];
  revision = 0;
  doc: Document;
  constructor(doc: Document) {
    this.doc = doc;
  }
  apply(cmd: Command, forward = true): void {
    for (const p of cmd.patches) {
      const n = forward ? p.after : p.before;
      if (n) this.doc.nodes[p.id] = structuredClone(n);
      else delete this.doc.nodes[p.id];
    }
    this.doc.roots = (forward ? cmd.afterRoots : cmd.beforeRoots).slice();
    this.revision++;
  }
  commit(patches: Patch[], roots = this.doc.roots): void {
    const cmd = { patches, beforeRoots: this.doc.roots.slice(), afterRoots: roots.slice() };
    this.apply(cmd);
    this.undoStack.push(cmd);
    this.redoStack = [];
  }
  batch(action: () => void): void {
    const start = this.undoStack.length,
      redo = this.redoStack.slice(),
      revision = this.revision;
    try {
      action();
      const cmds = this.undoStack.splice(start);
      if (!cmds.length) return;
      const merged = new Map<string, Patch>();
      for (const cmd of cmds)
        for (const p of cmd.patches) {
          const old = merged.get(p.id);
          merged.set(p.id, { id: p.id, before: old ? old.before : p.before, after: p.after });
        }
      this.undoStack.push({
        patches: [...merged.values()],
        beforeRoots: cmds[0].beforeRoots,
        afterRoots: cmds.at(-1)!.afterRoots,
      });
    } catch (e) {
      while (this.undoStack.length > start) this.apply(this.undoStack.pop()!, false);
      this.redoStack = redo;
      this.revision = revision;
      throw e;
    }
  }
  undo(): void {
    const c = this.undoStack.pop();
    if (c) {
      this.apply(c, false);
      this.redoStack.push(c);
    }
  }
  redo(): void {
    const c = this.redoStack.pop();
    if (c) {
      this.apply(c);
      this.undoStack.push(c);
    }
  }
  text(id: string, text: string): void {
    const n = this.doc.nodes[id];
    if (!n || n.kind !== 'Text') throw Error('Nur Textelemente sind direkt editierbar.');
    if (n.text === text) return;
    this.commit([{ id, before: structuredClone(n), after: { ...structuredClone(n), text } }]);
  }
  remove(id: string): void {
    const loc = locations(this.doc).get(id);
    if (!loc) throw Error('Element nicht gefunden');
    if (['condition', 'header', 'operands'].includes(loc.slot))
      throw Error('Ausdruck über die Eigenschaften bearbeiten.');
    const ids = descendants(this.doc, id);
    const patches: Patch[] = ids.map((x) => ({ id: x, before: structuredClone(this.doc.nodes[x]), after: null }));
    const roots = this.doc.roots.slice();
    if (loc.parent) {
      const before = this.doc.nodes[loc.parent],
        after = structuredClone(before);
      after.slots[loc.slot].splice(loc.index, 1);
      patches.push({ id: loc.parent, before: structuredClone(before), after });
    } else roots.splice(loc.index, 1);
    this.commit(patches, roots);
  }
  insert(kind: Kind, where: Location): string {
    if (
      ['OnSelectorBranch'].includes(kind) &&
      (!where.parent || this.doc.nodes[where.parent].kind !== 'OnSelector' || where.slot !== 'branches')
    )
      throw Error('Fallzweige nur in einer Fallauswahl einfügen.');
    if (where.slot === 'branches' && kind !== 'OnSelectorBranch') throw Error('Hier nur Fallzweige einfügen.');
    if (['header', 'condition', 'operands'].includes(where.slot)) throw Error('Hier keine Anweisung einfügen.');
    const temp = emptyDocument();
    temp.nextId = this.doc.nextId;
    const n = addNode(temp, kind);
    if (n.slots.header || n.slots.condition) {
      const t = addNode(temp, 'Text');
      t.text = ['If', 'While', 'Repeat'].includes(kind)
        ? 'Bedingung'
        : kind === 'OnSelectorBranch'
          ? 'Wert'
          : 'Bezeichnung';
      (n.slots.header || n.slots.condition).push(t.id);
    }
    if (kind === 'Text') n.text = (this.doc.profile.codeLanguage === 'en' ? '.formula' : '.formel') + ' U|variable = 0';
    if (kind === 'OnSelector') {
      const b = addNode(temp, 'OnSelectorBranch'),
        t = addNode(temp, 'Text');
      t.text = 'Wert';
      b.slots.header.push(t.id);
      n.slots.branches.push(b.id);
    }
    this.doc.nextId = temp.nextId;
    this.attach(Object.values(temp.nodes), n.id, where);
    return n.id;
  }
  attach(nodes: Node[], id: string, where: Location): void {
    const patches: Patch[] = nodes.map((n) => ({ id: n.id, before: null, after: n }));
    const roots = this.doc.roots.slice();
    if (where.parent) {
      const before = this.doc.nodes[where.parent];
      if (!before?.slots[where.slot]) throw Error('Ungültiges Ziel');
      const after = structuredClone(before);
      after.slots[where.slot].splice(where.index, 0, id);
      patches.push({ id: before.id, before: structuredClone(before), after });
    } else roots.splice(where.index, 0, id);
    this.commit(patches, roots);
  }
  copy(id: string, where: Location): string {
    this.checkTarget(id, where, false);
    const ids = descendants(this.doc, id);
    const remap = new Map(ids.map((x) => [x, 'n' + this.doc.nextId++]));
    const nodes = ids.map((x) => {
      const n = structuredClone(this.doc.nodes[x]);
      n.id = remap.get(x)!;
      delete n.sourceLine;
      delete n.sourceTag;
      for (const s of slotNames[n.kind]) n.slots[s] = n.slots[s].map((c) => remap.get(c)!);
      return n;
    });
    this.attach(nodes, remap.get(id)!, where);
    return remap.get(id)!;
  }
  checkTarget(id: string, where: Location, moving = true): void {
    const n = this.doc.nodes[id];
    if (!n) throw Error('Element fehlt');
    if (where.parent && moving && descendants(this.doc, id).includes(where.parent))
      throw Error('Ein Element kann nicht in seinen eigenen Unterbaum verschoben werden.');
    if (['header', 'condition', 'operands'].includes(where.slot)) throw Error('Ausdrucksbereich ist kein Einfügeziel.');
    if ((where.slot === 'branches') !== (n.kind === 'OnSelectorBranch'))
      throw Error('Fallzweige müssen innerhalb einer Fallauswahl bleiben.');
    const loc = locations(this.doc).get(id);
    if (loc && ['header', 'condition', 'operands'].includes(loc.slot))
      throw Error('Ausdrücke werden über Eigenschaften bearbeitet.');
  }
  move(id: string, where: Location): void {
    this.checkTarget(id, where);
    const from = locations(this.doc).get(id)!;
    const roots = this.doc.roots.slice();
    const changed = new Map<string, Node>();
    const list = (loc: Location) => {
      if (!loc.parent) return roots;
      if (!changed.has(loc.parent)) changed.set(loc.parent, structuredClone(this.doc.nodes[loc.parent]));
      return changed.get(loc.parent)!.slots[loc.slot];
    };
    list(from).splice(from.index, 1);
    let index = where.index;
    if (from.parent === where.parent && from.slot === where.slot && from.index < index) index--;
    list(where).splice(index, 0, id);
    this.commit(
      [...changed].map(([id, after]) => ({ id, before: structuredClone(this.doc.nodes[id]), after })),
      roots,
    );
  }
}
export interface ExportResult {
  text: string;
  bytes: Uint8Array;
}
export function fopExpression(doc: Document, ids: string[]): string {
  const out: string[] = [];
  const work: ({ id: string } | { literal: string })[] = ids
    .slice()
    .reverse()
    .map((id) => ({ id }));
  while (work.length) {
    const t = work.pop()!;
    if ('literal' in t) {
      out.push(t.literal);
      continue;
    }
    const n = doc.nodes[t.id];
    if (n.kind === 'Text') {
      out.push(n.text);
      continue;
    }
    if (n.kind === 'Not') {
      work.push({ literal: ')' }, { id: n.slots.operands[0] }, { literal: '_(' });
      continue;
    }
    if (n.kind !== 'And' && n.kind !== 'Or') throw Error('Ungültiger FOP-Ausdruck: ' + n.kind);
    const operands = n.slots.operands;
    for (let i = operands.length - 1; i >= 0; i--) {
      work.push({ literal: ')' }, { id: operands[i] }, { literal: '(' });
      if (i > 0) work.push({ literal: n.kind === 'And' ? ' & ' : ' ; ' });
    }
  }
  return out.join('');
}

// Stable project namespace; framecount separates recursive .eingabe entries.
export function procedureKey(name: string): string {
  let h = 2166136261;
  for (const ch of name) {
    h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
export function procedureRuntime(doc: Document) {
  const key = doc.metadata.procedureKey || procedureKey(doc.name);
  if (!/^[0-9a-f]{8}$/.test(key)) throw Error('Ungültige Prozedurkennung im Projekt.');
  const base = 'xfs' + key;
  return {
    base,
    pointer: 'U|' + base + 'p.G|framecount',
    key: 'U|' + base + 'k',
    entry: 'U|' + base + 'r.U|' + base + 'k',
  };
}
export function procedureDiagnostics(doc: Document): Diagnostic[] {
  if (!Object.values(doc.nodes).some((n) => n.kind === 'Procedure' || n.kind === 'Call')) return [];
  const out: Diagnostic[] = [];
  try {
    procedureRuntime(doc);
  } catch (e) {
    out.push({ message: String(e) });
  }
  for (const n of Object.values(doc.nodes)) {
    if (n.kind !== 'Text') continue;
    for (const line of n.text.split('\n')) {
      if (/^\s*\.\./.test(line)) continue;
      if (/\b(?:xprocsp|xprocst|xfs[0-9a-f]{8}[pkr])\b/i.test(line))
        out.push({
          line: n.sourceLine,
          message:
            'Prozedurverwaltung: übernommener Code greift auf Verwaltungsvariablen zu (' +
            n.id +
            '). Vor dem Export ausdrücklich bereinigen: ' +
            line,
        });
    }
  }
  return out;
}

export function exportFOP(doc: Document, generatedAt = new Date()): ExportResult {
  const errors = [...doc.diagnostics, ...validate(doc), ...procedureDiagnostics(doc)];
  if (errors.length)
    throw Error(
      'Export gesperrt:\n' +
        errors
          .slice(0, 10)
          .map((e) => (e.line ? 'Zeile ' + e.line + ': ' : '') + e.message)
          .join('\n'),
    );
  const occupied = new Set<string>();
  for (const n of Object.values(doc.nodes))
    if (n.kind === 'Text')
      for (const l of n.text.split('\n')) {
        const m = l.match(/^\s*!([^\s:]+)/);
        if (m) {
          const key = m[1].toUpperCase().slice(0, 7);
          if (occupied.has(key)) throw Error('Sprungmarkenkollision in den ersten sieben Zeichen: ' + key);
          occupied.add(key);
        }
      }
  let seq = 0;
  const fresh = () => {
    let x;
    do {
      x = generatedLabel(seq++);
    } while (occupied.has(x));
    occupied.add(x);
    return x;
  };
  const procedures = new Map<string, string>();
  for (const n of Object.values(doc.nodes))
    if (n.kind === 'Procedure') {
      const name = expression(doc, n.slots.header).trim();
      if (!name || /[\r\n]/.test(name) || procedures.has(name))
        throw Error('Ungültiger oder doppelter Prozedurname: ' + name);
      procedures.set(name, fresh());
    }
  const commands: Record<string, string> =
    doc.profile.codeLanguage === 'en'
      ? { weiter: 'continue', formel: 'formula', art: 'type', ende: 'end' }
      : { weiter: 'weiter', formel: 'formel', art: 'art', ende: 'ende' };
  // Only generator-owned lines pass here; imported/user text is emitted verbatim.
  const generated = (text: string) =>
    text.replace(/^\.(weiter|formel|art|ende)\b/, (_, command) => '.' + commands[command]);
  const runtime = procedureRuntime(doc);
  const pointer = runtime.pointer,
    entry = runtime.entry;
  const keyLine = '.formel ' + runtime.key + " = 'G|framecount' + \".\" + '" + pointer + "'";
  // eslint-disable-next-line no-control-regex -- Steuerzeichen werden beim Export bewusst aus Kommentaren entfernt.
  const cleanComment = (s: string) => s.replace(/[\r\n\u0000-\u001f]/g, ' ');
  const stamp = generatedAt
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, ' UTC');
  const lines: string[] = [
    '..!interpreter ' + (doc.profile.codeLanguage === 'en' ? 'english' : 'german') + ' translate',
    '.. ============================================================',
    '.. FOP Studio - generiert',
    '.. Generiert: ' + stamp,
    '.. Datei: ' + cleanComment(doc.name),
    '.. Zeichensatz: ' + doc.profile.encoding + ' | Zeilenenden: ' + doc.profile.newline,
    '.. ============================================================',
    '..',
  ];
  if (procedures.size) {
    lines.push(
      ...[
        '.. FOP Studio: private Prozedurverwaltung je Aufrufebene',
        '.art integer ' + pointer.slice(2) + ' ? _F|defined(' + pointer + ')',
        '.formel ' + pointer + ' = 0',
        '.art text ' + runtime.key.slice(2) + ' ? _F|defined(' + runtime.key + ')',
        '.. Ende private Vorbereitung',
      ].map(generated),
    );
  }
  const counters: Record<string, number> = {};
  const tag = (kind: string) => kind + String((counters[kind] = (counters[kind] || 0) + 1)).padStart(3, '0');
  type Task = { id: string } | { line: string };
  const work: Task[] = doc.roots
    .slice()
    .reverse()
    .map((id) => ({ id }));
  const enqueue = (tasks: Task[]) => {
    for (let i = tasks.length - 1; i >= 0; i--) work.push(tasks[i]);
  };
  const nodes = (ids: string[]): Task[] => ids.map((id) => ({ id }));
  const line = (text: string): Task => ({ line: generated(text) });
  const condition = (n: Node) => {
    const text = fopExpression(doc, n.slots.condition).trim();
    if (!text || /[\r\n]/.test(text)) throw Error('Bedingung muss einzeilig und nicht leer sein: ' + n.id);
    return text;
  };
  while (work.length) {
    const t = work.pop()!;
    if ('line' in t) {
      lines.push(t.line);
      continue;
    }
    const n = doc.nodes[t.id];
    switch (n.kind) {
      case 'Text':
        for (const textLine of n.text.split('\n')) lines.push(textLine);
        break;
      case 'Dummy':
        break;
      case 'Level':
      case 'Block': {
        const title = expression(doc, n.slots.header);
        for (const s of title.split('\n')) lines.push('.. ' + s);
        enqueue(nodes(n.slots.body));
        break;
      }
      case 'Frame': {
        const mark = tag('FRAME');
        enqueue([
          line('.. ----- ' + mark + ' -----'),
          ...nodes(n.slots.header),
          ...nodes(n.slots.body),
          ...nodes(n.slots.footer),
          line('.. ----- END ' + mark + ' -----'),
        ]);
        break;
      }
      case 'If': {
        const mark = tag('IF'),
          other = fresh();
        lines.push('.. ----- ' + mark + ' -----');
        if (n.slots.else.every((id) => doc.nodes[id].kind === 'Dummy')) {
          enqueue([
            line('.weiter ' + other + ' ? _(' + condition(n) + ')'),
            ...nodes(n.slots.then),
            line('!' + other + ': ----- END ' + mark + ' -----'),
          ]);
          break;
        }
        const end = fresh();
        enqueue([
          line('.weiter ' + other + ' ? _(' + condition(n) + ')'),
          ...nodes(n.slots.then),
          line('.weiter ' + end),
          line('!' + other + ': ----- ELSE ' + mark + ' -----'),
          ...nodes(n.slots.else),
          line('!' + end + ': ----- END ' + mark + ' -----'),
        ]);
        break;
      }
      case 'While': {
        const mark = tag('WHILE'),
          start = fresh(),
          end = fresh();
        enqueue([
          line('!' + start + ': ===== ' + mark + ' ====='),
          line('.weiter ' + end + ' ? _(' + condition(n) + ')'),
          ...nodes(n.slots.body),
          line('.weiter ' + start),
          line('!' + end + ': ===== END ' + mark + ' ====='),
        ]);
        break;
      }
      case 'Procedure': {
        const name = expression(doc, n.slots.header).trim();
        enqueue([
          line('!' + procedures.get(name) + ': ----- PROCEDURE ' + cleanComment(name) + ' -----'),
          ...nodes(n.slots.body),
          line('.. ----- END PROCEDURE ' + cleanComment(name) + ' -----'),
          line(keyLine),
          line(".weiter '" + entry + "'"),
        ]);
        break;
      }
      case 'Call': {
        const name = expression(doc, n.slots.header).trim(),
          target = procedures.get(name);
        if (!target) throw Error('Unbekannte Prozedur: ' + name + ' (' + n.id + ')');
        const ret = fresh();
        enqueue([
          line('.. CALL ' + cleanComment(name)),
          line('.ende 1 ? ' + pointer + ' >= 9999'),
          line('.formel ' + pointer + ' = ' + pointer + ' + 1'),
          line(keyLine),
          line('.art text ' + entry.slice(2) + ' ? _F|defined(' + entry + ')'),
          line('.formel ' + entry + ' = "' + ret + '"'),
          line('.weiter ' + target),
          line('!' + ret + ': ----- RETURN ' + cleanComment(name) + ' -----'),
          line('.formel ' + pointer + ' = ' + pointer + ' - 1'),
        ]);
        break;
      }
      case 'Repeat': {
        const mark = tag('REPEAT'),
          start = fresh();
        enqueue([
          line('!' + start + ': ===== ' + mark + ' ====='),
          ...nodes(n.slots.body),
          line('.. UNTIL ' + mark),
          line('.weiter ' + start + ' ? _(' + condition(n) + ')'),
          line('.. ===== END ' + mark + ' ====='),
        ]);
        break;
      }
      case 'OnSelector': {
        const selector = condition(n),
          end = fresh(),
          mark = tag('CASE');
        const tasks: Task[] = [line('.. ===== ' + mark + ' : ' + cleanComment(selector) + ' =====')];
        for (const bid of n.slots.branches) {
          const b = doc.nodes[bid];
          if (b.defaultBranch) {
            tasks.push(line('.. OTHERWISE ' + mark), ...nodes(b.slots.body));
          } else {
            const value = expression(doc, b.slots.header).trim();
            if (!value || /[\r\n]/.test(value)) throw Error('Fallwert muss einzeilig sein: ' + bid);
            const next = fresh();
            tasks.push(
              line('.. OF ' + cleanComment(value) + ' : ' + mark),
              line('.weiter ' + next + ' ? _(' + selector + ' = ' + value + ')'),
              ...nodes(b.slots.body),
              line('.weiter ' + end),
              line('!' + next),
            );
          }
        }
        tasks.push(line('!' + end + ': ===== ENDCASE ' + mark + ' ====='));
        enqueue(tasks);
        break;
      }
      default:
        throw Error('Element nicht exportierbar: ' + n.kind);
    }
  }
  const text =
    lines.join(doc.profile.newline === 'LF' ? '\n' : '\r\n') + (doc.profile.newline === 'LF' ? '\n' : '\r\n');
  return { text, bytes: encode(text, doc.profile.encoding) };
}
export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  head: number;
  foot: number;
  children: Box[];
  lanes: { title: string; x: number; y: number; w: number; h: number }[];
}
export interface Layout {
  roots: Box[];
  width: number;
  height: number;
  byId: Map<string, Box>;
}

export function diagramHeader(doc: Document, n: Node, folded: boolean): string {
  if (n.kind === 'Repeat' && !folded) return '';
  return n.defaultBranch ? (doc.view.language === 'en' ? 'Else' : 'Sonst') : label(doc, n);
}
export function diagramFooter(doc: Document, n: Node): string {
  return n.kind === 'Repeat'
    ? (doc.view.language === 'en' ? 'Until: ' : 'Beenden, wenn: ') + conditionDisplay(doc, n.slots.condition)
    : '';
}

export const diagramTypography = { fontSize: 14, lineHeight: 22, headerSpace: 38, charWidth: 9 };
export function wrappedText(text: string, width: number, foldable = false): { text: string; source: string }[] {
  const count = Math.max(8, Math.floor((width - (foldable ? 64 : 36)) / diagramTypography.charWidth));
  const result: { text: string; source: string }[] = [];
  for (const source of text.split('\n')) {
    const chars = Array.from(source);
    if (!chars.length) result.push({ text: '', source });
    for (let i = 0; i < chars.length;) {
      let end = Math.min(chars.length, i + count);
      if (end < chars.length) {
        for (let j = end - 1; j > i + Math.floor(count / 2); j--)
          if (/\s/.test(chars[j])) {
            end = j + 1;
            break;
          }
      }
      result.push({ text: chars.slice(i, end).join(''), source });
      i = end;
    }
  }
  return result;
}

export function layout(doc: Document, focus: string | null, collapsed: Set<string>, availableWidth = 600): Layout {
  const gap = doc.view.readingMode ? 0 : 18;
  const roots = (focus && doc.nodes[focus] ? [focus] : doc.roots).filter((id) => doc.nodes[id]?.kind !== 'Dummy');
  const boxes = new Map<string, Box>();
  const work = roots
    .slice()
    .reverse()
    .map((id) => ({ id, exit: false }));
  const visible = (n: Node): string[] => {
    if (collapsed.has(n.id)) return [];
    const ids =
      n.kind === 'If'
        ? [...n.slots.then, ...n.slots.else]
        : n.kind === 'OnSelector'
          ? n.slots.branches
          : n.slots.body || [];
    return ids.filter((id) => doc.nodes[id]?.kind !== 'Dummy');
  };

  // Size from visible content, without stretching to fill the viewport.
  const minimum = new Map<string, number>();
  const widths = new Map<string, number>();
  const measure = roots.map((id) => ({ id, exit: false }));
  while (measure.length) {
    const t = measure.pop()!,
      n = doc.nodes[t.id];
    if (!n) continue;
    const ids = visible(n);
    if (!t.exit) {
      measure.push({ id: t.id, exit: true });
      for (const id of ids) measure.push({ id, exit: false });
      continue;
    }
    const foldable = !!(n.slots.body || n.slots.then || n.slots.branches);
    const text =
      diagramHeader(doc, n, collapsed.has(n.id)) +
      (n.kind === 'Repeat' && !collapsed.has(n.id) ? '\n' + diagramFooter(doc, n) : '');
    let longest = 0;
    for (const line of text.split('\n')) longest = Math.max(longest, Array.from(line).length);
    const own = Math.max(
      n.kind === 'Dummy' ? 120 : 180,
      Math.min(Math.max(240, availableWidth - 64), longest * diagramTypography.charWidth + (foldable ? 64 : 36)),
    );
    let width = own;
    if (n.kind === 'If' && !collapsed.has(n.id)) {
      width = 0;
      for (const slot of ['then', 'else']) {
        let lane = 180;
        for (const id of n.slots[slot]) lane = Math.max(lane, minimum.get(id) || 0);
        width += lane;
      }
      width = Math.max(own, width);
    } else if (n.kind === 'OnSelector' && !collapsed.has(n.id) && doc.view.caseLayout === 'horizontal') {
      width = 0;
      for (const id of ids) width += minimum.get(id) || 240;
      width = Math.max(own, width);
    } else
      for (const id of ids) width = Math.max(width, (minimum.get(id) || 240) + (n.kind === 'OnSelector' ? 20 : 12));
    minimum.set(t.id, width);
  }
  for (const [id, width] of minimum) widths.set(id, width);
  while (work.length) {
    const t = work.pop()!,
      n = doc.nodes[t.id];
    if (!n) continue;
    const children = visible(n);
    if (!t.exit) {
      work.push({ id: t.id, exit: true });
      for (let i = children.length - 1; i >= 0; i--) work.push({ id: children[i], exit: false });
      continue;
    }
    const assigned = widths.get(n.id) || 240;
    const head =
      n.kind === 'Dummy'
        ? 38
        : (n.kind === 'Repeat' && !collapsed.has(n.id)
            ? 0
            : wrappedText(
                diagramHeader(doc, n, collapsed.has(n.id)),
                assigned,
                !!(n.slots.body || n.slots.then || n.slots.branches),
              ).length) *
            diagramTypography.lineHeight +
          (doc.view.readingMode && n.kind === 'Text' ? 20 : diagramTypography.headerSpace);
    const foot =
      n.kind === 'Repeat' && !collapsed.has(n.id)
        ? wrappedText(diagramFooter(doc, n), assigned).length * diagramTypography.lineHeight + 18
        : 0;
    const folded = collapsed.has(n.id) && !!(n.slots.body || n.slots.then || n.slots.branches);
    const b: Box = {
      id: n.id,
      x: 0,
      y: 0,
      w: assigned,
      h: head + foot + (folded ? 24 : 0),
      head: head + (folded ? 24 : 0),
      foot,
      children: [],
      lanes: [],
    };
    if (n.kind === 'If' && !collapsed.has(n.id)) {
      let x = 0;
      for (const [s, title] of [
        ['then', 'JA'],
        ['else', 'NEIN'],
      ]) {
        let laneMin = 180,
          otherMin = 180;
        for (const id of n.slots[s]) laneMin = Math.max(laneMin, minimum.get(id) || 0);
        for (const id of n.slots[s === 'then' ? 'else' : 'then']) otherMin = Math.max(otherMin, minimum.get(id) || 0);
        let y = head + 34 + gap,
          w = laneMin + Math.max(0, assigned - laneMin - otherMin) / 2;
        for (const id of n.slots[s]) {
          const c = boxes.get(id);
          if (c) w = Math.max(w, c.w);
        }
        for (const id of n.slots[s]) {
          const c = boxes.get(id);
          if (c) {
            c.x = x;
            c.y = y;
            b.children.push(c);
            y += c.h + gap;
          }
        }
        b.lanes.push({ title, x, y: head, w, h: y - head });
        x += w;
        b.h = Math.max(b.h, y + gap);
      }
      b.w = x;
      for (const lane of b.lanes) lane.h = b.h - head;
    } else if (n.kind === 'OnSelector' && !collapsed.has(n.id)) {
      if (doc.view.caseLayout === 'horizontal') {
        let x = 0;
        for (const id of children) {
          const c = boxes.get(id);
          if (c) {
            c.x = x;
            c.y = head;
            b.children.push(c);
            x += c.w;
            b.h = Math.max(b.h, head + c.h);
          }
        }
        b.w = Math.max(300, x);
      } else {
        let y = head;
        let width = assigned;
        for (const id of children) {
          const c = boxes.get(id);
          if (c) width = Math.max(width, c.w + 20);
        }
        for (const id of children) {
          const c = boxes.get(id);
          if (c) {
            c.x = 20;
            c.y = y;
            c.w = width - 20;
            b.children.push(c);
            y += c.h;
          }
        }
        b.w = width;
        b.h = Math.max(b.h, y);
      }
    } else if (n.slots.body && !collapsed.has(n.id)) {
      let y = head + gap;
      for (const id of children) {
        const c = boxes.get(id);
        if (c) {
          c.x = 12;
          c.y = y;
          b.children.push(c);
          y += c.h;
          b.w = Math.max(b.w, c.w + 12);
        }
      }
      b.h = Math.max(b.h, y + foot + (n.slots.body ? gap : 0));
    }
    boxes.set(n.id, b);
  }
  let y = 16,
    width = Math.max(0, availableWidth);
  const result: Box[] = [];
  for (const id of roots) {
    const b = boxes.get(id);
    if (b) {
      b.x = 16;
      b.y = y;
      y += b.h + (doc.view.readingMode ? 0 : 8);
      width = Math.max(width, b.w + 32);
      result.push(b);
    }
  }
  const stack = result.slice();
  while (stack.length) {
    const b = stack.pop()!;
    for (const c of b.children) {
      c.x += b.x;
      c.y += b.y;
      stack.push(c);
    }
    for (const l of b.lanes) {
      l.x += b.x;
      l.y += b.y;
    }
  }
  return { roots: result, width, height: Math.max(400, y + 16), byId: boxes };
}

export function siblingRange(doc: Document, first: string, last: string): string[] {
  const loc = locations(doc),
    a = loc.get(first),
    b = loc.get(last);
  if (!a || !b || a.parent !== b.parent || a.slot !== b.slot || ['header', 'condition', 'operands'].includes(a.slot))
    throw Error('Mehrfachauswahl nur innerhalb derselben Anweisungsfolge.');
  const list = a.parent ? doc.nodes[a.parent].slots[a.slot] : doc.roots;
  return list.slice(Math.min(a.index, b.index), Math.max(a.index, b.index) + 1);
}
export function wrapNodes(h: History, ids: string[], kind: 'If' | 'While' | 'Repeat'): string {
  if (!ids.length) throw Error('Zuerst Anweisungen auswählen.');
  const range = siblingRange(h.doc, ids[0], ids.at(-1)!);
  if (range.join() != ids.join()) throw Error('Zusammenhängende Anweisungen auswählen.');
  const at = locations(h.doc).get(ids[0])!;
  if (at.slot === 'branches') throw Error('Fallzweige können nicht umschlossen werden.');
  let wrapper = '';
  h.batch(() => {
    wrapper = h.insert(kind, at);
    for (const id of ids)
      h.move(id, {
        parent: wrapper,
        slot: kind === 'If' ? 'then' : 'body',
        index: h.doc.nodes[wrapper].slots[kind === 'If' ? 'then' : 'body'].length,
      });
  });
  return wrapper;
}

export function generatedLabel(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= 67600000) throw Error('Namensraum für Sprungmarken erschöpft.');
  const prefix = Math.floor(index / 100000);
  return (
    String.fromCharCode(65 + Math.floor(prefix / 26), 65 + (prefix % 26)) + String(index % 100000).padStart(5, '0')
  );
}

export function replaceExpression(h: History, id: string, text: string): void {
  const n = h.doc.nodes[id];
  if (!n) throw Error('Bedingung fehlt.');
  if (!text.trim() || /[\r\n]/.test(text)) throw Error('Die Bedingung muss einzeilig und nicht leer sein.');
  if (fopExpression(h.doc, [id]) === text) return;
  const ids = descendants(h.doc, id);
  h.commit(
    ids.map((child) => ({
      id: child,
      before: structuredClone(h.doc.nodes[child]),
      after: child === id ? { ...structuredClone(n), kind: 'Text' as Kind, text, slots: {} } : null,
    })),
  );
}

export function parseCondition(text: string): Document {
  const d = emptyDocument();
  const todo: { text: string; list: string[] }[] = [{ text, list: d.roots }];
  while (todo.length) {
    const { text: raw, list } = todo.pop()!;
    const s = raw.trim();
    if (!s || /[\r\n]/.test(s)) throw Error('Bedingung muss einzeilig und nicht leer sein.');
    let depth = 0,
      quote = '',
      outerEnd = -1;
    const ops: { at: number; len: number; kind: 'And' | 'Or' }[] = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) {
        if (ch === quote) {
          if (s[i + 1] === quote) {
            i++;
            continue;
          }
          quote = '';
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === '(') {
        depth++;
        continue;
      }
      if (ch === ')') {
        if (--depth < 0) throw Error('Nicht passende Klammern.');
        if (depth === 0 && outerEnd < 0) outerEnd = i;
        continue;
      }
      if (depth === 0) {
        const m = s.slice(i).match(/^(AND|UND|OR|ODER)\b/i);
        if (
          m &&
          (i === 0 || /[\s)]/.test(s[i - 1])) &&
          (i + m[0].length === s.length || /[\s(]/.test(s[i + m[0].length]))
        ) {
          ops.push({ at: i, len: m[0].length, kind: /^(AND|UND)$/i.test(m[0]) ? 'And' : 'Or' });
          i += m[0].length - 1;
        } else if (ch === '&' || ch === ';') ops.push({ at: i, len: 1, kind: ch === '&' ? 'And' : 'Or' });
      }
    }
    if (depth || quote) throw Error('Nicht geschlossene Klammer oder Zeichenfolge.');
    if (s[0] === '(' && outerEnd === s.length - 1) {
      todo.push({ text: s.slice(1, -1), list });
      continue;
    }
    const chosen = ops.filter((o) => o.kind === (ops.some((o) => o.kind === 'Or') ? 'Or' : 'And'));
    if (chosen.length) {
      const n = addNode(d, chosen[0].kind);
      list.push(n.id);
      const parts: string[] = [];
      let from = 0;
      for (const op of chosen) {
        parts.push(s.slice(from, op.at));
        from = op.at + op.len;
      }
      parts.push(s.slice(from));
      for (let i = parts.length - 1; i >= 0; i--) todo.push({ text: parts[i], list: n.slots.operands });
      continue;
    }
    const not = s.match(/^(?:NOT|NICHT)(?=\s|\()\s*/i);
    if (not || (s.startsWith('_(') && outerEnd === s.length - 1)) {
      const n = addNode(d, 'Not');
      list.push(n.id);
      todo.push({ text: not ? s.slice(not[0].length) : s.slice(1), list: n.slots.operands });
      continue;
    }
    const n = addNode(d, 'Text');
    n.text = s;
    list.push(n.id);
  }
  return d;
}
export function conditionDisplay(doc: Document, ids: string[]): string {
  try {
    const temp = parseCondition(fopExpression(doc, ids));
    temp.view.language = doc.view.language;
    return expression(temp, temp.roots);
  } catch {
    return expression(doc, ids);
  }
}
export function editCondition(h: History, id: string, text: string): void {
  if (conditionDisplay(h.doc, [id]) === text) return;
  const parsed = parseCondition(text);
  const mapping = new Map<string, string>([[parsed.roots[0], id]]);
  let next = h.doc.nextId;
  for (const node of Object.values(parsed.nodes)) if (!mapping.has(node.id)) mapping.set(node.id, 'n' + next++);
  const patches: Patch[] = descendants(h.doc, id).map((child) => ({
    id: child,
    before: structuredClone(h.doc.nodes[child]),
    after: null,
  }));
  const rootPatch = patches.find((p) => p.id === id)!;
  for (const n of Object.values(parsed.nodes)) {
    const after: Node = { ...n, id: mapping.get(n.id)!, slots: {} };
    for (const [slot, ids] of Object.entries(n.slots)) after.slots[slot] = ids.map((x) => mapping.get(x)!);
    if (after.id === id) rootPatch.after = after;
    else patches.push({ id: after.id, before: null, after });
  }
  h.doc.nextId = next;
  h.commit(patches);
}
