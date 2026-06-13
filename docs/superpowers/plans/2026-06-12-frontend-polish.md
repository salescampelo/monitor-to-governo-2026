# Polish de Frontend (Confronto + Export) — Plano de Implementação

> **Para workers agênticos:** SUB-SKILL OBRIGATÓRIA: superpowers:subagent-driven-development.
> Passos usam checkbox (`- [ ]`). Branch: `frontend-polish-confronto`.

**Goal:** Adicionar ao dashboard a aba **Confronto** (comparação lado-a-lado de
2 adversários) e **export CSV/PDF**, sobre os dados já publicados.

**Architecture:** React 19 + Vite, estilo inline + CSS-vars (`src/components/ui.jsx`).
recharts para radar/linha; jspdf+html2canvas para dossiê; CSV zero-dep. Funções
puras de transformação isoladas em `src/lib/` e testadas com vitest.

**Tech Stack:** React 19, recharts ^2, jspdf ^2, html2canvas ^1, vitest (dev).

**Spec:** `docs/superpowers/specs/2026-06-12-frontend-polish-design.md`

**Convenção CRLF:** repo é eol=lf; após Edit/Write em arquivo de código, normalizar
para LF antes do commit (`python -c "s=open(p,'rb').read();open(p,'wb').write(s.replace(b'\r\n',b'\n'))"`).

---

### Task 1: Dependências + runner de teste

**Files:** Modify `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar deps de runtime e dev**

```bash
cd C:/dev/monitor-to-governo-2026
npm install recharts@^2 jspdf@^2 html2canvas@^1
npm install -D vitest
```

- [ ] **Step 2: Adicionar script de teste** em `package.json` (bloco `scripts`):

```json
"test": "vitest run"
```

- [ ] **Step 3: Smoke** — `npm run build` deve passar (recharts importável). Rodar `npx vitest run` (0 testes ainda → exit 0 ou "no tests"; aceitável).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: adiciona recharts/jspdf/html2canvas + vitest (test runner)"
```

---

### Task 2: `src/lib/dimensoes.js` — normalização (TDD)

**Files:** Create `src/lib/dimensoes.js`, Test `tests/dimensoes.test.js`

