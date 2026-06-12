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
