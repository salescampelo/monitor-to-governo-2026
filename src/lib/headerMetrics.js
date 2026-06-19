// Metricas agregadas do cabecalho — funcao PURA (now injetavel) p/ ser testavel
// em node e p/ travar a regra no-fabricacao. Substitui o calculo inline do App.jsx.
//
// Frame adversary-only:
//  - NAO ha candidato proprio -> nada de "engajamento medio" (agregado orfao).
//    No lugar: "adversario em alta" = quem teve mais mencoes novas nesta rodada.
//  - `radar_vulnerabilidade.json` detecta vulnerabilidades DOS ADVERSARIOS. O count
//    de criticas e descritivo (nao alarme do candidato): vem de resumo.criticos.
//  - Ausencia de medicao -> null (o header renderiza "—"), JAMAIS 0 fabricado.

const MS_48H = 48 * 60 * 60 * 1000;

// Adversario com mais mencoes novas na ultima rodada de coleta (sinal de surto).
// Empate: mantem o primeiro encontrado. Sem dado -> null.
export function adversarioEmAlta(advMentionsData) {
  const cands = advMentionsData?.candidatos;
  if (!cands || typeof cands !== 'object') return null;
  let melhor = null;
  for (const c of Object.values(cands)) {
    const novos = Number(c?.new_this_run) || 0;
    if (novos > 0 && (!melhor || novos > melhor.novos)) {
      melhor = { nome: c.nome || '—', novos };
    }
  }
  return melhor;
}

// Mencoes de imprensa nas ultimas 48h, somadas entre todos os adversarios.
export function imprensa48h(advMentionsData, now = new Date()) {
  const cands = advMentionsData?.candidatos;
  if (!cands || typeof cands !== 'object') return 0;
  const cutoff = now.getTime() - MS_48H;
  let total = 0;
  for (const c of Object.values(cands)) {
    for (const m of (c?.mentions || [])) {
      const ts = m?.captured_at ? new Date(m.captured_at).getTime() : NaN;
      if (!Number.isNaN(ts) && ts >= cutoff) total++;
    }
  }
  return total;
}

// Vulnerabilidades criticas detectadas no radar. null = nao medido (sem feed).
export function vulnerabsCriticas(radarData) {
  const n = radarData?.resumo?.criticos;
  return typeof n === 'number' ? n : null;
}

export function computeHeaderMetrics(adversariosData, advMentionsData, radarData, now = new Date()) {
  const ranking = adversariosData?.ranking || [];
  return {
    totalCandidatos: ranking.length || 0,
    adversarioEmAlta: adversarioEmAlta(advMentionsData),
    imprensa48h: imprensa48h(advMentionsData, now),
    vulnerabsCriticas: vulnerabsCriticas(radarData),
  };
}