- [ ] **Step 1: Teste que falha** — `tests/dimensoes.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { normalizarDimensoes, mencoesPorDia } from '../src/lib/dimensoes.js';

const RANKING = [
  { id: 'a', votos_2022: 100, seguidores: 0, taxa_engajamento_pct: 2,
    sobreposicao: 0.9, severidade_processual: 0.1, vetor_doadores: 0.5,
    capital_positivo: 0.4, trajetoria_eleitoral: 0.7, nivel_base: 'alta',
    is_mandato_atual: true },
  { id: 'b', votos_2022: 50, seguidores: 0, taxa_engajamento_pct: 6,
    sobreposicao: 0.3, severidade_processual: 0.0, vetor_doadores: 0.2,
    capital_positivo: 0.8, trajetoria_eleitoral: 0.5, nivel_base: 'média',
    is_mandato_atual: false },
  { id: 'c', votos_2022: 0, seguidores: 0, taxa_engajamento_pct: 4,
    sobreposicao: 0.0, severidade_processual: 0.0, vetor_doadores: 0.0,
    capital_positivo: 0.0, trajetoria_eleitoral: 0.1, nivel_base: 'baixa',
    is_mandato_atual: false },
];

describe('normalizarDimensoes', () => {
  const out = normalizarDimensoes(RANKING);

  it('mapeia min-max votos_2022 sobre o conjunto', () => {
    expect(out.a.votos_2022).toBe(1);      // maior
    expect(out.c.votos_2022).toBe(0);      // menor
    expect(out.b.votos_2022).toBeCloseTo(0.5, 5);
  });

  it('max==min vira 0 para todos (seguidores all-zero, sem div/0)', () => {
    expect(out.a.seguidores).toBe(0);
    expect(out.b.seguidores).toBe(0);
    expect(out.c.seguidores).toBe(0);
  });

  it('usa 0..1 nativo direto', () => {
    expect(out.a.sobreposicao).toBe(0.9);
    expect(out.a.trajetoria).toBe(0.7);
    expect(out.b.capital_positivo).toBe(0.8);
  });

  it('mapeia nivel_base categórico', () => {
    expect(out.a.nivel_base).toBe(1.0);
    expect(out.b.nivel_base).toBe(0.5);
    expect(out.c.nivel_base).toBe(0.0);
  });

  it('mandato de booleano', () => {
    expect(out.a.mandato).toBe(1);
    expect(out.b.mandato).toBe(0);
  });

  it('todas as 10 dims presentes e em 0..1', () => {
    const dims = ['votos_2022','seguidores','sobreposicao','nivel_base',
      'engajamento','mandato','severidade','vetor_doadores','capital_positivo','trajetoria'];
    for (const d of dims) {
      expect(out.a[d]).toBeGreaterThanOrEqual(0);
      expect(out.a[d]).toBeLessThanOrEqual(1);
    }
  });
});

describe('mencoesPorDia', () => {
  it('agrega por captured_at e preenche dias vazios com 0', () => {
    const mentions = [
      { captured_at: '2026-06-10' }, { captured_at: '2026-06-10' },
      { captured_at: '2026-06-12' },
    ];
    const serie = mencoesPorDia(mentions);
    const por = Object.fromEntries(serie.map(p => [p.dia, p.n]));
    expect(por['2026-06-10']).toBe(2);
    expect(por['2026-06-11']).toBe(0);   // dia vazio, contíguo
    expect(por['2026-06-12']).toBe(1);
    // janela contígua sem buracos
    expect(serie.length).toBe(3);
  });

  it('lista vazia -> []', () => {
    expect(mencoesPorDia([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar — deve falhar** (`npx vitest run` → "normalizarDimensoes is not a function").

- [ ] **Step 3: Implementar** `src/lib/dimensoes.js`:

```js
// Normalização das 10 dimensões do score para o radar (todas 0..1) e
// série de menções/dia a partir do snapshot atual. Funções PURAS.

const NIVEL_BASE = { alta: 1.0, 'média': 0.5, media: 0.5, baixa: 0.0 };

const DIMS_NATIVAS = {            // campo do ranking -> nome no radar (já 0..1)
  sobreposicao: 'sobreposicao',
  severidade_processual: 'severidade',
  vetor_doadores: 'vetor_doadores',
  capital_positivo: 'capital_positivo',
  trajetoria_eleitoral: 'trajetoria',
};
const DIMS_MINMAX = ['votos_2022', 'seguidores', 'taxa_engajamento_pct'];

function minmax(ranking, campo) {
  const vals = ranking.map(r => Number(r[campo]) || 0);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo;
  // max==min (ex.: seguidores all-zero) -> sem sinal, 0 para todos. Sem div/0.
  return ranking.map(r => span === 0 ? 0 : ((Number(r[campo]) || 0) - lo) / span);
}

export function normalizarDimensoes(ranking) {
  const out = {};
  const mm = {};
  for (const c of DIMS_MINMAX) mm[c] = minmax(ranking, c);
  ranking.forEach((r, i) => {
    const o = {};
    for (const [campo, nome] of Object.entries(DIMS_NATIVAS)) {
      o[nome] = Math.max(0, Math.min(1, Number(r[campo]) || 0));
    }
    o.votos_2022 = mm.votos_2022[i];
    o.seguidores = mm.seguidores[i];
    o.engajamento = mm.taxa_engajamento_pct[i];
    o.nivel_base = NIVEL_BASE[String(r.nivel_base)] ?? 0.5;
    o.mandato = r.is_mandato_atual ? 1 : 0;
    out[r.id] = o;
  });
  return out;
}

