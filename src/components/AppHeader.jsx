import { RefreshCw, LogOut, Calendar, Users, TrendingUp, Newspaper, ShieldAlert, Clock, Zap, ZapOff } from 'lucide-react';

const getKpiColor = (type, value) => {
  switch (type) {
    case 'dias':
      if (value > 120) return '#22c55e';
      if (value > 60)  return '#eab308';
      return '#ef4444';
    case 'imprensa':
      if (value >= 10) return '#22c55e';
      if (value >= 3)  return '#eab308';
      return 'rgba(255,255,255,0.5)';
    default: return '#FFFFFF';
  }
};

// Idade da ultima coleta -> cor do chip. Verde <=12h, ambar >12h, vermelho >24h.
// null = sem timestamp -> cinza ("—"), nunca um "0h" fabricado.
const ageColor = (h) => {
  if (h == null) return 'rgba(255,255,255,0.5)';
  if (h > 24) return '#ef4444';
  if (h > 12) return '#f59e0b';
  return '#22c55e';
};

// Nome curto p/ caber no rotulo do chip (10px). Mantem o primeiro nome de campanha.
const nomeCurto = (nome) => {
  if (!nome) return '';
  return nome.length > 16 ? `${nome.slice(0, 15)}…` : nome;
};

const KpiChip = ({ icon: I, value, label, color, compact }) => (
  <div style={{
    background: 'rgba(255,255,255,0.08)', borderRadius: 10,
    padding: compact ? '8px 12px' : '14px 18px', textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
    ...(compact ? { minWidth: 100, flexShrink: 0 } : { minWidth: 80, flex: '1 1 80px', maxWidth: 140 }),
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
      <I size={compact ? 12 : 14} style={{ color: 'rgba(255,255,255,0.5)' }} />
    </div>
    <span style={{ fontSize: compact ? 18 : 28, fontWeight: 700, color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', fontFamily: "'DM Sans',monospace", display: 'block' }}>
      {value}
    </span>
    <div style={{ fontSize: compact ? 9 : 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3, lineHeight: 1.2 }}>
      {label}
    </div>
  </div>
);

// Chip "ultima coleta" (Fase D) — idade real derivada de updated_at; nunca inventa.
const CollectaChip = ({ dataAgeHours, compact }) => {
  const c = ageColor(dataAgeHours);
  const txt = dataAgeHours == null
    ? '—'
    : dataAgeHours < 1 ? 'agora' : `há ${Math.round(dataAgeHours)}h`;
  return (
    <div title="Idade da última coleta sincronizada" style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: compact ? '4px 8px' : '6px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.08)', border: `1px solid ${c}33`,
      color: c, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <Clock size={12} /> Coleta {txt}
    </div>
  );
};

const AutoRefreshToggle = ({ enabled, onToggle }) => (
  <button
    onClick={() => onToggle?.(!enabled)}
    title={enabled ? 'Auto-atualização ligada (30 min)' : 'Auto-atualização desligada'}
    aria-pressed={enabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
      color: enabled ? '#22c55e' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit',
    }}
  >
    {enabled ? <Zap size={11} /> : <ZapOff size={11} />} Auto
  </button>
);

export default function AppHeader({
  isMobile, refreshing = false, handleRefresh, userEmail = null, onLogout = null,
  lastUpdate = null, daysToElection = null, totalCandidatos = 8,
  adversarioEmAlta = null, imprensa48h = 0, vulnerabsCriticas = null, dataAgeHours = null,
  autoRefreshEnabled = true, setAutoRefresh = null,
  raceOffice = 'Governador', raceState = 'Tocantins', raceYear = '2026',
}) {
  const kpis = [
    { icon: Calendar,    value: daysToElection ?? '—',            label: 'DIAS P/ ELEIÇÃO', color: getKpiColor('dias', daysToElection ?? 0) },
    { icon: Users,       value: totalCandidatos,                  label: 'CANDIDATOS',      color: '#FFFFFF' },
    { icon: TrendingUp,  value: adversarioEmAlta ? `+${adversarioEmAlta.novos}` : '—',
      label: adversarioEmAlta ? `↑ ${nomeCurto(adversarioEmAlta.nome)}` : 'SEM SURTO', color: '#FFFFFF' },
    { icon: Newspaper,   value: imprensa48h ?? 0,                 label: 'IMPRENSA 48H',    color: getKpiColor('imprensa', imprensa48h ?? 0) },
    { icon: ShieldAlert, value: vulnerabsCriticas ?? '—',         label: 'VULNERAB. CRÍTICAS',
      color: vulnerabsCriticas == null ? 'rgba(255,255,255,0.5)' : '#FFFFFF' },
  ];

  if (isMobile) {
    return (
      <>
        <header style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #061E4A 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>
          <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 800 }}>Inteligência Eleitoral</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CollectaChip dataAgeHours={dataAgeHours} compact />
            <button onClick={handleRefresh} disabled={refreshing} aria-label="Atualizar dados" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: refreshing ? 'wait' : 'pointer' }}>
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {onLogout && <button onClick={onLogout} aria-label="Sair" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><LogOut size={16} /></button>}
          </div>
        </header>
        <div style={{ background: 'linear-gradient(135deg, #061E4A 0%, #041233 100%)', padding: '10px 16px', overflowX: 'auto', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
          {kpis.map((kpi, i) => <KpiChip key={i} {...kpi} compact />)}
        </div>
      </>
    );
  }

  return (
    <header style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #061E4A 100%)', padding: '32px 40px 28px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CollectaChip dataAgeHours={dataAgeHours} />
        <AutoRefreshToggle enabled={autoRefreshEnabled} onToggle={setAutoRefresh} />
        <button onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? '...' : 'Atualizar'}
        </button>
        {onLogout && <button onClick={onLogout} title={userEmail} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={11} /> Sair
        </button>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            INTELIGÊNCIA ELEITORAL · {raceOffice} {raceYear}
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, lineHeight: 1.05, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ color: '#FFFFFF', display: 'block' }}>{raceOffice.toUpperCase()}</span>
            <span style={{ color: '#FFFFFF', display: 'block' }}>{raceState.toUpperCase()}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>{raceYear}.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '14px 0 0' }}>
            {totalCandidatos} pré-candidatos monitorados · {lastUpdate ? lastUpdate.replace(/^(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => `${d}/${m}/${y}`) : new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 500px', maxWidth: 750 }}>
          {kpis.map((kpi, i) => <KpiChip key={i} {...kpi} />)}
        </div>
      </div>
    </header>
  );
}
