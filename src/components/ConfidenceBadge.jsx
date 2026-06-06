const LEVELS = [
  { min: 0.80, label: 'Alta',      color: '#22c55e' },
  { min: 0.60, label: 'Moderada',  color: '#f59e0b' },
  { min: 0,    label: 'Baixa',     color: '#ef4444' },
];

function getLevel(conf) {
  return LEVELS.find(l => conf >= l.min) || LEVELS[LEVELS.length - 1];
}

export default function ConfidenceBadge({ value, showLabel }) {
  if (value == null) return null;
  const { label, color } = getLevel(value);
  const pct = Math.round(value * 100);
  return (
    <span
      title={`Confiança: ${pct}% (${label})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        background: `${color}1a`,
        color,
        lineHeight: 1,
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      {showLabel ? label : `${pct}%`}
    </span>
  );
}

export function ConfidenceDims({ dims }) {
  if (!dims) return null;
  const DIM_LABELS = {
    votos_2022: 'Votos 2022',
    seguidores: 'Seguidores',
    sobreposicao: 'Sobreposição',
    nivel_base: 'Nível base',
    engajamento: 'Engajamento',
    mandato: 'Mandato',
    severidade: 'Severidade',
    vetor_doadores: 'Doadores',
    capital_positivo: 'Capital pos.',
    trajetoria: 'Trajetória',
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {Object.entries(dims).map(([k, v]) => {
        const { color } = getLevel(v);
        return (
          <span
            key={k}
            title={`${DIM_LABELS[k] || k}: ${Math.round(v * 100)}%`}
            style={{
              padding: '1px 5px',
              borderRadius: 3,
              fontSize: 8,
              fontWeight: 600,
              background: `${color}15`,
              color,
            }}
          >
            {DIM_LABELS[k] || k}
          </span>
        );
      })}
    </div>
  );
}