export function mencoesPorDia(mentions) {
  if (!mentions || mentions.length === 0) return [];
  const dias = mentions
    .map(m => m.captured_at)
    .filter(Boolean)
    .sort();
  if (dias.length === 0) return [];
  const cont = {};
  for (const d of dias) cont[d] = (cont[d] || 0) + 1;
  // janela contígua do menor ao maior dia
  const ini = new Date(dias[0] + 'T00:00:00Z');
  const fim = new Date(dias[dias.length - 1] + 'T00:00:00Z');
  const serie = [];
  for (let t = ini; t <= fim; t.setUTCDate(t.getUTCDate() + 1)) {
    const iso = t.toISOString().slice(0, 10);
    serie.push({ dia: iso, n: cont[iso] || 0 });
  }
  return serie;
}
```

- [ ] **Step 4: Rodar — deve passar** (`npx vitest run`).

- [ ] **Step 5: Normalizar LF + Commit**

```bash
git add src/lib/dimensoes.js tests/dimensoes.test.js
git commit -m "feat(lib): normalizarDimensoes + mencoesPorDia (puras, testadas)"
```

---

### Task 3: `src/lib/csv.js` — export CSV (TDD)

**Files:** Create `src/lib/csv.js`, Test `tests/csv.test.js`

- [ ] **Step 1: Teste que falha** — `tests/csv.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { toCSV } from '../src/lib/csv.js';

