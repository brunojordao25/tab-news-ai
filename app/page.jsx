'use client';
import { useEffect, useState } from 'react';

const KEY = 'arvore-genealogica-v1';
const PALETTE = ['#cfe6c3', '#f9d3d9', '#d3e3f7', '#fbe4b4', '#e3d3f2', '#ffd9c2', '#c9eadf'];
const EMOJIS = ['👨', '👩', '👦', '👧', '🧒', '👴', '👵', '🧔', '👱‍♀️', '👨‍🦱', '👩‍🦰', '🧑', '👶', '🐶'];

const person = (name, emoji) => ({ id: crypto.randomUUID(), name, emoji, year: '' });
const family = (people, children = []) => ({ id: crypto.randomUUID(), people, children });
const initial = () =>
  family([person('Celso', '👨'), person('Suréia', '👩')], [
    family([person('Bruno', '👦')]),
    family([person('Máisa', '👧')]),
  ]);
const color = (id) => PALETTE[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % PALETTE.length];

function find(node, pid, parent = null) {
  const p = node.people.find((x) => x.id === pid);
  if (p) return { node, parent, person: p };
  for (const c of node.children) {
    const r = find(c, pid, node);
    if (r) return r;
  }
}

function Card({ p, sel, onSelect }) {
  return (
    <div className={'card' + (sel === p.id ? ' sel' : '')} onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}>
      <div className="avatar" style={{ background: color(p.id) }}>{p.emoji}</div>
      <div className="name">{p.name || 'Sem nome'}</div>
      <div className="year">{p.year && '✦ ' + p.year}</div>
    </div>
  );
}

function Unit({ node, sel, onSelect }) {
  const [a, b] = node.people;
  return (
    <div className="unit">
      <div className="couple">
        <Card p={a} sel={sel} onSelect={onSelect} />
        {b && <><div className="heart">❤️</div><Card p={b} sel={sel} onSelect={onSelect} /></>}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="stem" />
          <div className="kids">
            {node.children.map((c) => (
              <div className="kid" key={c.id}><Unit node={c} sel={sel} onSelect={onSelect} /></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch {}
    setData(saved ?? initial());
  }, []);
  useEffect(() => {
    if (data) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  if (!data) return null;

  const edit = (fn) => setData((d) => { const c = structuredClone(d); fn(c); return c; });
  const found = sel && find(data, sel);
  const set = (field, value) => edit((d) => { find(d, sel).person[field] = value; });
  const add = (kind) => {
    const p = person(kind === 'child' ? 'Novo filho' : 'Novo cônjuge', kind === 'child' ? '🧒' : '🧑');
    edit((d) => {
      const { node } = find(d, sel);
      kind === 'child' ? node.children.push(family([p])) : node.people.push(p);
    });
    setSel(p.id);
  };
  const remove = () => {
    const { node, parent, person: p } = found;
    if (node.people.length === 1 && !parent) return alert('Esta é a raiz da árvore. Edite o nome ou use "Recomeçar do zero".');
    const extra = node.people.length === 1 && node.children.length ? ' e todos os descendentes' : '';
    if (!confirm(`Remover ${p.name}${extra}?`)) return;
    edit((d) => {
      const f = find(d, sel);
      if (f.node.people.length > 1) f.node.people = f.node.people.filter((x) => x.id !== sel);
      else f.parent.children = f.parent.children.filter((c) => c !== f.node);
    });
    setSel(null);
  };
  const reset = () => {
    if (!confirm('Apagar tudo e começar uma árvore nova?')) return;
    const p = person('Nome', '🧑');
    setData(family([p]));
    setSel(p.id);
  };

  return (
    <div onClick={() => setSel(null)}>
      <header>
        <h1>Nossa <span>♥</span> Família</h1>
        <p className="sub">Clique em alguém para editar, adicionar cônjuge ou filhos</p>
        <div className="toolbar"><button className="link" onClick={(e) => { e.stopPropagation(); reset(); }}>Recomeçar do zero</button></div>
      </header>
      <div className="canvas"><div className="tree"><Unit node={data} sel={sel} onSelect={setSel} /></div></div>

      {found ? (
        <div className="panel" onClick={(e) => e.stopPropagation()}>
          <div className="row">
            <label>Nome<input value={found.person.name} maxLength={40} autoFocus onChange={(e) => set('name', e.target.value)} /></label>
            <label className="small">Nascimento<input value={found.person.year} maxLength={12} placeholder="ex: 1990" onChange={(e) => set('year', e.target.value)} /></label>
          </div>
          <div className="emojis">
            {EMOJIS.map((e) => (
              <button key={e} className={e === found.person.emoji ? 'on' : ''} onClick={() => set('emoji', e)}>{e}</button>
            ))}
          </div>
          <div className="actions">
            <button className="btn rose" onClick={() => add('child')}>+ Filho(a)</button>
            {found.node.people.length < 2 && <button className="btn gold" onClick={() => add('partner')}>+ Cônjuge</button>}
            <button className="btn danger" onClick={remove}>Remover</button>
            <button className="btn ghost" onClick={() => setSel(null)}>Fechar</button>
          </div>
        </div>
      ) : (
        <div className="panel empty">Selecione uma pessoa da árvore 🌳</div>
      )}
    </div>
  );
}
