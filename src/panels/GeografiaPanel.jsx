import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Target, ArrowUpDown } from 'lucide-react';
import { Card, Met, Bt } from '../components/ui.jsx';
import SnapshotBadge from '../components/SnapshotBadge.jsx';
import { useWW, fmtK } from '../lib/ui-helpers.js';
import { fetchJ, URLS } from '../lib/fetch.js';

// Fix para ícones padrão do Leaflet com bundlers (Vite). Só CircleMarker é
// usado aqui, mas o merge evita 404s caso um marker padrão seja criado.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Mirrors App.jsx / VicesPanel: em DEV não há sessão Supabase, então busca o
// arquivo estático pelo proxy do Vite; em prod passa pelo /api/data autenticado.
const fetchGeo = import.meta.env.DEV
  ? () => fetch('/data/geo_electoral.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.geoElectoral);

const CENTER_TO = [-10.25, -48.25];
const ZOOM_INITIAL = 6;

// conservador = vermelho (Bolsonaro), dividido = âmbar, progressista = azul (Lula).
const LEAN_CONFIG = {
  conservador:  { cor: '#ef4444', label: 'Conservador' },
  dividido:     { cor: '#f59e0b', label: 'Dividido' },
  progressista: { cor: '#1A3A7A', label: 'Progressista' },
};
const leanCfg = (lean) => LEAN_CONFIG[lean] || { cor: '#8C93A8', label: 'Sem dado' };

const pct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const scoreIdx = (v) => Math.round((v || 0) * 100);

// Raio do círculo proporcional à população (sqrt para área ~ população).
const radiusForPop = (pop) => {
  if (!pop) return 5;
  return Math.max(5, Math.min(26, Math.sqrt(pop) / 28));
};

function Legenda() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(255,255,255,0.95);padding:10px 12px;border-radius:8px;border:1px solid rgba(26,39,68,0.12);font-size:11px;line-height:1.8;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-family:DM Sans,sans-serif';
      Object.values(LEAN_CONFIG).forEach(cfg => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px';
        const dot = document.createElement('span');
        dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${cfg.cor};display:inline-block`;
        const label = document.createElement('span');
        label.style.cssText = 'color:#1A2744;font-weight:600';
        label.textContent = cfg.label;
        row.appendChild(dot);
        row.appendChild(label);
        div.appendChild(row);
      });
      return div;
    };
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

function PopupConteudo({ m }) {
  const cfg = leanCfg(m.lean_2022);
  return (
    <div style={{ maxWidth: 280, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#1A2744', lineHeight: 1.5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <strong style={{ fontSize: 15, fontWeight: 800 }}>{m.municipio}</strong>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${cfg.cor}18`, color: cfg.cor, border: `1px solid ${cfg.cor}40` }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#5A6478', marginBottom: 8 }}>
        População: {(m.populacao || 0).toLocaleString('pt-BR')}
      </div>
      <div style={{ borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#5A6478', marginBottom: 3 }}>
          2º turno 2022: Bolsonaro {pct(m.pct_bolsonaro_2t)} × Lula {pct(m.pct_lula_2t)}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(26,39,68,0.08)', paddingTop: 8, display: 'flex', gap: 16 }}>
        <div>
          <span style={{ fontSize: 10, color: '#8C93A8' }}>Score ROI</span>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0B3D91' }}>{scoreIdx(m.roi_score)}</div>
        </div>
        <div>
          <span style={{ fontSize: 10, color: '#8C93A8' }}>Ranking</span>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2744' }}>#{m.ranking_roi ?? '—'}</div>
        </div>
      </div>
    </div>
  );
}

export default function GeografiaPanel() {
  const isMobile = useWW() < 768;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leanFilter, setLeanFilter] = useState('all');
  const [sortKey, setSortKey] = useState('ranking_roi');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchGeo()
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const municipios = useMemo(() => data?.municipios || [], [data]);

  const valid = useMemo(
    () => municipios.filter(m => typeof m.lat === 'number' && typeof m.lon === 'number'),
    [municipios],
  );

  const filtrados = useMemo(() => {
    if (leanFilter === 'all') return valid;
    return valid.filter(m => m.lean_2022 === leanFilter);
  }, [valid, leanFilter]);

  const ranked = useMemo(() => {
    const arr = [...municipios];
    arr.sort((a, b) => {
      if (sortKey === 'ranking_roi') return (a.ranking_roi ?? 1e9) - (b.ranking_roi ?? 1e9);
      if (sortKey === 'roi_score') return (b.roi_score || 0) - (a.roi_score || 0);
      if (sortKey === 'populacao') return (b.populacao || 0) - (a.populacao || 0);
      if (sortKey === 'municipio') return (a.municipio || '').localeCompare(b.municipio || '');
      return 0;
    });
    return arr;
  }, [municipios, sortKey]);

  const counts = useMemo(() => {
    const c = { conservador: 0, dividido: 0, progressista: 0 };
    valid.forEach(m => { if (c[m.lean_2022] !== undefined) c[m.lean_2022]++; });
    return c;
  }, [valid]);

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Carregando inteligência geográfica...</div>;
  }
  if (!data || municipios.length === 0) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Sem dados geográficos disponíveis.</div>;
  }

  const SORT_OPTIONS = [
    ['ranking_roi', 'Ranking'],
    ['roi_score', 'Score'],
    ['populacao', 'População'],
    ['municipio', 'A–Z'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(11,61,145,0.08)', border: '1px solid rgba(11,61,145,0.15)', borderRadius: 12, padding: 10 }}>
              <MapPin size={22} style={{ color: '#0B3D91' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Inteligência Geográfica — Tocantins</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>
                Campo eleitoral · tendência 2022 + score ROI · {valid.length} municípios
                {data._fixture ? ' · DADOS FIXTURE' : ''}
              </p>
            </div>
          </div>
          <SnapshotBadge dataAtualizacao={data.data_atualizacao} />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
        <Met icon={MapPin} label="Municípios" value={valid.length} accent="#0B3D91" compact={isMobile} />
        <Met icon={Target} label="Conservador" value={counts.conservador} accent="#ef4444" compact={isMobile} />
        <Met icon={Target} label="Dividido" value={counts.dividido} accent="#f59e0b" compact={isMobile} />
        <Met icon={Target} label="Progressista" value={counts.progressista} accent="#1A3A7A" compact={isMobile} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Bt active={leanFilter === 'all'} color="#64748b" onClick={() => setLeanFilter('all')}>Todos ({valid.length})</Bt>
        {Object.entries(LEAN_CONFIG).map(([key, cfg]) => (
          <Bt key={key} active={leanFilter === key} color={cfg.cor} onClick={() => setLeanFilter(key)}>
            {cfg.label} ({counts[key] || 0})
          </Bt>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12 }}>
        <Card noHover style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer
            center={CENTER_TO}
            zoom={ZOOM_INITIAL}
            style={{ height: isMobile ? 380 : 560, width: '100%' }}
            zoomControl
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            {!isMobile && <Legenda />}
            {filtrados.map(m => {
              const cfg = leanCfg(m.lean_2022);
              return (
                <CircleMarker
                  key={m.cod_ibge}
                  center={[m.lat, m.lon]}
                  radius={radiusForPop(m.populacao)}
                  eventHandlers={{ click: () => setSelected(m.cod_ibge) }}
                  pathOptions={{ color: cfg.cor, fillColor: cfg.cor, fillOpacity: 0.55, weight: 1.5, opacity: 0.9 }}
                >
                  <Popup maxWidth={300} minWidth={240}>
                    <PopupConteudo m={m} />
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </Card>

        <Card noHover>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
              Ranking ROI / prioridade
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8C93A8' }}>
              <ArrowUpDown size={11} /> ordenar
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {SORT_OPTIONS.map(([k, label]) => (
              <Bt key={k} active={sortKey === k} color="#0B3D91" onClick={() => setSortKey(k)}>{label}</Bt>
            ))}
          </div>
          <div style={{ maxHeight: isMobile ? 360 : 470, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 70px 54px', gap: 4, padding: '4px 4px 6px', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ fontSize: 10, color: '#8c93a8', fontWeight: 700 }}>#</span>
              <span style={{ fontSize: 10, color: '#8c93a8', fontWeight: 700 }}>MUNICÍPIO</span>
              <span style={{ fontSize: 10, color: '#8c93a8', fontWeight: 700, textAlign: 'right' }}>POP.</span>
              <span style={{ fontSize: 10, color: '#8c93a8', fontWeight: 700, textAlign: 'right' }}>SCORE</span>
            </div>
            {ranked.map(m => {
              const cfg = leanCfg(m.lean_2022);
              const sel = selected === m.cod_ibge;
              return (
                <div
                  key={m.cod_ibge}
                  onClick={() => setSelected(sel ? null : m.cod_ibge)}
                  style={{
                    display: 'grid', gridTemplateColumns: '34px 1fr 70px 54px', gap: 4, padding: '6px 4px',
                    borderBottom: '1px solid var(--surface-border)', cursor: 'pointer',
                    background: sel ? 'rgba(11,61,145,0.08)' : 'transparent', borderRadius: sel ? 6 : 0,
                    borderLeft: `3px solid ${cfg.cor}`,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8c93a8' }}>#{m.ranking_roi ?? '—'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.municipio}</span>
                  <span style={{ fontSize: 12, color: '#8C93A8', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtK(m.populacao)}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0B3D91', textAlign: 'right' }}>{scoreIdx(m.roi_score)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
