import { useEffect, useState, useMemo } from 'react';
import { ShieldCheck, Gauge, Database, AlertCircle } from 'lucide-react';
import { Card, Met, Bd } from '../components/ui.jsx';
import { useWW } from '../lib/ui-helpers.js';
import { fetchJ, URLS } from '../lib/fetch.js';

// Mesma estratégia de RadarPanel: em DEV busca o estático pelo proxy do Vite;
// em prod passa pelo /api/data autenticado.
const dev = import.meta.env.DEV;
const fetchQuality = dev
  ? () => fetch('/data/data_quality.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.dataQuality);
const fetchVetores = dev
  ? () => fetch('/data/vetores_processuais.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.vetores);

const DIM_LABEL = {
  votos_2022: 'Votos 2022', seguidores: 'Seguidores', sobreposicao: 'Sobreposição',
  nivel_base: 'Nível base', engajamento: 'Engajamento', mandato: 'Mandato',
  severidade: 'Severidade proc.', vetor_doadores: 'Vetor doadores',
  capital_positivo: 'Capital positivo', trajetoria: 'Trajetória',
};

const covColor = (pct, tipo) => {
  if (tipo === 'risco') return '#0B3D91';           // determinada; 0 = limpo
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#eab308';
  return '#ef4444';
};

const confColor = (c) => (c >= 0.75 ? '#22c55e' : c >= 0.5 ? '#eab308' : '#ef4444');

function DimRow({ d }) {
  const pct = d.cobertura_pct ?? 0;
  const cor = covColor(pct, d.tipo);
  const risco = d.tipo === 'risco';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span style={{ width: 130, fontSize: 12, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
        {DIM_LABEL[d.dim] || d.dim}
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}> · {Math.round(d.peso * 100)}%</span>
      </span>
      <div style={{ flex: 1, height: 8, background: 'rgba(120,130,150,0.15)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${risco ? 100 : pct}%`, height: '100%', background: cor, opacity: risco ? 0.45 : 1 }} />
      </div>
      <span style={{ width: 96, textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        {risco ? '0 = limpo' : `${pct.toFixed(0)}% c/ sinal`}
      </span>
    </div>
  );
}

export default function CoberturaPanel() {
  const isMobile = useWW() < 768;
  const [q, setQ] = useState(null);
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchQuality(), fetchVetores()])
      .then(([quality, vetores]) => { setQ(quality); setVet(vetores); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const dims = useMemo(() => q?.dimensoes || [], [q]);
  const cands = useMemo(() => q?.por_candidato || [], [q]);

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Carregando cobertura de dado...</div>;
  }
  if (!q) {
    return (
      <Card>
        <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Database size={28} style={{ color: '#8C93A8', marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Sem dados de cobertura ainda</p>
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>data_quality.json é gerado após a primeira rodada do pipeline.</p>
        </div>
      </Card>
    );
  }

  const confMedia = q.confidence_media ?? 0;
  const fmtV = (x) => (x === null || x === undefined ? '—' : Number(x).toFixed(2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(11,61,145,0.08)', border: '1px solid rgba(11,61,145,0.15)', borderRadius: 12, padding: 10 }}>
              <ShieldCheck size={22} style={{ color: '#0B3D91' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Cobertura de Dado & Vetores</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>
                Transparência metodológica · o que o score sabe e o que não sabe
              </p>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Atualizado em {q.updated_at || '—'}</span>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
        <Met icon={Gauge} label="Confiança média" value={fmtV(confMedia)} accent={confColor(confMedia)} compact={isMobile} />
        <Met icon={Database} label="Candidatos" value={q.n_candidatos ?? 0} accent="#0B3D91" compact={isMobile} />
        <Met icon={AlertCircle} label="Dim. mais fraca" value={DIM_LABEL[q.dimensao_valor_mais_fraca] || '—'} accent="#A16207" compact={isMobile} />
      </div>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Cobertura por dimensão</h3>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
          % de candidatos com sinal real na dimensão. Dimensões de risco (severidade, doadores) são
          sempre determinadas — <strong>0 significa “limpo / sem sanção”, não dado ausente</strong>.
        </p>
        <div>{dims.map((d) => <DimRow key={d.dim} d={d} />)}</div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>
          Por candidato — confiança e vetores computados
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '6px 8px' }}>Candidato</th>
                <th style={{ padding: '6px 8px' }}>Confiança</th>
                <th style={{ padding: '6px 8px' }}>Sobrep.</th>
                <th style={{ padding: '6px 8px' }}>Trajet.</th>
                <th style={{ padding: '6px 8px' }}>Cap. pos.</th>
                <th style={{ padding: '6px 8px' }}>Dimensões fracas</th>
              </tr>
            </thead>
            <tbody>
              {cands.map((c) => {
                const v = (vet && vet[c.id]) || {};
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--text)' }}>{c.nome}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <Bd color={confColor(c.confidence ?? 0)} bg="rgba(120,130,150,0.12)">{fmtV(c.confidence)}</Bd>
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtV(v.sobreposicao)}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtV(v.trajetoria_eleitoral)}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtV(v.capital_positivo)}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                      {c.dims_fracas?.length
                        ? c.dims_fracas.map((d) => DIM_LABEL[d] || d).join(', ')
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {vet?.gerado_em && (
          <p style={{ fontSize: 10, color: '#8C93A8', margin: '8px 0 0' }}>
            Vetores computados em {String(vet.gerado_em).slice(0, 10)} (estruturais — atualizam quando o hub63 muda).
          </p>
        )}
      </Card>
    </div>
  );
}
