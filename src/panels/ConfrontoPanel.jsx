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
  const ranking = useMemo(() => adversariosData?.ranking || [], [adversariosData]);
  const ref = useRef(null);
  // Guarda só a ESCOLHA do usuário; o id efetivo é derivado no render. O painel
  // é lazy e pode montar antes do fetch — derivar (em vez de sincronizar via
  // effect) garante que idA/idB sempre refletem o ranking atual, sem estado obsoleto.
  const [selA, setSelA] = useState(null);
  const [selB, setSelB] = useState(null);

  const norm = useMemo(() => normalizarDimensoes(ranking), [ranking]);

  if (!ranking.length) {
    return <Card><p style={{ padding: 24 }}>Sem dados de adversários.</p></Card>;
  }

  const idA = ranking.some(r => r.id === selA) ? selA : ranking[0]?.id;
  const idB = ranking.some(r => r.id === selB) ? selB : (ranking[1]?.id ?? ranking[0]?.id);
  const A = ranking.find(r => r.id === idA);
  const B = ranking.find(r => r.id === idB);
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
    dia,                                  // ISO completo (ordena certo); rótulo via tickFormatter
    A: serieA.find(p => p.dia === dia)?.n ?? 0,
    B: serieB.find(p => p.dia === dia)?.n ?? 0,
  }));

  const linhasDelta = [
    ['Score', A?.score, B?.score],
    ['Votos 2022', A?.votos_2022, B?.votos_2022],
    ['Engajamento %', A?.taxa_engajamento_pct, B?.taxa_engajamento_pct],
    ['Sentimento líq.', A?.sentimento_liquido, B?.sentimento_liquido],
  ];

  const fmt = v => (v === null || v === undefined
    ? '—'
    : (typeof v === 'number' ? v.toLocaleString('pt-BR') : v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <GitCompare size={20} color={COR_A} />
        <select value={idA} onChange={e => setSelA(e.target.value)} aria-label="Adversário A">
          {ranking.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
        <span style={{ fontWeight: 600 }}>vs</span>
        <select value={idB} onChange={e => setSelB(e.target.value)} aria-label="Adversário B">
          {ranking.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
        <Bt onClick={() => exportarDossie(ref.current, `confronto_${idA}_${idB}.pdf`)} title="Exportar dossiê PDF">
          <FileDown size={14} /> Dossiê PDF
        </Bt>
      </div>

      {mesmaPessoa && (
        <Card><p style={{ padding: 16 }}>Selecione dois adversários distintos.</p></Card>
      )}

      {!mesmaPessoa && (
        <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Bd color="#fff" bg={COR_A}>{A?.nome ?? '—'}{A?.partido ? ` (${A.partido})` : ''}</Bd>
            <Bd color="#fff" bg={COR_B}>{B?.nome ?? '—'}{B?.partido ? ` (${B.partido})` : ''}</Bd>
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
                  const cor = delta > 0 ? '#15803D' : delta < 0 ? '#B91C1C' : '#6B7280';
                  return (
                    <tr key={rot} style={{ borderTop: '1px solid rgba(26,39,68,0.08)' }}>
                      <td style={{ padding: 8 }}>{rot}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{fmt(a)}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{fmt(b)}</td>
                      <td style={{ padding: 8, textAlign: 'right', color: cor }}>
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
                  <XAxis dataKey="dia" tickFormatter={d => (d || '').slice(5)} tick={{ fontSize: 11 }} />
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
