import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../src/core.ts';
const exportAt = (d) => c.exportFOP(d, new Date('2026-11-17T12:00:00Z'));
test('encoding roundtrip and rejection', () => {
  for (const enc of ['cp850', 'cp437', 'windows-1252', 'utf-8'])
    assert.equal(c.decode(c.encode('für ÄÖÜ äöü ß', enc), enc), 'für ÄÖÜ äöü ß');
  assert.throws(() => c.encode('😀', 'cp850'));
  assert.throws(() => c.encode('x', 'unconfirmed'));
});
test('editing, move protection, copy, undo and project roundtrip', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const group = h.insert('Level', { parent: null, slot: 'roots', index: 0 });
  const text = h.insert('Text', { parent: group, slot: 'body', index: 0 });
  h.text(text, '.fo x = 3');
  assert.throws(() => h.move(group, { parent: group, slot: 'body', index: 0 }));
  const copy = h.copy(text, { parent: group, slot: 'body', index: 1 });
  assert.notEqual(copy, text);
  h.remove(text);
  h.undo();
  assert.equal(d.nodes[text].text, '.fo x = 3');
  h.redo();
  assert.equal(d.nodes[text], undefined);
  assert.deepEqual(c.validate(d), []);
  assert.equal(c.projectJSON(c.loadProject(c.projectJSON(d))), c.projectJSON(d));
});
test('unknown tokens and empty conditions block export', () => {
  const d = c.parseETF('EasyCASE=SPX\nUnknown;');
  d.profile.encoding = 'utf-8';
  assert.throws(() => exportAt(d), /Export gesperrt/);
  const w = c.emptyDocument(),
    h = new c.History(w);
  const id = h.insert('While', { parent: null, slot: 'roots', index: 0 });
  h.text(w.nodes[id].slots.condition[0], '');
  w.profile.encoding = 'utf-8';
  assert.throws(() => exportAt(w), /Bedingung/);
});
test('project rejects cycles', () => {
  const d = c.emptyDocument();
  const n = c.addNode(d, 'Level'),
    t = c.addNode(d, 'Text');
  n.slots.header = [t.id];
  n.slots.body = [n.id];
  d.roots = [n.id];
  assert.throws(() => c.loadProject(c.projectJSON(d)), /Zyklus/);
});
for (const depth of [100, 500, 1000])
  test('iterative nesting ' + depth, () => {
    const d = c.emptyDocument();
    let list = d.roots;
    for (let i = 0; i < depth; i++) {
      const n = c.addNode(d, 'Repeat'),
        t = c.addNode(d, 'Text');
      t.text = 'x = 1';
      n.slots.condition = [t.id];
      list.push(n.id);
      list = n.slots.body;
    }
    d.profile.encoding = 'cp850';
    assert.deepEqual(c.validate(d), []);
    assert.ok(c.layout(d, null, new Set()).height > 0);
    assert.ok(exportAt(d).bytes.length > depth);
    assert.equal(Object.keys(c.loadProject(c.projectJSON(d)).nodes).length, depth * 2);
  });
for (const size of [1000, 10000, 50000])
  test('large sequential document ' + size, () => {
    const start = performance.now(),
      d = c.emptyDocument();
    for (let i = 0; i < size; i++) {
      const n = c.addNode(d, 'Text');
      n.text = '.fo x = ' + i;
      d.roots.push(n.id);
    }
    d.profile.encoding = 'cp850';
    assert.deepEqual(c.validate(d), []);
    assert.equal(c.layout(d, null, new Set()).byId.size, size);
    assert.ok(exportAt(d).bytes.length > size);
    assert.equal(Object.keys(c.loadProject(c.projectJSON(d)).nodes).length, size);
    console.log(
      size + ' nodes: ' + Math.round(performance.now() - start) + ' ms (validation/layout/export/project roundtrip)',
    );
  });

test('wrap contiguous selection is atomic and preserves nested content', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const a = h.insert('Text', { parent: null, slot: 'roots', index: 0 }),
    b = h.insert('Repeat', { parent: null, slot: 'roots', index: 1 });
  const inner = h.insert('Text', { parent: b, slot: 'body', index: 0 });
  h.text(inner, 'preserve');
  const id = c.wrapNodes(h, [a, b], 'If');
  assert.deepEqual(d.nodes[id].slots.then, [a, b]);
  assert.deepEqual(c.validate(d), []);
  h.undo();
  assert.deepEqual(d.roots, [a, b]);
  assert.equal(d.nodes[inner].text, 'preserve');
  assert.equal(d.nodes[id], undefined);
  h.redo();
  assert.deepEqual(d.nodes[id].slots.then, [a, b]);
});
test('batch rolls back invalid nested move', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const a = h.insert('Level', { parent: null, slot: 'roots', index: 0 });
  const roots = d.roots.slice(),
    size = Object.keys(d.nodes).length;
  assert.throws(() =>
    h.batch(() => {
      h.insert('Text', { parent: a, slot: 'body', index: 0 });
      h.move(a, { parent: a, slot: 'body', index: 0 });
    }),
  );
  assert.deepEqual(d.roots, roots);
  assert.equal(Object.keys(d.nodes).length, size);
  assert.deepEqual(c.validate(d), []);
});

