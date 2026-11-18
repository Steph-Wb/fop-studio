import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../src/core.ts';
const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const head = (t) => Buffer.concat([Buffer.from([255]), u32(t), u32(1), Buffer.alloc(8)]);
const txt = (s) => Buffer.concat([head(15), u32(s.length + 1), Buffer.from(s, 'latin1')]);
const file = (tree) =>
  Buffer.concat([Buffer.from('SPX\0' + '6.5\0'), Buffer.from('TREE'), Buffer.from([17, 0]), u32(tree.length), tree]);
test('SPX text lengths preserve marker bytes and CRLF', () => {
  const d = c.importSPX(file(Buffer.concat([txt('ü\r\nÿð'), Buffer.from([240])])), 'windows-1252');
  assert.equal(d.nodes.n1.text, 'ü\nÿð');
});
test('SPX damaged and unknown formats fail with byte location', () => {
  const good = file(Buffer.concat([txt('test'), Buffer.from([240])]));
  for (let i = 0; i < good.length; i++)
    assert.throws(() => c.importSPX(good.subarray(0, i), 'windows-1252'), /SPX Byte/);
  const unknown = file(Buffer.concat([head(999), Buffer.from([240])]));
  assert.throws(() => c.importSPX(unknown, 'windows-1252'), /Elementtyp/);
  const version = Buffer.from(good);
  version[12] = 18;
  assert.throws(() => c.importSPX(version, 'windows-1252'), /TREE-Version/);
  const length = Buffer.from(good);
  length.writeUInt32LE(0xffffffff, 35);
  assert.throws(() => c.importSPX(length, 'windows-1252'), /Länge/);
});
test('SPX 1000 nested loops use an explicit stack', () => {
  const parts = [];
  for (let i = 0; i < 1000; i++) parts.push(head(4), txt('true'), Buffer.from([240]));
  parts.push(txt('.. body'));
  for (let i = 0; i < 1001; i++) parts.push(Buffer.from([240]));
  const d = c.importSPX(file(Buffer.concat(parts)), 'windows-1252');
  assert.deepEqual(d.diagnostics, []);
  assert.equal(Object.keys(d.nodes).length, 2001);
});
