// Explorador de imprensa dos adversários — lógica PURA sobre adversarios_mentions.json.
// Frame adversary-only: o JSON já é por-candidato (8 adversários); aqui só achatamos,
// filtramos e agregamos os campos REAIS do feed (sentimento/escopo/tipo/relevância já
// vêm classificados de gerar_imprensa.py). NUNCA derivamos métrica que a fonte não deu.
// Testável em node (parsing de data RFC-822 via Date).

export const FILTRO_INICIAL = {
  adversario: 'all', fonte: 'all', sentimento: 'all', escopo: 'all', tipo: 'all', relevancia: 'all',
};

const _dia = (published) => {
  const d = new Date(published);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
};
const _ts = (published) => {
  const d = new Date(published);
  return isNaN(d) ? 0 : d.getTime();
};

// candidatos -> lista plana de menções, cada uma marcada com o adversário de origem.
export function achatarMencoes(data) {
  const cands = data?.candidatos || {};
  const out = [];
  for (const [id, c] of Object.entries(cands)) {
    for (const m of (c.mentions || [])) {
      // C9: menção de portal pode não ter `published` — cai p/ captured_at, senão
      // somem do gráfico de volume/dia e vão para o fim da ordenação.
      const quando = m.published || m.captured_at;
      out.push({ ...m, adversario_id: id, adversario_nome: c.nome || id, dia: _dia(quando), ts: _ts(quando) });
    }
  }
  return out;
}

// Filtro multi-eixo + ordenação por data (mais recente primeiro).
export function aplicarFiltros(mencoes, f = FILTRO_INICIAL) {
  return (mencoes || [])
    .filter(m =>
      (f.adversario === 'all' || m.adversario_id === f.adversario) &&
      (f.fonte === 'all' || m.source === f.fonte) &&
      (f.sentimento === 'all' || m.sentimento === f.sentimento) &&
      (f.escopo === 'all' || m.escopo === f.escopo) &&
      (f.tipo === 'all' || m.tipo === f.tipo) &&
      // C6: respeita o valor real de f.relevancia em vez de hardcodar 'DIRETA' —
      // evita bomba-relógio quando um novo valor de filtro for adicionado.
      (f.relevancia === 'all' || (f.relevancia === 'direta' && String(m.relevancia_rotulo || '').toUpperCase() === 'DIRETA')))
    .sort((a, b) => b.ts - a.ts);
}

// Contagem por veículo (desc).
export function contagemPorFonte(mencoes) {
  const c = new Map();
  for (const m of (mencoes || [])) c.set(m.source || '—', (c.get(m.source || '—') || 0) + 1);
  return [...c.entries()].map(([fonte, n]) => ({ fonte, n })).sort((a, b) => b.n - a.n);
}

// Volume de menções por dia (asc) — série para mini-barras. Só dias com data válida.
export function volumePorDia(mencoes) {
  const c = new Map();
  for (const m of (mencoes || [])) if (m.dia) c.set(m.dia, (c.get(m.dia) || 0) + 1);
  return [...c.entries()].map(([dia, n]) => ({ dia, n })).sort((a, b) => a.dia.localeCompare(b.dia));
}

// Opções distintas p/ os seletores (adversários nomeados; fontes/tipos/escopos ordenados).
export function opcoesDeFiltro(mencoes) {
  const advs = new Map(), fontes = new Set(), tipos = new Set(), escopos = new Set();
  for (const m of (mencoes || [])) {
    if (m.adversario_id) advs.set(m.adversario_id, m.adversario_nome);
    if (m.source) fontes.add(m.source);
    if (m.tipo) tipos.add(m.tipo);
    if (m.escopo) escopos.add(m.escopo);
  }
  return {
    adversarios: [...advs.entries()].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
    fontes: [...fontes].sort(),
    tipos: [...tipos].sort(),
    escopos: [...escopos].sort(),
  };
}