test('classic FO labels are unique in their first seven characters', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  for (let i = 0; i < 12; i++) h.insert('If', { parent: null, slot: 'roots', index: d.roots.length });
  d.profile.encoding = 'cp850';
  const labels = [...exportAt(d).text.matchAll(/^(\w+)/gm)].map((m) => m[1]);
  assert.equal(labels.length, 12);
  assert.ok(labels.every((x) => x.length <= 7));
  assert.equal(new Set(labels.map((x) => x.slice(0, 7))).size, 12);
});
test('generated labels avoid seven-character prefix of existing labels', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const t = h.insert('Text', { parent: null, slot: 'roots', index: 0 });
  h.text(t, '!AA00000EXISTING');
  h.insert('If', { parent: null, slot: 'roots', index: 1 });
  d.profile.encoding = 'cp850';
  assert.ok(!exportAt(d).text.includes('.WEITER AA00000'));
  h.text(t, '!ABCDEFG1\n!ABCDEFG2');
  assert.throws(() => exportAt(d), /Sprungmarkenkollision/);
});

test('label alphabet boundaries and capacity', () => {
  assert.equal(c.generatedLabel(0), 'AA00000');
  assert.equal(c.generatedLabel(99999), 'AA99999');
  assert.equal(c.generatedLabel(100000), 'AB00000');
  assert.equal(c.generatedLabel(2599999), 'AZ99999');
  assert.equal(c.generatedLabel(2600000), 'BA00000');
  assert.equal(c.generatedLabel(67599999), 'ZZ99999');
  assert.throws(() => c.generatedLabel(67600000));
  assert.throws(() => c.generatedLabel(-1));
});
test('IF lanes have explicit labels and room for insertion', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const id = h.insert('If', { parent: null, slot: 'roots', index: 0 });
  const b = c.layout(d, null, new Set()).byId.get(id);
  assert.deepEqual(
    b.lanes.map((l) => l.title),
    ['JA', 'NEIN'],
  );
  assert.ok(b.lanes.every((l) => l.h >= 52));
  assert.equal(b.lanes[1].x, b.lanes[0].x + b.lanes[0].w);
});

test('folding hides children and survives project save without changing FOP', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const id = h.insert('If', { parent: null, slot: 'roots', index: 0 });
  const child = h.insert('Repeat', { parent: id, slot: 'then', index: 0 });
  d.profile.encoding = 'cp850';
  const fop = exportAt(d).text;
  const open = c.layout(d, null, new Set());
  d.view.collapsed = [id];
  const closed = c.layout(d, null, new Set(d.view.collapsed));
  assert.ok(!closed.byId.has(child));
  assert.ok(closed.byId.get(id).h < open.byId.get(id).h);
  assert.deepEqual(c.loadProject(c.projectJSON(d)).view.collapsed, [id]);
  assert.equal(exportAt(d).text, fop);
  assert.ok(c.layout(d, null, new Set()).byId.has(child));
});

test('procedure resolution rejects missing and duplicate names', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  d.profile.encoding = 'utf-8';
  const call = h.insert('Call', { parent: null, slot: 'roots', index: 0 });
  h.text(d.nodes[call].slots.header[0], 'MISSING');
  assert.throws(() => exportAt(d), /Unbekannte Prozedur/);
  const p = h.insert('Procedure', { parent: null, slot: 'roots', index: 1 });
  h.text(d.nodes[p].slots.header[0], 'MISSING');
  assert.doesNotThrow(() => exportAt(d));
  const q = h.insert('Procedure', { parent: null, slot: 'roots', index: 2 });
  h.text(d.nodes[q].slots.header[0], 'MISSING');
  assert.throws(() => exportAt(d), /doppelter Prozedurname/);
});
test('deep negation export uses an explicit stack', () => {
  const d = c.emptyDocument();
  const loop = c.addNode(d, 'While');
  d.roots = [loop.id];
  let slot = loop.slots.condition;
  for (let i = 0; i < 1000; i++) {
    const n = c.addNode(d, 'Not');
    slot.push(n.id);
    slot = n.slots.operands;
  }
  const t = c.addNode(d, 'Text');
  t.text = 'mehr';
  slot.push(t.id);
  d.profile.encoding = 'utf-8';
  const out = exportAt(d).text;
  assert.ok(out.includes('_('.repeat(1001) + 'mehr' + ')'.repeat(1001)));
});

