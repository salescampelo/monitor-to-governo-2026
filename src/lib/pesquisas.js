// Leitura da serie curada de pesquisas (pesquisas_serie_governador.json).
// Funcoes PURAS p/ a faixa "estado da corrida" — testaveis em node, honram
// no-fabricacao (so pontos COM percentual divulgado entram; lacunas ficam de fora
// do ranking e sao contadas a parte). NUNCA derivam numero que a fonte nao deu.

// Agrupa os pontos por protocolo e devolve a pesquisa divulgada MAIS RECENTE,
// com o ranking de candidatos (desc). null se nao ha ponto com numero.
export function pesquisaMaisRecente(serie) {
  const validos = (serie || []).filter(
    p => p && typeof p.percentual === 'number' && p.data_divulgacao,
  );
  if (!validos.length) return null;

  const porProtocolo = new Map();
  for (const p of validos) {
    const k = p.protocolo || `${p.instituto}-${p.data_divulgacao}`;
    if (!porProtocolo.has(k)) porProtocolo.set(k, []);
    porProtocolo.get(k).push(p);
  }

  let melhor = null;
  for (const pontos of porProtocolo.values()) {
    const dataDiv = pontos.reduce((mx, p) => (p.data_divulgacao > mx ? p.data_divulgacao : mx), '');
    if (!melhor || dataDiv > melhor.dataDiv) melhor = { dataDiv, pontos };
  }
  if (!melhor) return null;

  const ref = melhor.pontos[0];
  const ranking = melhor.pontos
    .map(p => ({ candidato: p.candidato, percentual: p.percentual }))
    .sort((a, b) => b.percentual - a.percentual);

  return {
    protocolo: ref.protocolo || null,
    instituto: ref.instituto || '—',
    data_divulgacao: melhor.dataDiv,
    data_termino: ref.data_termino || null,
    entrevistas: ref.entrevistas ?? null,
    margem: ref.margem ?? null,
    cenario: ref.cenario || null,
    tipo: ref.tipo || null,
    fonte: ref.fonte || null,
    ranking,
  };
}

// Resumo p/ a faixa: ultima pesquisa + contagens (com numero / lacunas / aguardando).
export function resumoPesquisas(serieData) {
  if (!serieData || !Array.isArray(serieData.serie)) return null;
  const ultima = pesquisaMaisRecente(serieData.serie);
  if (!ultima) return null;
  return {
    ultima,
    nComNumero: serieData.n_pesquisas_com_numero ?? null,
    nLacunas: Array.isArray(serieData.lacunas_suspensas_sem_numero)
      ? serieData.lacunas_suspensas_sem_numero.length : 0,
    aguardando: Array.isArray(serieData.aguardando) ? serieData.aguardando : [],
    geradoEm: serieData.gerado_em || null,
  };
}
