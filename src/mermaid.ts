import { conditionDisplay, expression, label, type Document, type Node } from './core.ts';

export interface MermaidResult {
  code: string;
  /** Maps FOP Studio node ids to their generated Mermaid node ids. */
  nodeIds: Record<string, string>;
}

type Flow = { entries: string[]; exits: string[] };
type Shape = 'rect' | 'round' | 'diamond' | 'subroutine' | 'circle';

const emptyFlow = (): Flow => ({ entries: [], exits: [] });

/**
 * Converts the complete executable document tree to a deterministic Mermaid flowchart.
 * View state such as focus and folding is deliberately ignored.
 */
export function documentToMermaid(doc: Document): MermaidResult {
  const lines: string[] = ['flowchart TD'];
  const nodeIds: Record<string, string> = {};
  const procedureEntries = new Map<string, string>();
  const calls: { id: string; name: string }[] = [];
  const decisions: string[] = [];
  const endpoints: string[] = [];
  const containers: string[] = [];
  let sequence = 0;
  let subgraphSequence = 0;
  let indent = 1;

  const write = (text: string) => lines.push('  '.repeat(indent) + text);
  const fresh = () => 'fop' + ++sequence;
  const text = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br/>');
  const edgeText = (value: string) => text(value).replace(/\|/g, '&#124;');
  const safeExpression = (ids: string[] | undefined) => {
    try {
      return ids?.length ? expression(doc, ids) : '';
    } catch {
      return '';
    }
  };
  const condition = (n: Node) => {
    try {
      return conditionDisplay(doc, n.slots.condition || []);
    } catch {
      return safeExpression(n.slots.condition) || 'Bedingung';
    }
  };
  const title = (n: Node) => {
    try {
      return label(doc, n).trim();
    } catch {
      return safeExpression(n.slots.header) || n.text || n.kind;
    }
  };
  const localized = (de: string, en: string) => (doc.view.language === 'en' ? en : de);
  const kindName = (n: Node) => {
    const names: Partial<Record<Node['kind'], [string, string]>> = {
      Level: ['Gruppe', 'Group'],
      Block: ['Block', 'Block'],
      Frame: ['Rahmen', 'Frame'],
      Procedure: ['Prozedur', 'Procedure'],
      OnSelectorBranch: ['Fall', 'Case'],
    };
    const pair = names[n.kind];
    return pair ? localized(pair[0], pair[1]) : n.kind;
  };
  const addNode = (labelText: string, shape: Shape = 'rect', astId?: string) => {
    const id = fresh();
    const value = text(labelText || localized('(leer)', '(empty)'));
    const shapes: Record<Shape, string> = {
      rect: `${id}["${value}"]`,
      round: `${id}(["${value}"])`,
      diamond: `${id}{"${value}"}`,
      subroutine: `${id}[["${value}"]]`,
      circle: `${id}(("${value}"))`,
    };
    write(shapes[shape]);
    if (shape === 'diamond') decisions.push(id);
    if (astId) nodeIds[astId] = id;
    return id;
  };
  const connect = (from: string[], to: string[], labelText = '') => {
    for (const source of from)
      for (const target of to) write(`${source} ${labelText ? `-->|${edgeText(labelText)}|` : '-->'} ${target}`);
  };
  const placeholder = (labelText = '—') => addNode(labelText, 'round');

  function compileSequence(ids: string[]): Flow {
    const result = emptyFlow();
    for (const id of ids) {
      if (!doc.nodes[id] || doc.nodes[id].kind === 'Dummy') continue;
      const next = compileNode(id, doc.nodes[id]);
      if (!next.entries.length) continue;
      if (!result.entries.length) result.entries.push(...next.entries);
      else connect(result.exits, next.entries);
      result.exits = next.exits;
    }
    return result;
  }

  function compileNode(id: string, n: Node): Flow {
    switch (n.kind) {
      case 'Text': {
        const node = addNode(n.text, 'rect', id);
        return { entries: [node], exits: [node] };
      }
      case 'Call': {
        const name = safeExpression(n.slots.header).trim() || localized('Unbenannter Aufruf', 'Unnamed call');
        const node = addNode(localized('Aufruf: ', 'Call: ') + name, 'subroutine', id);
        calls.push({ id: node, name });
        return { entries: [node], exits: [node] };
      }
      case 'If': {
        const decision = addNode(condition(n), 'diamond', id);
        const yes = compileSequence(n.slots.then || []);
        const no = compileSequence(n.slots.else || []);
        if (!yes.entries.length)
          yes.entries = yes.exits = [placeholder(localized('Keine Anweisungen', 'No statements'))];
        if (!no.entries.length) no.entries = no.exits = [placeholder(localized('Keine Anweisungen', 'No statements'))];
        connect([decision], yes.entries, localized('Ja', 'Yes'));
        connect([decision], no.entries, localized('Nein', 'No'));
        return { entries: [decision], exits: [...yes.exits, ...no.exits] };
      }
      case 'While': {
        const decision = addNode(localized('Solange: ', 'While: ') + condition(n), 'diamond', id);
        const body = compileSequence(n.slots.body || []);
        if (body.entries.length) {
          connect([decision], body.entries, localized('Ja', 'Yes'));
          connect(body.exits, [decision]);
        } else {
          connect([decision], [decision], localized('Ja', 'Yes'));
        }
        const exit = placeholder(localized('Weiter', 'Continue'));
        connect([decision], [exit], localized('Nein', 'No'));
        return { entries: [decision], exits: [exit] };
      }
      case 'Repeat': {
        const body = compileSequence(n.slots.body || []);
        if (!body.entries.length) body.entries = body.exits = [placeholder(localized('Schleifenkörper', 'Loop body'))];
        const decision = addNode(localized('Beenden, wenn: ', 'Until: ') + condition(n), 'diamond', id);
        connect(body.exits, [decision]);
        connect([decision], body.entries, localized('Nein', 'No'));
        const exit = placeholder(localized('Weiter', 'Continue'));
        connect([decision], [exit], localized('Ja', 'Yes'));
        return { entries: body.entries, exits: [exit] };
      }
      case 'OnSelector': {
        const decision = addNode(localized('Fallauswahl: ', 'Case: ') + condition(n), 'diamond', id);
        const exits: string[] = [];
        const branches = (n.slots.branches || []).filter((branchId) => doc.nodes[branchId]);
        for (const branchId of branches) {
          const branch = doc.nodes[branchId];
          const branchFlow = compileSequence(branch.slots.body || []);
          if (!branchFlow.entries.length) branchFlow.entries = branchFlow.exits = [placeholder('—')];
          const branchName = branch.defaultBranch
            ? localized('Sonst', 'Else')
            : safeExpression(branch.slots.header) || localized('Fall', 'Case');
          nodeIds[branchId] = branchFlow.entries[0];
          connect([decision], branchFlow.entries, branchName);
          exits.push(...branchFlow.exits);
        }
        if (!branches.length) {
          const empty = placeholder(localized('Keine Fallzweige', 'No case branches'));
          connect([decision], [empty]);
          exits.push(empty);
        }
        return { entries: [decision], exits };
      }
      case 'Procedure': {
        const name = safeExpression(n.slots.header).trim() || localized('Unbenannte Prozedur', 'Unnamed procedure');
        const group = 'fopgroup' + ++subgraphSequence;
        write(`subgraph ${group}["${text(kindName(n) + ': ' + name)}"]`);
        write('direction TB');
        indent++;
        containers.push(group);
        const start = addNode(localized('Start: ', 'Start: ') + name, 'round', id);
        const end = addNode(localized('Ende: ', 'End: ') + name, 'round');
        endpoints.push(start, end);
        procedureEntries.set(name, start);
        const body = compileSequence(n.slots.body || []);
        if (body.entries.length) {
          connect([start], body.entries);
          connect(body.exits, [end]);
        } else connect([start], [end]);
        indent--;
        write('end');
        return emptyFlow();
      }
      case 'Level':
      case 'Block':
      case 'Frame':
      case 'OnSelectorBranch': {
        const name = title(n);
        const group = 'fopgroup' + ++subgraphSequence;
        write(`subgraph ${group}["${text(kindName(n) + (name ? ': ' + name : ''))}"]`);
        write('direction TB');
        indent++;
        containers.push(group);
        const ids = [...(n.slots.header || []), ...(n.slots.body || []), ...(n.slots.footer || [])];
        let flow = compileSequence(ids);
        if (!flow.entries.length) {
          const empty = placeholder(localized('Leerer Bereich', 'Empty section'));
          flow = { entries: [empty], exits: [empty] };
        }
        nodeIds[id] = flow.entries[0];
        indent--;
        write('end');
        return flow;
      }
      case 'And':
      case 'Or':
      case 'Not': {
        const node = addNode(title(n), 'rect', id);
        return { entries: [node], exits: [node] };
      }
      case 'Dummy':
        return emptyFlow();
    }
  }

  const start = addNode(localized('Start: ', 'Start: ') + doc.name, 'round');
  const end = addNode(localized('Ende', 'End'), 'round');
  endpoints.push(start, end);

  const executableRoots = doc.roots.filter((id) => doc.nodes[id] && doc.nodes[id].kind !== 'Procedure');
  const main = compileSequence(executableRoots);
  if (main.entries.length) {
    connect([start], main.entries);
    connect(main.exits, [end]);
  } else connect([start], [end]);

  for (const id of doc.roots) if (doc.nodes[id]?.kind === 'Procedure') compileNode(id, doc.nodes[id]);
  for (const call of calls) {
    const target = procedureEntries.get(call.name);
    if (target) write(`${call.id} -.-> ${target}`);
  }

  lines.push(
    '  classDef fopEndpoint fill:#e7eddf,stroke:#245f4b,color:#193d35,stroke-width:1.5px;',
    '  classDef fopDecision fill:#fff3d6,stroke:#a56e16,color:#193d35,stroke-width:1.5px;',
    '  classDef fopContainer fill:#fafbf7,stroke:#91aa9b,color:#193d35;',
  );
  if (endpoints.length) lines.push('  class ' + endpoints.join(',') + ' fopEndpoint;');
  if (decisions.length) lines.push('  class ' + decisions.join(',') + ' fopDecision;');
  if (containers.length) lines.push('  class ' + containers.join(',') + ' fopContainer;');
  return { code: lines.join('\n'), nodeIds };
}