test('case layout switches between stacked and side-by-side without changing export', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const id = h.insert('OnSelector', { parent: null, slot: 'roots', index: 0 });
  for (let i = 0; i < 22; i++)
    h.insert('OnSelectorBranch', { parent: id, slot: 'branches', index: d.nodes[id].slots.branches.length });
  d.profile.encoding = 'utf-8';
  const before = exportAt(d).text;
  const vertical = c.layout(d, null, new Set()).byId.get(id);
  assert.ok(vertical.children.length >= 22);
  for (let i = 1; i < vertical.children.length; i++) {
    const a = vertical.children[i - 1],
      b = vertical.children[i];
    assert.equal(a.x, b.x);
    assert.ok(b.y >= a.y + a.h);
    assert.equal(a.w, b.w);
  }
  d.view.caseLayout = 'horizontal';
  const horizontal = c.layout(d, null, new Set()).byId.get(id);
  assert.ok(horizontal.w > vertical.w);
  for (let i = 1; i < horizontal.children.length; i++) {
    const a = horizontal.children[i - 1],
      b = horizontal.children[i];
    assert.equal(a.y, b.y);
    assert.ok(b.x >= a.x + a.w);
  }
  assert.equal(exportAt(d).text, before);
  assert.equal(c.loadProject(c.projectJSON(d)).view.caseLayout, 'horizontal');
  delete d.view.caseLayout;
  assert.equal(c.loadProject(c.projectJSON(d)).view.caseLayout, 'vertical');
  const folded = c.layout(d, null, new Set([id])).byId.get(id);
  assert.equal(folded.children.length, 0);
});

test('responsive blocks wrap all text without changing source or export', () => {
  const d = c.emptyDocument(),
    h = new c.History(d),
    group = h.insert('Block', { parent: null, slot: 'roots', index: 0 }),
    id = h.insert('Text', { parent: group, slot: 'body', index: 0 });
  const source = Array.from({ length: 9 }, (_, i) => '.fo value' + i + ' = "' + 'long value '.repeat(12) + '"').join(
    '\n',
  );
  h.text(id, source);
  d.profile.encoding = 'utf-8';
  const original = exportAt(d).text;
  const wide = c.layout(d, null, new Set(), 1200),
    narrow = c.layout(d, null, new Set(), 620);
  assert.equal(wide.width, 1200);
  assert.equal(narrow.width, 620);
  assert.ok(wide.byId.get(id).w > narrow.byId.get(id).w);
  assert.ok(wide.byId.get(id).head < narrow.byId.get(id).head);
  const parts = c.wrappedText(source, narrow.byId.get(id).w);
  assert.equal(parts.map((p) => p.text).join(''), source.replaceAll('\n', ''));
  assert.equal(
    narrow.byId.get(id).head,
    parts.length * c.diagramTypography.lineHeight + c.diagramTypography.headerSpace,
  );
  assert.equal(d.nodes[id].text, source);
  assert.equal(exportAt(d).text, original);
});

test('short content stays compact in a wide viewport', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const g = h.insert('Block', { parent: null, slot: 'roots', index: 0 });
  h.text(d.nodes[g].slots.header[0], 'Gruppe');
  const id = h.insert('Text', { parent: g, slot: 'body', index: 0 });
  h.text(id, '.fo x = 1');
  const narrow = c.layout(d, null, new Set(), 600),
    wide = c.layout(d, null, new Set(), 1600);
  assert.equal(wide.byId.get(id).w, narrow.byId.get(id).w);
  assert.equal(wide.byId.get(g).w, narrow.byId.get(g).w);
  assert.ok(wide.byId.get(g).w < 350);
  const longer = '.fo m100o7 = "PC.EXEC " + m100o5 + m100o9';
  h.text(id, longer);
  const changed = c.layout(d, null, new Set(), 1600).byId.get(id);
  assert.ok(changed.w > wide.byId.get(id).w);
  assert.equal(c.wrappedText(longer, changed.w).length, 1);
});

