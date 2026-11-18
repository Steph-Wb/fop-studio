import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../src/core.ts';
function program(name){const d=c.emptyDocument(name),h=new c.History(d);const text=(s,where)=>{const id=h.insert('Text',where);h.text(id,s);return id;};const at=()=>({parent:null,slot:'roots',index:d.roots.length});text('.weiter MAIN',at());const p=h.insert('Procedure',at());h.text(d.nodes[p].slots.header[0],'P');const q=h.insert('Procedure',at());h.text(d.nodes[q].slots.header[0],'Q');const call=(name,where)=>{const id=h.insert('Call',where);h.text(d.nodes[id].slots.header[0],name);};call('Q',{parent:p,slot:'body',index:0});text('.ein CHILD',{parent:q,slot:'body',index:0});text('!MAIN',at());call('P',at());call('P',at());text('.ende .',at());return d;}
// Deliberately small execution model of the generated instruction subset, not an abas interpreter.
function run(text,memory,frame,include=()=>{}){const lines=text.split('\n'),labels=new Map();lines.forEach((l,i)=>{if(l[0]==='!')labels.set(l.slice(1).split(/[ :]/)[0],i);});
 const resolve=s=>s.replace(/^U\|/,'').replace(/\.(G\|framecount|U\|[a-z0-9]+)/gi,(_,v)=>String(value(v)));
 const value=s=>{if(s==='G|framecount')return frame;const k=resolve(s);assert.ok(memory.has(k),'read before initialization: '+k);return memory.get(k);};
 const evalValue=s=>{s=s.trim();if(s.startsWith('"')&&s.endsWith('"'))return s.slice(1,-1);if(s.startsWith("'")&&s.endsWith("'"))return String(value(s.slice(1,-1)));if(/^-?\d+$/.test(s))return Number(s);return value(s);};
 const condition=s=>{let m=s.match(/^_F\|defined\((.*)\)$/);if(m)return !memory.has(resolve(m[1]));m=s.match(/^(.*) >= (\d+)$/);if(m)return value(m[1])>=Number(m[2]);throw Error('unknown condition '+s);};
 let steps=0;for(let pc=0;pc<lines.length;pc++){assert.ok(++steps<10000,'execution bound');let l=lines[pc];if(!l||l.startsWith('..')||l.startsWith('!'))continue;const cond=l.indexOf(' ? ');if(cond>=0){if(!condition(l.slice(cond+3)))continue;l=l.slice(0,cond);}let m;
 if((m=l.match(/^\.art (integer|text) (.+)$/))){memory.set(resolve(m[2]),m[1]==='integer'?0:'');continue;}
 if((m=l.match(/^\.formel (\S+) = (.+)$/))){const parts=m[2].split(/ (\+|-) /);let v=evalValue(parts[0]);for(let i=1;i<parts.length;i+=2){const b=evalValue(parts[i+1]);v=parts[i]==='+'?v+b:v-b;}memory.set(resolve(m[1]),v);continue;}
 if((m=l.match(/^\.weiter (.+)$/))){const target=m[1].startsWith("'")?evalValue(m[1]):m[1];assert.ok(labels.has(target),'missing return target '+target);pc=labels.get(target);continue;}
 if(l==='.ein CHILD'){include(memory,frame);continue;}if(l==='.ende .')return;if(l==='.ende 1')throw Error('depth overflow');throw Error('unsupported '+l);
 }}
test('generated calls preserve caller state, nesting, reentry and repeated execution',()=>{const a=program('A'),b=program('B'),at=c.exportFOP(a).text,bt=c.exportFOP(b).text;const mem=new Map([['xprocsp',7],['xprocst7','OLDRET']]);let calls=0;run(at,mem,1,(m,f)=>{calls++;run(bt,m,f+1);run(at,m,f+1);});assert.equal(calls,2);assert.equal(mem.get('xprocsp'),7);assert.equal(mem.get('xprocst7'),'OLDRET');assert.equal(mem.get(c.procedureRuntime(a).base+'p1'),0);assert.equal(mem.get(c.procedureRuntime(a).base+'p2'),0);run(at,mem,1);assert.equal(mem.get(c.procedureRuntime(a).base+'p1'),0);});
test('namespace persists through project reload and rename',()=>{const d=program('A'),key=c.procedureRuntime(d).base;d.name='Renamed';assert.equal(c.procedureRuntime(c.loadProject(c.projectJSON(d))).base,key);assert.notEqual(c.procedureRuntime(program('B')).base,key);});
test('legacy and private raw accesses block export without changing text',()=>{for(const code of ['.art int xprocsp','.fo xprocsp = 0',".weiter 'xprocst.xprocsp'",'.fo U|xfs12345678p = 0']){const d=program('A'),n=Object.values(d.nodes).find(n=>n.kind==='Text'&&n.text==='.weiter MAIN');n.text=code;assert.throws(()=>c.exportFOP(d),/Verwaltungsvariablen/);assert.equal(n.text,code);}});
test('no runtime is emitted for programs without procedures',()=>{const d=c.emptyDocument();assert.doesNotMatch(c.exportFOP(d).text,/framecount|xfs[0-9a-f]/);});

test('code language changes generated instructions only and persists independently',()=>{
 const d=program('Languages');d.view.language='de';d.profile.codeLanguage='en';
 const raw=Object.values(d.nodes).filter(n=>n.kind==='Text').map(n=>n.text);
 const out=c.exportFOP(d).text;
 assert.ok(out.startsWith('..!interpreter english translate\n'));
 for(const command of ['continue','formula','type','end'])assert.ok(out.includes('.'+command+' '));
 assert.match(out,/\.type integer xfs/);
 for(const text of raw)assert.ok(out.includes(text));
 assert.deepEqual(Object.values(d.nodes).filter(n=>n.kind==='Text').map(n=>n.text),raw);
 const loaded=c.loadProject(c.projectJSON(d));assert.equal(loaded.profile.codeLanguage,'en');assert.equal(loaded.view.language,'de');
 const old=JSON.parse(c.projectJSON(d));delete old.profile.codeLanguage;assert.equal(c.loadProject(JSON.stringify(old)).profile.codeLanguage,'de');
 old.profile.codeLanguage='fr';assert.throws(()=>c.loadProject(JSON.stringify(old)),/Code-Sprache/);
 const h=new c.History(d),id=h.insert('Text',{parent:null,slot:'roots',index:d.roots.length});assert.equal(d.nodes[id].text,'.formula U|variable = 0');
});
test('all generated control-flow branches use the selected code language',()=>{
 const d=c.emptyDocument(),h=new c.History(d);d.profile.codeLanguage='en';d.view.language='de';
 for(const kind of ['If','While','Repeat','OnSelector']){const id=h.insert(kind,{parent:null,slot:'roots',index:d.roots.length});const n=d.nodes[id];h.text((n.slots.condition||n.slots.header)[0],'U|zaehler');}
 const out=c.exportFOP(d).text;assert.match(out,/\.continue /);assert.doesNotMatch(out,/\.weiter /);assert.match(out,/U\|zaehler/);
 d.view.language='en';d.profile.codeLanguage='de';const german=c.exportFOP(d).text;assert.match(german,/interpreter german translate/);assert.match(german,/\.weiter /);assert.doesNotMatch(german,/\.continue /);
});
