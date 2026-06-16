import { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card } from '../components/ui.jsx';
import { fetchJ, URLS } from '../lib/fetch.js';
import {
  candidatosDoHistorico, coresPorCandidato, dominioPosicao, pivotMetrica,
} from '../lib/historico.js';

const fetchHist = import.meta.env.DEV
  ? () => fetch('/data/historico.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.historico);

const METRICAS = [
  { key: 'posicao', label: 'Posição', invert: true },
  { key: 'score', label: 'Score' },
  { key: 'seguidores', label: 'Seguidores' },
  { key: 'sentimento_liquido', label: 'Sentimento', zeroRef: true },
];

export default function TendenciasPanel() {
  const [hist, setHist] = useState(undefined);   // undefined=carregando, null=erro
  const [metrica, setMetrica] = useState('posicao');
  const [desativados, setDesativados] = useState(() => new Set());

  useEffect(() => {
    let vivo = true;
    fetchHist().then(d => { if (vivo) setHist(d); });
    return () => { vivo = false; };
  }, []);

  const series = useMemo(() => hist?.series || [], [hist]);
  const candidatos = useMemo(() => candidatosDoHistorico(series), [series]);
  const cores = useMemo(() => coresPorCandidato(candidatos), [candidatos]);
  const idsVisiveis = useMemo(
    () => candidatos.map(c => c.id).filter(id => !desativados.has(id)),
    [candidatos, desativados],
  );
  const dados = useMemo(
    () => pivotMetrica(series, metrica, idsVisiveis),
    [series, metrica, idsVisiveis],
  );

  if (hist === undefined) {
    return <Card><p style={{ padding: 24 }}>Carregando histórico…</p></Card>;
  }
  if (hist === null) {
    return <Card><p style={{ padding: 24 }}>Histórico indisponível.</p></Card>;
  }
  const diasDistintos = new Set(series.map(r => r.data)).size;
  if (diasDistintos < 2) {
    return (
      <Card><p style={{ padding: 24 }}>
        Série ainda curta — aguarde mais coletas para ver tendências.
      </p></Card>
    );
  }

  const metaAtiva = METRICAS.find(m => m.key === metrica);
  const toggle = (id) => setDesativados(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <TrendingUp size={20} color="#0B3D91" />
        {METRICAS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetrica(m.key)}
            style={{
              padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              border: metrica === m.key ? '1.5px solid #0B3D91' : '1.5px solid rgba(26,39,68,0.15)',
              background: metrica === m.key ? 'rgba(11,61,145,0.1)' : 'rgba(26,39,68,0.04)',
              color: metrica === m.key ? '#0B3D91' : '#5A6478',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Legenda clicável — liga/desliga candidato */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {candidatos.map(c => {
          const off = desativados.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: 14, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid rgba(26,39,68,0.15)',
                background: off ? 'transparent' : 'rgba(26,39,68,0.04)',
                color: off ? '#9ca3af' : '#1A2744', opacity: off ? 0.55 : 1,
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: 2,
                background: off ? '#cbd5e1' : cores[c.id],
              }} />
              {c.nome}{c.partido ? ` (${c.partido})` : ''}
            </button>
          );
        })}
      </div>

      <Card>
        <h3 style={{ margin: '8px 16px' }}>{metaAtiva.label} ao longo do tempo</h3>
        <div style={{ width: '100%', height: 380 }}>
          <ResponsiveContainer>
            <LineChart data={dados} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <XAxis dataKey="data" tickFormatter={d => (d || '').slice(5)} tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                reversed={!!metaAtiva.invert}
                domain={metaAtiva.invert ? dominioPosicao(candidatos) : ['auto', 'auto']}
                allowDecimals={!metaAtiva.invert}
              />
              {metaAtiva.zeroRef && <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />}
              <Tooltip />
              <Legend />
              {idsVisiveis.map(id => {
                const nome = candidatos.find(c => c.id === id)?.nome || id;
                return [
                  <Line
                    key={`${id}-live`} name={nome} dataKey={`${id}__live`}
                    stroke={cores[id]} dot={false} connectNulls={false} strokeWidth={2}
                  />,
                  <Line
                    key={`${id}-bf`} dataKey={`${id}__bf`} legendType="none"
                    stroke={cores[id]} dot={false} connectNulls={false}
                    strokeDasharray="4 3" strokeWidth={2} strokeOpacity={0.7}
                  />,
                ];
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p style={{ margin: '0 16px 12px', fontSize: 12, color: '#6B7280' }}>
          Linha tracejada = dias reconstruídos (backfill); sólida = coletados ao vivo.
          Quebras na linha = dias sem coleta (sem preenchimento). Dias reconstruídos
          podem refletir uma fórmula de score anterior (descontinuidade metodológica).
        </p>
      </Card>
    </div>
  );
}