test('text blocks have no empty strip below their content', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const group = h.insert('If', { parent: null, slot: 'roots', index: 0 });
  const a = h.insert('Text', { parent: group, slot: 'then', index: 0 }),
    b = h.insert('Text', { parent: group, slot: 'then', index: 1 });
  h.text(a, '.fo x = 1');
  h.text(b, '.fo x = 2\n.fo y = 3');
  d.profile.encoding = 'utf-8';
  const before = exportAt(d).text;
  const scene = c.layout(d, null, new Set(), 900);
  for (const id of [a, b]) {
    const box = scene.byId.get(id);
    assert.equal(box.h, box.head);
  }
  const first = scene.byId.get(a),
    second = scene.byId.get(b);
  assert.equal(second.y - first.y - first.h, 18);
  assert.equal(exportAt(d).text, before);
});

test('repeat tests at footer, while at header, folded repeat retains condition in both languages', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const r = h.insert('Repeat', { parent: null, slot: 'roots', index: 0 }),
    w = h.insert('While', { parent: null, slot: 'roots', index: 1 });
  h.text(d.nodes[r].slots.condition[0], 'zaehler = 3');
  h.text(d.nodes[w].slots.condition[0], 'zaehler < 3');
  d.profile.encoding = 'utf-8';
  const before = exportAt(d).text;
  for (const language of ['de', 'en']) {
    d.view.language = language;
    assert.equal(c.diagramHeader(d, d.nodes[r], false), '');
    assert.equal(c.diagramHeader(d, d.nodes[r], true), 'zaehler = 3');
    assert.equal(c.diagramFooter(d, d.nodes[r]), (language === 'de' ? 'Beenden, wenn: ' : 'Until: ') + 'zaehler = 3');
    assert.equal(c.diagramHeader(d, d.nodes[w], false), 'zaehler < 3');
   .assert.equal(c.diagramFooter(d, d.nodes[w]), '');
    const open = c.layout(d, null, new Set());
    assert.equal(open.byId.get(r).head, c.diagramTypography.headerSpace);
    assert.ok(open.byId.get(r).foot > 0);
    assert.equal(open.byId.get(w).foot, 0);
    assert.equal(c.layout(d, null, new Set([r])).byId.get(r).foot, 0);
    assert.equal(exportAt(d).text, before);
  }
});

test('empty placeholders stay in the document but are not drawn', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const id = h.insert('If', { parent: null, slot: 'roots', index: 0 });
  const placeholder = c.addNode(d, 'Dummy');
  d.nodes[id].slots.else.push(placeholder.id);
  const placeholders = Object.values(d.nodes)
    .filter((n) => n.kind === 'Dummy')
    .map((n) => n.id);
  assert.ok(placeholders.length);
  d.profile.encoding = 'utf-8';
  const before = exportAt(d).text;
  const scene = c.layout(d, null, new Set());
  for (const id of placeholders) {
    assert.equal(scene.byId.has(id), false);
    assert.ok(d.nodes[id]);
  }
  assert.equal(scene.byId.get(id).lanes.length, 2);
  assert.equal(exportAt(d).text, before);
  h.insert('Text', { parent: id, slot: 'else', index: 0 });
  assert.deepEqual(c.validate(d), []);
});

test('reading mode removes insertion gaps while preserving export and saved preference', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const loop = h.insert('Repeat', { parent: null, slot: 'roots', index: 0 });
  const branch = h.insert('If', { parent: loop, slot: 'body', index: 0 });
  const a = h.insert('Text', { parent: branch, slot: 'then', index: 0 }),
    b = h.insert('Text', { parent: branch, slot: 'then', index: 1 });
  d.profile.encoding = 'utf-8';
  const before = exportAt(d).text;
  const editing = c.layout(d, null, new Set());
  d.view.readingMode = true;
  const reading = c.layout(d, null, new Set());
  const ab = reading.byId.get(a),
    bb = reading.byId.get(b),
    lb = reading.byId.get(loop),
    ib = reading.byId.get(branch);
  assert.equal(bb.y, ab.y + ab.h);
  assert.equal(ib.y, lb.y + lb.head);
  assert.equal(ab.y, ib.y + ib.head + 34);
  assert.ok(reading.byId.get(loop).h < editing.byId.get(loop).h);
  assert.equal(exportAt(d).text, before);
  assert.equal(c.loadProject(c.projectJSON(d)).view.readingMode, true);
});

