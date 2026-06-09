import { useEffect, useState, useMemo } from 'react';
import { Radar, AlertTriangle, Scale, TrendingDown, Newspaper } from 'lucide-react';
import { Card, Met, Bd } from '../components/ui.jsx';
import { useWW } from '../lib/ui-helpers.js';
import { fetchJ, URLS } from '../lib/fetch.js';

// Espelha App.jsx / VicesPanel: em DEV não há sessão Supabase, então busca o
// arquivo estático pelo proxy do Vite; em prod passa pelo /api/data autenticado.
const fetchRadar = import.meta.env.DEV
  ? () => fetch('/data/radar_vulnerabilidade.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.radar);

const NIVEL_CFG = {
  critico: { cor: '#DC2626', bg: '#FEE2E2', label: 'Crítico' },
  alerta: { cor: '#A16207', bg: '#FEF3C7', label: 'Alerta' },
};
const nivelCfg = (n) => NIVEL_CFG[n] || { cor: '#64748b', bg: 'rgba(100,116,139,0.12)', label: n || '—' };

const TIPO_CFG = {
  spike_negativo: { icon: Newspaper, label: 'Pico negativo', cor: '#B91C1C' },
  evento_judicial: { icon: Scale, label: 'Evento judicial', cor: '#7C3AED' },
  queda_engajamento: { icon: TrendingDown, label: 'Queda de engajamento', cor: '#0891B2' },
};
const tipoCfg = (t) => TIPO_CFG[t] || { icon: AlertTriangle, label: t || '—', cor: '#64748b' };

function AlertaCard({ a }) {
  const ncfg = nivelCfg(a.nivel);
  const tcfg = tipoCfg(a.tipo);
  const Icon = tcfg.icon;
  return (
    <div
      style={{
        border: '1px solid var(--surface-border)',
        borderLeft: `4px solid ${ncfg.cor}`,
        borderRadius: 8,
        padding: '10px 12px',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Icon size={15} style={{ color: tcfg.cor }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{tcfg.label}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bd color={ncfg.cor} bg={ncfg.bg}>{ncfg.label}</Bd>
          <span style={{ fontSize: 11, fontWeight: 700, color: ncfg.cor, fontFamily: 'var(--font-mono)' }}>
            {Math.round((a.severidade || 0) * 100)}
          </span>
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.evidencia}</p>
      {a.detectado_em && (
        <span style={{ fontSize: 10, color: '#8C93A8' }}>Detectado em {a.detectado_em}</span>
      )}
    </div>
  );
}

export default function RadarPanel() {
  const isMobile = useWW() < 768;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRadar()
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const alertas = useMemo(() => data?.alertas || [], [data]);

  // Agrupa por adversário, preservando a ordem (alertas já vêm por severidade desc).
  const grupos = useMemo(() => {
    const map = new Map();
    alertas.forEach((a) => {
      if (!map.has(a.adversario_id)) {
        map.set(a.adversario_id, { id: a.adversario_id, nome: a.nome, itens: [] });
      }
      map.get(a.adversario_id).itens.push(a);
    });
    return Array.from(map.values());
  }, [alertas]);

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Carregando radar de risco...</div>;
  }

  const resumo = data?.resumo || { total_alertas: 0, criticos: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 12, padding: 10 }}>
              <Radar size={22} style={{ color: '#DC2626' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Radar de Risco — Adversários</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>
                Sinais de vulnerabilidade · oportunidade ofensiva
                {data?._fixture ? ' · DADOS FIXTURE' : ''}
              </p>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Atualizado em {data?.updated_at || '—'}</span>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
        <Met icon={AlertTriangle} label="Alertas" value={resumo.total_alertas} accent="#DC2626" compact={isMobile} />
        <Met icon={AlertTriangle} label="Críticos" value={resumo.criticos} accent="#B91C1C" compact={isMobile} />
        <Met icon={Radar} label="Adversários" value={grupos.length} accent="#0B3D91" compact={isMobile} />
      </div>

      {grupos.length === 0 ? (
        <Card>
          <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Radar size={28} style={{ color: '#8C93A8', marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Nenhuma vulnerabilidade detectada</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Nenhum adversário cruzou os limiares de risco na janela monitorada.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {grupos.map((g) => {
            const temCritico = g.itens.some((a) => a.nivel === 'critico');
            return (
              <Card key={g.id} style={{ borderTop: `3px solid ${temCritico ? '#DC2626' : '#A16207'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <strong style={{ fontSize: 15, color: 'var(--text)' }}>{g.nome}</strong>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {g.itens.length} sinal{g.itens.length > 1 ? 'is' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.itens.map((a, i) => <AlertaCard key={`${a.tipo}-${i}`} a={a} />)}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