describe('toCSV', () => {
  it('header na 1a linha e linhas na ordem', () => {
    const csv = toCSV([{ a: 1, b: 2 }], ['a', 'b']);
    expect(csv).toBe('a,b\n1,2');
  });
  it('escapa vírgula, aspas e newline', () => {
    const csv = toCSV([{ a: 'x,y', b: 'di"z', c: 'li\nnha' }], ['a', 'b', 'c']);
    expect(csv).toBe('a,b,c\n"x,y","di""z","li\nnha"');
  });
  it('valores ausentes viram vazio', () => {
    const csv = toCSV([{ a: 1 }], ['a', 'b']);
    expect(csv).toBe('a,b\n1,');
  });
});
```

- [ ] **Step 2: Rodar — deve falhar.**

- [ ] **Step 3: Implementar** `src/lib/csv.js`:

```js
// CSV zero-dependência. toCSV é puro/testável; baixarCSV toca o DOM.
function escapar(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(rows, headers) {
  const head = headers.map(escapar).join(',');
  const body = rows.map(r => headers.map(h => escapar(r[h])).join(',')).join('\n');
  return body ? head + '\n' + body : head;
}

export function baixarCSV(nomeArquivo, rows, headers) {
  const conteudo = toCSV(rows, headers);
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Rodar — deve passar.**

- [ ] **Step 5: Normalizar LF + Commit**

```bash
git add src/lib/csv.js tests/csv.test.js
git commit -m "feat(lib): export CSV zero-dep (toCSV testada + baixarCSV)"
```

---

### Task 4: `src/lib/pdf.js` — dossiê PDF

**Files:** Create `src/lib/pdf.js`

> Sem teste unitário (depende de canvas/DOM); verificado no build + manual.

- [ ] **Step 1: Implementar** `src/lib/pdf.js`:

```js
// Dossiê PDF de um nó DOM (a view de Confronto). NÃO usar em mapas Leaflet.
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportarDossie(node, nomeArquivo = 'confronto.pdf') {
  if (!node) return;
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF', useCORS: true });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margem = 8;
  const w = pageW - margem * 2;
  const h = (canvas.height / canvas.width) * w;
  pdf.addImage(img, 'PNG', margem, margem, w, Math.min(h, pageH - margem * 2 - 8));
  const data = new Date().toLocaleDateString('pt-BR');
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(`Gerado em ${data} · Monitor TO Governo 2026 · uso interno`, margem, pageH - 5);
  pdf.save(nomeArquivo);
}
```

- [ ] **Step 2: Build** — `npm run build` deve compilar (imports resolvem).

- [ ] **Step 3: Normalizar LF + Commit**

```bash
git add src/lib/pdf.js
git commit -m "feat(lib): exportarDossie PDF via jspdf+html2canvas"
```

---

### Task 5: `src/panels/ConfrontoPanel.jsx` — painel de comparação

**Files:** Create `src/panels/ConfrontoPanel.jsx`

Recebe `adversariosData` (com `.ranking`) e `advMentionsData` (com `.candidatos`)
por props. Usa `normalizarDimensoes`, `mencoesPorDia`, `exportarDossie`, e os
componentes de `ui.jsx` (`Card`, `Bt`, `Bd`).

- [ ] **Step 1: Implementar** o painel:

```jsx
import { useState, useRef, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { GitCompare, FileDown } from 'lucide-react';
import { Card, Bt, Bd } from '../components/ui.jsx';
import { normalizarDimensoes, mencoesPorDia } from '../lib/dimensoes.js';
import { exportarDossie } from '../lib/pdf.js';

const COR_A = '#0B3D91';   // primary
const COR_B = '#B45309';   // âmbar
const DIM_LABELS = {
  votos_2022: 'Votos 22', seguidores: 'Seguidores', sobreposicao: 'Sobrepos.',
  nivel_base: 'Base', engajamento: 'Engaj.', mandato: 'Mandato',
  severidade: 'Severid.', vetor_doadores: 'Doadores',
  capital_positivo: 'Capital+', trajetoria: 'Trajet.',
};
const DIM_ORDEM = Object.keys(DIM_LABELS);

export default function ConfrontoPanel({ adversariosData, advMentionsData }) {
  const ranking = adversariosData?.ranking || [];
  const ref = useRef(null);
  const [idA, setIdA] = useState(ranking[0]?.id);
  const [idB, setIdB] = useState(ranking[1]?.id);

  const norm = useMemo(() => normalizarDimensoes(ranking), [ranking]);
  const A = ranking.find(r => r.id === idA);
  const B = ranking.find(r => r.id === idB);

  if (!ranking.length) return <Card><p style={{ padding: 24 }}>Sem dados de adversários.</p></Card>;

  const mesmaPessoa = idA === idB;

  const radarData = DIM_ORDEM.map(d => ({
    dim: DIM_LABELS[d],
    A: norm[idA]?.[d] ?? 0,
    B: norm[idB]?.[d] ?? 0,
  }));

  const serieA = mencoesPorDia(advMentionsData?.candidatos?.[idA]?.mentions || []);
  const serieB = mencoesPorDia(advMentionsData?.candidatos?.[idB]?.mentions || []);
  const diasUnion = Array.from(new Set([...serieA, ...serieB].map(p => p.dia))).sort();
  const serie = diasUnion.map(dia => ({
    dia: dia.slice(5),
    A: serieA.find(p => p.dia === dia)?.n ?? 0,
    B: serieB.find(p => p.dia === dia)?.n ?? 0,
  }));

  const linhasDelta = [
    ['Score', A?.score, B?.score],
    ['Votos 2022', A?.votos_2022, B?.votos_2022],
    ['Engajamento %', A?.taxa_engajamento_pct, B?.taxa_engajamento_pct],
    ['Sentimento líq.', A?.sentimento_liquido, B?.sentimento_liquido],
  ];

  const fmt = v => (v === null || v === undefined ? '—' : (typeof v === 'number' ? v.toLocaleString('pt-BR') : v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <GitCompare size={20} color={COR_A} />
        <select value={idA} onChange={e => setIdA(e.target.value)} aria-label="Adversário A">
          {ranking.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
        <span style={{ fontWeight: 600 }}>vs</span>
        <select value={idB} onChange={e => setIdB(e.target.value)} aria-label="Adversário B">
          {ranking.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
        <Bt onClick={() => exportarDossie(ref.current, `confronto_${idA}_${idB}.pdf`)} title="Exportar dossiê PDF">
          <FileDown size={14} /> Dossiê PDF
        </Bt>
      </div>

      {mesmaPessoa && <Card><p style={{ padding: 16 }}>Selecione dois adversários distintos.</p></Card>}

      {!mesmaPessoa && (
        <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Bd color="#fff" bg={COR_A}>{A?.nome} ({A?.partido})</Bd>
            <Bd color="#fff" bg={COR_B}>{B?.nome} ({B?.partido})</Bd>
          </div>

          <Card>
            <h3 style={{ margin: '8px 16px' }}>Perfil de força — 10 dimensões</h3>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 9 }} />
                  <Radar name={A?.nome} dataKey="A" stroke={COR_A} fill={COR_A} fillOpacity={0.25} />
                  <Radar name={B?.nome} dataKey="B" stroke={COR_B} fill={COR_B} fillOpacity={0.25} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '8px 16px' }}>Números (brutos)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Métrica</th>
                <th style={{ textAlign: 'right', padding: 8, color: COR_A }}>{A?.nome}</th>
                <th style={{ textAlign: 'right', padding: 8, color: COR_B }}>{B?.nome}</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Δ (B−A)</th>
              </tr></thead>
              <tbody>
                {linhasDelta.map(([rot, a, b]) => {
                  const delta = (typeof a === 'number' && typeof b === 'number') ? b - a : null;
                  return (
                    <tr key={rot} style={{ borderTop: '1px solid rgba(26,39,68,0.08)' }}>
                      <td style={{ padding: 8 }}>{rot}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{fmt(a)}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{fmt(b)}</td>
                      <td style={{ padding: 8, textAlign: 'right', color: delta > 0 ? '#15803D' : delta < 0 ? '#B91C1C' : '#6B7280' }}>
                        {delta === null ? '—' : (delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : '') + fmt(Math.abs(delta))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card>
            <h3 style={{ margin: '8px 16px' }}>Menções por dia — janela atual</h3>
            <p style={{ margin: '0 16px 8px', fontSize: 12, color: '#6B7280' }}>
              Janela rolante do snapshot atual (sem histórico profundo — ver metodologia).
            </p>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={serie}>
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line name={A?.nome} dataKey="A" stroke={COR_A} dot={false} />
                  <Line name={B?.nome} dataKey="B" stroke={COR_B} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build + lint** — `npm run build && npm run lint` (0 erros).

- [ ] **Step 3: Normalizar LF + Commit**

```bash
git add src/panels/ConfrontoPanel.jsx
git commit -m "feat(confronto): painel lado-a-lado (radar 10d + deltas + menções/dia)"
```

---

### Task 6: Registrar a aba no App

**Files:** Modify `src/App.jsx`

- [ ] **Step 1:** Importar o painel e o ícone no topo:

```jsx
import ConfrontoPanel from './panels/ConfrontoPanel.jsx';
// no import de lucide-react, adicionar GitCompare ao set já importado
```

- [ ] **Step 2:** Adicionar a aba ao array de tabs (após `inteligencia`):

```jsx
{ key: 'confronto', label: 'Confronto', icon: GitCompare },
```

- [ ] **Step 3:** Adicionar o render condicional onde os outros painéis são renderizados (ao lado de `tab === 'inteligencia'`):

```jsx
{tab === 'confronto' && (
  <ConfrontoPanel adversariosData={adversariosData} advMentionsData={advMentionsData} />
)}
```

> Conferir os nomes reais das variáveis de estado no App (`adversariosData`,
> `advMentionsData` conforme linhas 48-49); ajustar se diferirem.

- [ ] **Step 4: Build + lint.**

- [ ] **Step 5: Normalizar LF + Commit**

```bash
git add src/App.jsx
git commit -m "feat(app): registra aba Confronto"
```

---

### Task 7: Botão CSV no ranking (Inteligência Competitiva)

**Files:** Modify `src/panels/InteligenciaCompetitivaPanel.jsx`

- [ ] **Step 1:** Importar `baixarCSV` e um ícone:

```jsx
import { baixarCSV } from '../lib/csv.js';
import { Download } from 'lucide-react';
```

- [ ] **Step 2:** Handler + botão (perto do cabeçalho do ranking):

```jsx
const exportarRanking = () => {
  const headers = ['id','nome','partido','bloco','score','votos_2022',
    'taxa_engajamento_pct','sentimento_liquido','nivel_dinamico'];
  baixarCSV('ranking_adversarios.csv', ranking, headers);
};
// ...
<Bt onClick={exportarRanking} title="Exportar ranking CSV"><Download size={14} /> CSV</Bt>
```

> Usar o nome real da variável do ranking no componente (provável `ranking`
> derivado de `adversariosData.ranking`); conferir antes.

- [ ] **Step 3: Build + lint.**

- [ ] **Step 4: Normalizar LF + Commit**

```bash
git add src/panels/InteligenciaCompetitivaPanel.jsx
git commit -m "feat(inteligencia): export CSV do ranking"
```

---

### Task 8: Botão CSV no Território (modo emenda_roi)

**Files:** Modify `src/panels/TerritorioPanel.jsx`

- [ ] **Step 1:** Importar `baixarCSV` + ícone `Download` (se ainda não importado).

- [ ] **Step 2:** Handler que serializa os municípios do payload emenda_roi:

```jsx
const exportarEmendaCSV = () => {
  const linhas = (eroi?.municipios || []).map(m => ({
    cod_ibge: m.cod_ibge,
    municipio: m.municipio,
    emenda_valor: m.emenda?.valor ?? 0,
    distorcao_ratio: m.distorcao_fiscal?.ratio_receita ?? '',
    valor_eleitoral_rank: m.valor_eleitoral?.rank ?? '',
    leverage_flag: m.leverage?.flag ? 1 : 0,
  }));
  baixarCSV('emenda_roi_municipios.csv', linhas,
    ['cod_ibge','municipio','emenda_valor','distorcao_ratio','valor_eleitoral_rank','leverage_flag']);
};
```

> `eroi` = variável de estado que guarda o payload de `emenda_roi_municipio.json`
> no TerritorioPanel; conferir o nome real e as chaves (`m.emenda.valor`,
> `m.distorcao_fiscal.ratio_receita`, `m.valor_eleitoral.rank`, `m.leverage.flag`)
> contra o JSON e ajustar se diferirem.

- [ ] **Step 3:** Botão visível só no `modo === 'emenda_roi'`:

```jsx
{modo === 'emenda_roi' && (
  <Bt onClick={exportarEmendaCSV} title="Exportar dados de emenda CSV"><Download size={14} /> CSV</Bt>
)}
```

- [ ] **Step 4: Build + lint.**

- [ ] **Step 5: Normalizar LF + Commit**

```bash
git add src/panels/TerritorioPanel.jsx
git commit -m "feat(territorio): export CSV dos municípios (modo emenda_roi)"
```

---

### Task 9: Gate de verificação final

**Files:** nenhum (verificação)

- [ ] **Step 1:** `npx vitest run` — todos os testes passam.
- [ ] **Step 2:** `npm run build` — build limpo.
- [ ] **Step 3:** `npm run lint` — 0 erros.
- [ ] **Step 4:** `npm run dev` + checagem manual rápida: aba Confronto troca A/B, radar e linha renderizam, botões CSV baixam arquivo, dossiê PDF gera. (Se o controlador não puder rodar dev interativo, documentar como verificação manual pendente.)

---

## Ordem e dependências
Task 1 (deps) → 2,3,4 (libs, paralelizáveis em princípio mas sequenciais p/ commits
limpos) → 5 (painel, depende de 2 e 4) → 6 (app, depende de 5) → 7,8 (CSV nos
painéis, dependem de 3) → 9 (gate). Cada task commita de forma independente.
