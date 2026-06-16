// Transforms PUROS do histórico diário -> formatos recharts. Espelha dimensoes.js.

const PALETA = ['#0B3D91', '#B45309', '#15803d', '#b91c1c', '#7c3aed', '#0891b2', '#a16207', '#db2777'];

// Lista mestra de candidatos: usa o score do DIA MAIS RECENTE em que cada id aparece,
// ordena por score desc (define ordem de cor estável + ordem da legenda).
export function candidatosDoHistorico(series) {
  const ultimo = {};
  for (const r of series) {
    if (!ultimo[r.id] || r.data > ultimo[r.id].data) {
      ultimo[r.id] = {
        id: r.id, nome: r.nome, partido: r.partido,
        data: r.data, ultimoScore: Number(r.score) || 0,
      };
    }
  }
  // Ordena pelo DIA mais recente primeiro (quem aparece no dia mais novo vem antes),
  // e dentro do mesmo dia por score desc.
  return Object.values(ultimo).sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? 1 : -1;
    return b.ultimoScore - a.ultimoScore;
  });
}

export function coresPorCandidato(candidatos) {
  const out = {};
  candidatos.forEach((c, i) => { out[c.id] = PALETA[i % PALETA.length]; });
  return out;
}

export function dominioPosicao(candidatos) {
  return [1, Math.max(1, candidatos.length)];
}

// Pivot longo->largo, 1 linha por dia. Separa por origem em chaves <id>__bf / <id>__live
// (para desenhar 2 <Line>: tracejada=backfill, sólida=live). No 1º dia 'live' após um
// dia 'backfill', duplica o valor em __bf para os segmentos se juntarem visualmente.
// (cand,dia) ausente -> chave ausente -> undefined -> recharts quebra a linha (gap honesto).
export function pivotMetrica(series, metrica, idsVisiveis) {
  const vis = new Set(idsVisiveis);
  const dias = Array.from(new Set(series.map(r => r.data))).sort();
  const rowByDay = {};
  for (const d of dias) rowByDay[d] = { data: d };

  for (const id of vis) {
    const pts = series
      .filter(r => r.id === id)
      .map(r => ({ data: r.data, val: Number(r[metrica]), origem: r.origem }))
      .filter(p => Number.isFinite(p.val))
      .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

    let prevOrigem = null;
    for (const p of pts) {
      const bfKey = `${id}__bf`;
      const liveKey = `${id}__live`;
      if (p.origem === 'backfill') {
        rowByDay[p.data][bfKey] = p.val;
      } else {
        rowByDay[p.data][liveKey] = p.val;
        if (prevOrigem === 'backfill') rowByDay[p.data][bfKey] = p.val; // fronteira
      }
      prevOrigem = p.origem;
    }
  }
  return dias.map(d => rowByDay[d]);
}
