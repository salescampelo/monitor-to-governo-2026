// src/panels/TerritorioPanel.jsx
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, BarChart3 } from 'lucide-react';
import { Card, Met, Bt } from '../components/ui.jsx';
import { useWW } from '../lib/ui-helpers.js';
import { fetchJ, URLS } from '../lib/fetch.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const fetchInd = import.meta.env.DEV
  ? () => fetch('/data/territorio_indicadores.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.territorioIndicadores);

const fetchSeries = import.meta.env.DEV
  ? () => fetch('/data/territorio_series.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  : () => fetchJ(URLS.territorioSeries);

function Sparkline({ pontos }) {
  if (!pontos || pontos.length < 2) return <span style={{ fontSize: 11, color: '#9ca3af' }}>série indisponível</span>;
  const xs = pontos.map(p => p.ano), ys = pontos.map(p => p.valor);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const W = 120, H = 28;
  const sx = a => (x1 === x0 ? 0 : ((a - x0) / (x1 - x0)) * W);
  const sy = b => (y1 === y0 ? H / 2 : H - ((b - y0) / (y1 - y0)) * H);
  const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${sx(p.ano).toFixed(1)},${sy(p.valor).toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke="#0B3D91" strokeWidth="1.5" />
    </svg>
  );
}

const CENTER_TO = [-10.25, -48.25];
const ZOOM_INITIAL = 6;

// Valência → cor (pior = vermelho). sem_dado = cinza.
const NIVEL_COR = {
  muito_ruim: '#b91c1c', ruim: '#f97316', neutro: '#f59e0b',
  bom: '#65a30d', muito_bom: '#15803d', sem_dado: '#9ca3af',
};
const nivelCor = (n) => NIVEL_COR[n] || '#9ca3af';

const CLUSTER_COR = ['#0B3D91', '#15803d', '#a16207', '#b91c1c', '#7c3aed', '#0891b2'];
const clusterCor = (id) => CLUSTER_COR[(id ?? 0) % CLUSTER_COR.length];

const fmtValor = (v, unidade) => (v == null ? '—' : `${v} ${unidade || ''}`.trim());

export default function TerritorioPanel() {
  const isMobile = useWW() < 768;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chave, setChave] = useState('tx_homicidios');
  const [selected, setSelected] = useState(null);
  const [modo, setModo] = useState('indicador'); // 'indicador' | 'tipologia'

  useEffect(() => {
    fetchInd().then(setData).catch(() => null).finally(() => setLoading(false));
  }, []);

  const [series, setSeries] = useState(null);
  useEffect(() => { fetchSeries().then(setSeries).catch(() => null); }, []);

  const municipios = useMemo(() => data?.municipios || [], [data]);
  const selMuni = useMemo(() => municipios.find(m => m.cod_ibge === selected), [municipios, selected]);
  const meta = useMemo(
    () => (data?.indicadores_meta || []).find(i => i.chave === chave),
    [data, chave],
  );
  const valid = useMemo(
    () => municipios.filter(m => typeof m.lat === 'number' && typeof m.lon === 'number'),
    [municipios],
  );
  const ranked = useMemo(() => {
    const arr = [...municipios];
    arr.sort((a, b) => {
      const ra = a.indicadores[chave]?.rank ?? 1e9;
      const rb = b.indicadores[chave]?.rank ?? 1e9;
      return ra - rb; // rank 1 (pior) primeiro
    });
    return arr;
  }, [municipios, chave]);
  const resumo = useMemo(() => data?.resumo_estadual?.[chave], [data, chave]);

  if (loading) return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Carregando inteligência territorial...</div>;
  if (!data || municipios.length === 0) return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Sem dados territoriais disponíveis.</div>;

  // agrupa indicadores por domínio para o seletor
  const porDominio = {};
  (data.indicadores_meta || []).forEach(i => {
    (porDominio[i.dominio] = porDominio[i.dominio] || []).push(i);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(11,61,145,0.08)', border: '1px solid rgba(11,61,145,0.15)', borderRadius: 12, padding: 10 }}>
              <MapIcon size={22} style={{ color: '#0B3D91' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Território & Vulnerabilidade — Tocantins</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>
                Indicadores de resultado por município · {valid.length} municípios · vermelho = pior desempenho
              </p>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Atualizado em {data.data_atualizacao || '—'}</span>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 6 }}>
        <Bt active={modo === 'indicador'} color="#0B3D91" onClick={() => setModo('indicador')}>Indicador</Bt>
        <Bt active={modo === 'tipologia'} color="#0B3D91" onClick={() => setModo('tipologia')}>Tipologia</Bt>
      </div>

      {modo === 'indicador' && (
      <>
      {/* seletor de indicador por domínio */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(porDominio).map(([dom, inds]) => (
          <div key={dom} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8c93a8', minWidth: 92 }}>{dom}</span>
            {inds.map(i => (
              <Bt key={i.chave} active={chave === i.chave} color="#0B3D91" onClick={() => setChave(i.chave)}>{i.rotulo}</Bt>
            ))}
          </div>
        ))}
      </div>

      {resumo && (
        <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
          <Met icon={BarChart3} label="Cobertura" value={`${resumo.n}/139`} accent="#0B3D91" compact={isMobile} />
          <Met icon={BarChart3} label="Média estadual" value={resumo.media ?? '—'} accent="#0B3D91" compact={isMobile} />
          <Met icon={BarChart3} label="Mín" value={resumo.min ?? '—'} accent="#15803d" compact={isMobile} />
          <Met icon={BarChart3} label="Máx" value={resumo.max ?? '—'} accent="#b91c1c" compact={isMobile} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12 }}>
        <Card noHover style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={CENTER_TO} zoom={ZOOM_INITIAL} style={{ height: isMobile ? 380 : 560, width: '100%' }} zoomControl>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
              subdomains="abcd" maxZoom={19}
            />
            {valid.map(m => {
              const cell = m.indicadores[chave] || {};
              const cor = nivelCor(cell.nivel);
              return (
                <CircleMarker
                  key={m.cod_ibge}
                  center={[m.lat, m.lon]}
                  radius={Math.max(5, Math.min(22, Math.sqrt(m.populacao || 1) / 30))}
                  eventHandlers={{ click: () => setSelected(m.cod_ibge) }}
                  pathOptions={{ color: cor, fillColor: cor, fillOpacity: 0.6, weight: 1.2, opacity: 0.9 }}
                >
                  <Popup maxWidth={280} minWidth={220}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#1A2744' }}>
                      <strong style={{ fontSize: 15 }}>{m.municipio}</strong>
                      <div style={{ fontSize: 12, marginTop: 6 }}>{meta?.rotulo}: <strong>{fmtValor(cell.valor, meta?.unidade)}</strong></div>
                      <div style={{ fontSize: 11, color: '#5A6478' }}>Rank estadual: {cell.rank ? `#${cell.rank} (pior→melhor)` : 'sem dado'}</div>
                      <div style={{ fontSize: 11, color: '#5A6478' }}>Cluster: {m.cluster_nome || '—'}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </Card>

        <Card noHover>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Pior → melhor · {meta?.rotulo}
          </div>
          <div style={{ maxHeight: isMobile ? 360 : 510, overflowY: 'auto' }}>
            {ranked.map(m => {
              const cell = m.indicadores[chave] || {};
              const sel = selected === m.cod_ibge;
              return (
                <div key={m.cod_ibge} onClick={() => setSelected(sel ? null : m.cod_ibge)}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 90px', gap: 4, padding: '6px 4px',
                    borderBottom: '1px solid var(--surface-border)', cursor: 'pointer',
                    background: sel ? 'rgba(11,61,145,0.08)' : 'transparent',
                    borderLeft: `3px solid ${nivelCor(cell.nivel)}`,
                  }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8c93a8' }}>{cell.rank ? `#${cell.rank}` : '—'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.municipio}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'right', color: '#1A2744', fontVariantNumeric: 'tabular-nums' }}>{cell.valor ?? '—'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      </>
      )}

      {modo === 'tipologia' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12 }}>
          <Card noHover style={{ padding: 0, overflow: 'hidden' }}>
            <MapContainer center={CENTER_TO} zoom={ZOOM_INITIAL} style={{ height: isMobile ? 380 : 560, width: '100%' }} zoomControl>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' subdomains="abcd" maxZoom={19} />
              {valid.map(m => (
                <CircleMarker key={m.cod_ibge} center={[m.lat, m.lon]}
                  radius={Math.max(5, Math.min(22, Math.sqrt(m.populacao || 1) / 30))}
                  pathOptions={{ color: clusterCor(m.cluster_id), fillColor: clusterCor(m.cluster_id), fillOpacity: 0.6, weight: 1.2 }}>
                  <Popup><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}><strong>{m.municipio}</strong><div style={{ fontSize: 12 }}>{m.cluster_nome}</div></div></Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </Card>
          <Card noHover>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>Tipologia municipal (PCA)</div>
            {(data.clusters_meta || []).map(c => (
              <div key={c.cluster_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--surface-border)' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: clusterCor(c.cluster_id), display: 'inline-block' }} />
                <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{c.cluster_nome}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8c93a8' }}>{c.n}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {selMuni && (
        <Card noHover>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 16, color: 'var(--text)' }}>{selMuni.municipio}</strong>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: 'rgba(11,61,145,0.08)', color: '#0B3D91' }}>{selMuni.cluster_nome || '—'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {(data.indicadores_meta || []).map(i => {
              const cell = selMuni.indicadores[i.chave] || {};
              const pontos = series?.series?.[selMuni.cod_ibge]?.[i.chave];
              return (
                <div key={i.chave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 8px', borderLeft: `3px solid ${nivelCor(cell.nivel)}`, background: 'var(--surface-hover)', borderRadius: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.rotulo}</div>
                    <div style={{ fontSize: 11, color: '#8c93a8' }}>{fmtValor(cell.valor, i.unidade)} · {cell.rank ? `#${cell.rank}/139` : 'sem dado'}</div>
                  </div>
                  {i.tem_serie ? <Sparkline pontos={pontos} /> : <span style={{ fontSize: 10, color: '#cbd5e1' }}>—</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
