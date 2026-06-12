---
data: 2026-06-12
projeto: Monitor TO Governo 2026 — polish de frontend (Fase 2, pós-Slice C)
tipo: design / spec
status: vigente
escopo: PII-free (lê só public/data/*.json já sancionados)
---

# Design — Polish de frontend: Confronto + Export

Bundle de polish do dashboard adversary-only, pós-Slices A/B/C. Três entregas
coerentes sobre os dados **já publicados** em `public/data/` — nenhuma coleta
nova, nenhuma fonte nova.

## Decisões (aprovadas 2026-06-12)
- **Gráficos:** adicionar `recharts` (radar de 10 dims + line chart). Única
  dependência nova; o codebase não tinha lib de chart (só sparkline SVG caseiro).
- **Export:** CSV (zero-dep, Blob nativo) no ranking e nos dados municipais +
  **dossiê PDF** (jspdf + html2canvas) só da view de Confronto.
- **PWA:** **fora de escopo.** Dado é auth-gated e muda; service-worker pode
  servir inteligência obsoleta — risco ativo num monitor ao vivo. Documentado
  como adiado (ver §6).

## Princípios herdados (não-negociáveis)
- **Adversary-only / no-fabricação.** Só renderiza o que está no dado. Onde o
  dado não sustenta a ambição, **documenta a lacuna** em vez de inventar.
- **LGPD.** Lê exclusivamente `public/data/*.json` via `/api/data/[file].js`
  (allowlist). Nenhum dado nominal novo.
- **Estilo do codebase.** Inline styles + CSS-vars de `src/components/ui.jsx`
  (`Card`, `Met`, `Bd`, `Bt`, `PanelSkeleton`). Sem Tailwind. Sem CSS modules.

---

## 1. Confronto (deep-dive lado-a-lado) — entrega núcleo

**Nova aba** no shell (`src/App.jsx`, array de tabs linhas 126-131):
`{ key: 'confronto', label: 'Confronto', icon: GitCompare }` (ícone lucide-react),
renderizada por `tab === 'confronto'` → `<ConfrontoPanel adversariosData={...} advMentionsData={...} />`.
O App **já** carrega `adversarios.json` e `adversarios_mentions.json` e passa
ambos para baixo (linhas 48-49) — o painel recebe por props, não refaz fetch.

**Fonte de dados:** `adversarios.json` (`ranking[]`, 7 itens) + `adversarios_mentions.json`
(`candidatos{ id: { mentions[] } }`).

**UI — três blocos, dois adversários A e B selecionados:**

### 1a. Seletor
Dois `<select>` (A e B) populados de `ranking[].nome`/`id`. Default: top-2 do
ranking (índices 0 e 1). Trocar A ou B re-renderiza tudo. Guard: se A === B,
mostrar aviso e não renderizar comparação.

### 1b. Radar de 10 dimensões (recharts `RadarChart`)
As 10 dimensões do score (mesmas de `confidence_dims`): votos_2022, seguidores,
sobreposicao, nivel_base, engajamento, mandato, severidade, vetor_doadores,
capital_positivo, trajetoria.

Normalização para o radar (todas em 0..1, comparável):
- **Já 0..1 nativo** (usar direto): `sobreposicao`, `severidade_processual`,
  `vetor_doadores`, `capital_positivo`, `trajetoria_eleitoral`.
- **Normalizar client-side por min-max sobre os 7 do ranking:** `votos_2022`,
  `seguidores`, `taxa_engajamento_pct`. (Min-max é aceitável aqui: conjunto
  pequeno e fechado de 7, sem outlier-municipal como na Slice C.)
- **Derivados:** `nivel_base` (categórico real no dado: `alta`/`média`/`baixa`
  → mapa fixo {alta:1.0, média:0.5, baixa:0.0}; default 0.5 se ausente/outro);
  `mandato` = `is_mandato_atual ? 1 : 0`.
- **Guarda min-max:** quando `max === min` na dimensão (ex.: hoje `seguidores`
  é **0 em todos os 7** — IG não coletado / Apify off), retornar 0 para todos
  (sem sinal), nunca dividir por zero.
Duas séries no radar (A azul `--primary` #0B3D91, B âmbar #B45309), legenda,
tooltip por dimensão.

> Função pura `normalizarDimensoes(ranking)` → `{ id: { votos_2022, seguidores,
> ... , trajetoria } }` (todos 0..1). **Testável isoladamente** (ver plano).

### 1c. Tabela de deltas
Linhas: score final, votos_2022 (bruto), taxa_engajamento_pct, seguidores,
sentimento_liquido. Colunas: A | B | Δ (B−A, com seta ▲/▼ e cor). Valores brutos
(não normalizados) — a tabela é o "número real", o radar é a forma.

### 1d. Menções/dia (janela atual) — "séries comparativas" honesto
> **Lacuna documentada:** não há rollup histórico diário por adversário nos
> dados. `adversarios_mentions.json` traz só o snapshot atual (lista de matérias
> com `published`/`captured_at`, janela rolante ~7-14 dias). Logo a "série" é
> derivada client-side bucketando `mentions[].captured_at` por dia, na janela
> que o snapshot cobre — **não** uma série longa. Histórico profundo exige um
> rollup diário persistido no scraper (trabalho de dado futuro — §6).

recharts `LineChart`: eixo X = dias da janela; duas linhas (A, B) = contagem de
menções/dia. Abaixo, dois mini-badges de saldo de sentimento (Positivo−Negativo)
de cada um na janela. Função pura `mencoesPorDia(mentionsList)` → `[{dia, n}]`.

---

## 2. Export

### 2a. CSV (zero-dep)
Helper `src/lib/csv.js`: `toCSV(rows, headers)` → string (escapa `"`, `,`, `\n`);
`baixarCSV(nome, conteudo)` → Blob `text/csv;charset=utf-8` + `URL.createObjectURL`
+ `<a download>` sintético. Sem libs.

Botões "Exportar CSV":
- **Ranking** (InteligenciaCompetitivaPanel): id, nome, partido, bloco, score,
  votos_2022, taxa_engajamento_pct, sentimento_liquido, nivel_dinamico.
- **Município/emenda** (TerritorioPanel, modo emenda_roi): cod_ibge, municipio,
  emenda_valor, distorcao_ratio, valor_eleitoral_rank, leverage_flag.

### 2b. Dossiê PDF (jspdf + html2canvas)
Helper `src/lib/pdf.js`: `exportarDossie(nodeRef, nomeArquivo)` →
`html2canvas(node)` → imagem → `jsPDF` A4 retrato, 1 página (escala p/ largura),
rodapé "Gerado em <data> · Monitor TO Governo 2026 · uso interno". Botão
"Exportar dossiê PDF" no topo do ConfrontoPanel, mira o `ref` do bloco de
comparação (radar + tabela + série). **Não** mira mapas Leaflet (html2canvas +
Leaflet = tiles quebrados).

---

## 3. Dependências novas
`package.json`: `recharts ^2`, `jspdf ^2`, `html2canvas ^1`. `npm install`,
commitar `package-lock.json`. Verificar `npm run build` + `npm run lint` (0 erros
é o padrão do repo).

## 4. Arquivos
- **Criar:** `src/panels/ConfrontoPanel.jsx`, `src/lib/csv.js`, `src/lib/pdf.js`,
  `src/lib/dimensoes.js` (normalizarDimensoes + mencoesPorDia, puras p/ teste),
  `tests/dimensoes.test.js`, `tests/csv.test.js`.
- **Modificar:** `src/App.jsx` (registrar aba + render), `src/panels/InteligenciaCompetitivaPanel.jsx`
  (botão CSV ranking + line chart menções multi-adversário opcional),
  `src/panels/TerritorioPanel.jsx` (botão CSV emenda no modo emenda_roi).

## 5. Testes
**O monitor não tem runner de teste hoje** (gate = `build` + `lint`). Adicionar
**vitest** escopado **só às funções puras** — proporcional, trivial sobre o Vite
existente, e essas funções têm os edge-cases que mordem (div-por-zero, datas,
escape). Setup: devDep `vitest`, script `"test": "vitest run"`, config mínima
(vitest lê o `vite.config.js` existente). Teste de render de componente fica de
fora (convenção do repo).

Casos:
- `normalizarDimensoes`: saída 0..1; min-max sobre os 7; categóricos mapeados
  (alta/média/baixa); **max==min → 0 para todos** (caso `seguidores`);
  `mandato` de booleano.
- `mencoesPorDia`: bucket por `captura_at`/dia correto; dias sem menção = 0;
  janela contígua (sem buracos).
- `toCSV`: escape de vírgula, aspas (duplicação `""`) e newline; header na 1ª linha.

## 6. Lacunas e adiados (document-the-gap)
- **Série histórica de menções:** inexistente nos dados; só janela atual. Para
  série longa real, persistir rollup diário no scraper (`monitor_adversarios.py`
  gravando contagem/dia por adversário num JSON acumulado). **Não** simular.
- **PWA:** adiado (cache vs. dado vivo auth-gated). Reavaliar se houver demanda
  de uso offline em campo, com estratégia network-first explícita.
- **PDF de mapas:** fora — html2canvas não captura tiles Leaflet de forma
  confiável. Dossiê PDF cobre só Confronto (sem mapa).