test('logical editor preserves grouping, quotes, language and export syntax', () => {
  for (const input of ['(m100xb1) AND (m100o1 <> "")', '(m100xb1) UND (m100o1 <> "")']) {
    const d = c.parseCondition(input);
    d.view.language = 'en';
    assert.equal(c.expression(d, d.roots), '(m100xb1) AND (m100o1 <> "")');
    assert.equal(c.fopExpression(d, d.roots), '(m100xb1) & (m100o1 <> "")');
    d.view.language = 'de';
    assert.equal(c.expression(d, d.roots), '(m100xb1) UND (m100o1 <> "")');
  }
  const nested = c.parseCondition('(freigabe) AND ((typ = "A") OR (typ = "B"))');
  nested.view.language = 'en';
  assert.equal(c.expression(nested, nested.roots), '(freigabe) AND ((typ = "A") OR (typ = "B"))');
  assert.equal(c.fopExpression(nested, nested.roots), '(freigabe) & ((typ = "A") ; (typ = "B"))');
  const quoted = c.parseCondition('NOT (F|empty("AND; OR & (x)"))');
  assert.equal(c.fopExpression(quoted, quoted.roots), '_(F|empty("AND; OR & (x)"))');
  for (const invalid of ['x AND', '(x', 'x)', '"open', 'NOT ()']) assert.throws(() => c.parseCondition(invalid));
});
test('editing logical condition restores original nodes on undo and persists on reload', () => {
  const d = c.emptyDocument(),
    h = new c.History(d);
  const id = h.insert('If', { parent: null, slot: 'roots', index: 0 }),
    cond = d.nodes[id].slots.condition[0];
  h.text(cond, '(x) & (y)');
  const original = exportAt(d).text;
  const count = h.undoStack.length;
  c.editCondition(h, cond, c.conditionDisplay(d, [cond]));
  assert.equal(h.undoStack.length, count);
  c.editCondition(h, cond, '(x) AND (NOT (y))');
  assert.equal(c.fopExpression(d, [cond]), '(x) & (_(y))');
  assert.deepEqual(c.validate(d), []);
  const saved = c.loadProject(c.projectJSON(d));
  assert.equal(c.fopExpression(saved, [cond]), '(x) & (_(y))');
  h.undo();
  assert.equal(exportAt(d).text, original);
  h.redo();
  assert.equal(c.fopExpression(d, [cond]), '(x) & (_(y))');
});

test('export adds generation metadata and readable structure comments with lowercase commands', () => {
  const d = c.emptyDocument('Test.EFOP'),
    h = new c.History(d);
  const p = h.insert('Procedure', { parent: null, slot: 'roots', index: 0 });
  h.text(d.nodes[p].slots.header[0], 'IMPORT');
  h.insert('If', { parent: p, slot: 'body', index: 0 });
  h.insert('Repeat', { parent: p, slot: 'body', index: 1 });
  h.insert('While', { parent: p, slot: 'body', index: 2 });
  const sel = h.insert('OnSelector', { parent: p, slot: 'body', index: 3 });
  h.insert('OnSelectorBranch', { parent: sel, slot: 'branches', index: 0 });
  const call = h.insert('Call', { parent: null, slot: 'roots', index: 1 });
  h.text(d.nodes[call].slots.header[0], 'IMPORT');
  const out = exportAt(d).text;
  assert.match(out, /Generiert: 2026-11-17 12:00:00 UTC/);
  assert.match(out, /Datei: Test.EFOP/);
  for (const text of [
    'PROCEDURE IMPORT',
    'END PROCEDURE IMPORT',
    'IF001',
    'REPEAT001',
    'WHILE001',
    'CASE001',
    'ENDCASE CASE001',
    'RETURN IMPORT',
  ])
    assert.ok(out.includes(text), text);
  assert.ok(out.includes('.weiter '));
  assert.doesNotMatch(out, /^\.[A-Z]/m);
});

test('condition parser does not reinterpret dotted fields as logical keywords', () => {
  for (const atom of ['record.AND', 'NOT.field', 'H|OR', 'item.OR = 3', 'record.UND <> ""']) {
    const d = c.parseCondition(atom);
    assert.equal(c.fopExpression(d, d.roots), atom);
  }
  const d = c.parseCondition('(x)AND(y)');
  assert.equal(c.fopExpression(d, d.roots), '(x) & (y)');
});
test('export handles a large multiline text without argument-stack overflow', () => {
  const d = c.emptyDocument(),
    n = c.addNode(d, 'Text');
  d.roots = [n.id];
  n.text = Array(150000).fill('.. comment').join('\n');
  const out = exportAt(d);
  assert.ok(out.bytes.length > 1500000);
  assert.equal(out.text.split('.. comment').length - 1, 150000);
});
