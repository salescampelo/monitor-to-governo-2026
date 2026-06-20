import { useMemo } from 'react';
import { CalendarClock, BarChart3, AlertCircle } from 'lucide-react';
import { resumoPesquisas } from '../lib/pesquisas.js';
import { CONFIG } from '../lib/config.js';

// Faixa "estado da corrida" (Fase E) — banda enxuta ACIMA da Inteligencia.
// Frame adversary-only: a pesquisa entra como SECAO COMPARATIVA (ranking lado a
// lado), nunca como "numero-heroi" de um candidato proprio. Sem dado divulgado ->
// nao renderiza (no-fabricacao). Lacunas (suspensas sem numero) sao declaradas.
const BAR = '#0B3D91';
const fmtData = (s) => (s ? s.replace(/^(\d{4})-(\d{2})-(\d{2}).*/, '$3/$2/$1') : '—');

export default function EstadoCorridaFaixa({ pesquisasData }) {
  const resumo = useMemo(() => resumoPesquisas(pesquisasData), [pesquisasData]);

  const diasParaEleicao = useMemo(() => {
    const d = Math.ceil((new Date(CONFIG.ELECTION_DATE) - new Date()) / 86400000);
    return d > 0 ? d : 0;
  }, []);

  // Ainda carregando (pesquisasData null) -> não renderiza, p/ não PISCAR a mensagem
  // de lacuna antes do fetch resolver (a11y/UX). Distinto de vazio-confirmado abaixo.
  if (pesquisasData == null) return null;

  // Sem pesquisa divulgada -> some o bloco de pesquisa (não inventa), mas mantém o
  // countdown, que é factual.
  if (!resumo) {
    return (
      <div style={faixa}>
        <span style={chipLabel}><CalendarClock size={14} /> {diasParaEleicao} dias p/ eleição</span>
        <span style={{ color: '#8C93A8', fontSize: 12 }}>Sem pesquisa divulgada sincronizada.</span>
      </div>
    );
  }

  const { ultima, nComNumero, nLacunas, aguardando } = resumo;
  const max = ultima.ranking.reduce((m, r) => Math.max(m, r.percentual), 0) || 100;

  return (
    <div style={{ ...faixa, flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={chipLabel}><CalendarClock size={14} /> {diasParaEleicao} dias p/ eleição</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#1A2744' }}>
          <BarChart3 size={14} style={{ color: BAR }} />
          Última pesquisa divulgada · {ultima.instituto}
        </span>
        <span style={{ fontSize: 11, color: '#6B7280' }}>
          {fmtData(ultima.data_divulgacao)}
          {ultima.entrevistas ? ` · n=${ultima.entrevistas}` : ''}
          {ultima.margem ? ` · ±${ultima.margem}pp` : ''}
          {ultima.protocolo ? ` · ${ultima.protocolo}` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ultima.ranking.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 'clamp(80px, 30%, 150px)', fontSize: 12, fontWeight: 600, color: '#1A2744', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.candidato}</span>
            <div aria-hidden="true" style={{ flex: 1, background: 'rgba(26,39,68,0.06)', borderRadius: 6, height: 16, position: 'relative' }}>
              <div style={{ width: `${(r.percentual / max) * 100}%`, background: i === 0 ? BAR : 'rgba(11,61,145,0.45)', height: '100%', borderRadius: 6 }} />
            </div>
            <span style={{ width: 48, fontSize: 12, fontWeight: 700, color: '#1A2744', fontVariantNumeric: 'tabular-nums' }}>{r.percentual.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6B7280', flexWrap: 'wrap' }}>
        <AlertCircle size={12} style={{ color: '#f59e0b' }} />
        {nComNumero != null && <span>{nComNumero} pesquisas com número</span>}
        {nLacunas > 0 && <span>· {nLacunas} suspensas sem número (lacuna)</span>}
        {aguardando.length > 0 && <span>· {aguardando.length} aguardando divulgação</span>}
        <span style={{ color: '#6B7280' }}>· cenário estimulado; só números divulgados por fonte primária</span>
      </div>
    </div>
  );
}

const faixa = {
  background: 'var(--surface, #fff)', border: '1px solid var(--surface-border, rgba(26,39,68,0.08))',
  borderRadius: 12, padding: '14px 18px', marginBottom: 20,
  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};
const chipLabel = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
  color: '#0B3D91', background: 'rgba(11,61,145,0.08)', padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap',
};
