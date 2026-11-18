import test from 'node:test';
import assert from 'node:assert/strict';
import { addNode, emptyDocument } from '../src/core.ts';
import { documentToMermaid } from '../src/mermaid.ts';

function textNode(doc, text, target) {
  const n = addNode(doc, 'Text');
  n.text = text;
  target.push(n.id);
  return n;
}

test('Mermaid covers the complete AST, control flow, procedures and escaping', () => {
  const d = emptyDocument('Ablauf "Demo"');
  const group = addNode(d, 'Frame');
  textNode(d, '.formel start = 1', group.slots.header);
  const action = textNode(d, 'A < B & "C"\nZweite Zeile', group.slots.body);
  const ifNode = addNode(d, 'If');
  textNode(d, 'U|zaehler < 3', ifNode.slots.condition);
  const yes = textNode(d, '.formel U|zaehler = U|zaehler + 1', ifNode.slots.then);
  group.slots.body.push(ifNode.id);
  const whileNode = addNode(d, 'While');
  textNode(d, 'U|zaehler < 10', whileNode.slots.condition);
  textNode(d, '.formel U|zaehler = U|zaehler + 1', whileNode.slots.body);
  const repeatNode = addNode(d, 'Repeat');
  textNode(d, '.formel U|zaehler = U|zaehler - 1', repeatNode.slots.body);
  textNode(d, 'U|zaehler = 0', repeatNode.slots.condition);
  const selector = addNode(d, 'OnSelector');
  textNode(d, 'U|art', selector.slots.condition);
  const branch = addNode(d, 'OnSelectorBranch');
  textNode(d, '"A"', branch.slots.header);
  const branchText = textNode(d, '.formel U|x = 1', branch.slots.body);
  selector.slots.branches.push(branch.id);
  const call = addNode(d, 'Call');
  textNode(d, 'INITIALISIEREN', call.slots.header);
  group.slots.body.push(whileNode.id, repeatNode.id, selector.id, call.id);
  textNode(d, '.formel ende = 1', group.slots.footer);
  d.roots.push(group.id);

  const procedure = addNode(d, 'Procedure');
  textNode(d, 'INITIALISIEREN', procedure.slots.header);
  const procedureText = textNode(d, '.formel U|initialisiert = 1', procedure.slots.body);
  d.roots.push(procedure.id);

  d.view.focus = ifNode.id;
  d.view.collapsed = [group.id, ifNode.id];
  const result = documentToMermaid(d);
  assert.equal(result.code, documentToMermaid(d).code);
  assert.ok(result.code.startsWith('flowchart TD\n'));
  assert.match(result.code, /A &lt; B &amp; &quot;C&quot;<br\/>Zweite Zeile/);
  assert.match(result.code, /-->|Ja|/);
  assert.match(result.code, /-->|Nein|/);
  assert.match(result.code, /Solange: U\|zaehler &lt; 10/);
  assert.match(result.code, /Beenden, wenn: U\|zaehler = 0/);
  assert.match(result.code, /Fallauswahl: U\|art/);
  assert.match(result.code, /subgraph fopgroup\d+\["Prozedur: INITIALISIEREN"\]/);
  assert.match(result.code, new RegExp(result.nodeIds[call.id] + ' -\\.-> ' + result.nodeIds[procedure.id]));
  assert.match(result.code, /classDef fopDecision/);
  for (const id of [action.id, yes.id, branchText.id, procedureText.id, group.id, ifNode.id, branch.id])
    assert.ok(result.nodeIds[id], 'missing Mermaid mapping for ' + id);
  assert.ok(!result.code.includes('<script'));
});

test('Mermaid uses English labels and supports deep and large documents', () => {
  const d = emptyDocument('Deep');
  d.view.language = 'en';
  let list = d.roots;
  for (let i = 0; i < 1000; i++) {
    const n = addNode(d, 'While');
    textNode(d, 'x < ' + i, n.slots.condition);
    list.push(n.id);
    list = n.slots.body;
  }
  textNode(d, 'done', list);
  for (let i = 0; i < 5000; i++) textNode(d, 'step ' + i, d.roots);
  const result = documentToMermaid(d);
  assert.match(result.code, /While: x &lt; 0/);
  assert.match(result.code, /-->|Yes|/);
  assert.match(result.code, /Start: Deep/);
  assert.ok(Object.keys(result.nodeIds).length >= 6000);
});
