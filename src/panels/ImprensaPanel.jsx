import { useMemo, useReducer } from 'react';
import { Newspaper, ExternalLink, Filter } from 'lucide-react';
import { Card, Bt, Bd, PanelSkeleton } from '../components/ui.jsx';
import {
  achatarMencoes, aplicarFiltros, contagemPorFonte, volumePorDia, opcoesDeFiltro, FILTRO_INICIAL,
} from '../lib/imprensa.js';

// Explorador de Imprensa dos adversários (BUILD do council de completude). Reframe
// adversary-only do ImprensaPanel do monitor-pmto: lista APENAS menções dos adversários
// (estrutura nativa do feed), com filtros por adversário/fonte/sentimento/escopo/tipo/
// relevância, volume por dia e contagem por veículo. CORTADO do clone PMTO: export
// CSV/PDF, toxicidade e clusterização (dependiam de pipeline/PII do candidato próprio).
const SENT_COR = { Positivo: '#22c55e', Negativo: '#ef4444', Neutro: '#94a3b8' };
const fmtDia = (s) => (s ? s.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$3/$2') : '');
const fmtDataHora = (p) => { const d = new Date(p); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR'); };

const filtroReducer = (s, a) => (a.reset ? FILTRO_INICIAL : { ...s, [a.key]: s[a.key] === a.value ? 'all' : a.value });

function Seletor({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid rgba(26,39,68,0.15)', background: '#fff', color: '#1A2744', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', minWidth: 120 }}>
        <option value="all">Todos</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export default function ImprensaPanel({ advMentionsData }) {
  const mencoes = useMemo(() => achatarMencoes(advMentionsData), [advMentionsData]);
  const opcoes = useMemo(() => opcoesDeFiltro(mencoes), [mencoes]);
  const [filtro, dispatch] = useReducer(filtroReducer, FILTRO_INICIAL);

  const filtradas = useMemo(() => aplicarFiltros(mencoes, filtro), [mencoes, filtro]);
  const porFonte = useMemo(() => contagemPorFonte(filtradas), [filtradas]);
  const porDia = useMemo(() => volumePorDia(filtradas), [filtradas]);
  const maxDia = useMemo(() => porDia.reduce((m, d) => Math.max(m, d.n), 0) || 1, [porDia]);

  if (!advMentionsData) return <PanelSkeleton rows={8} />;

  const set = (key) => (value) => dispatch({ key, value });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card noHover style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Newspaper size={20} style={{ color: '#0B3D91' }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1A2744' }}>Imprensa dos Adversários</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
            {mencoes.length} menções · {opcoes.fontes.length} veículos
            {advMentionsData.updated_at ? ` · atualizado ${advMentionsData.updated_at}` : ''}
          </p>
        </div>
      </Card>

      {/* Filtros */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: '#0B3D91', marginBottom: 8 }} />
          <Seletor label="Adversário" value={filtro.adversario} onChange={set('adversario')}
            options={opcoes.adversarios.map(a => ({ value: a.id, label: a.nome }))} />
          <Seletor label="Veículo" value={filtro.fonte} onChange={set('fonte')}
            options={opcoes.fontes.map(f => ({ value: f, label: f }))} />
          <Seletor label="Tipo" value={filtro.tipo} onChange={set('tipo')}
            options={opcoes.tipos.map(t => ({ value: t, label: t }))} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Positivo', 'Neutro', 'Negativo'].map(s => (
              <Bt key={s} active={filtro.sentimento === s} color={SENT_COR[s]} onClick={() => dispatch({ key: 'sentimento', value: s })}>{s}</Bt>
            ))}
            <Bt active={filtro.escopo === 'focado'} color="#0B3D91" onClick={() => dispatch({ key: 'escopo', value: 'focado' })}>Focado</Bt>
            <Bt active={filtro.relevancia === 'direta'} color="#0B3D91" onClick={() => dispatch({ key: 'relevancia', value: 'direta' })}>Direta</Bt>
            <Bt active={false} color="#64748b" onClick={() => dispatch({ reset: true })}>Limpar</Bt>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* Volume por dia */}
        <Card>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#1A2744' }}>Volume por dia</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
            {porDia.length === 0 ? <span style={{ fontSize: 12, color: '#9CA3AF' }}>Sem menções no filtro.</span>
              : porDia.map(d => (
                <div key={d.dia} title={`${d.dia}: ${d.n}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: `${(d.n / maxDia) * 60}px`, background: '#0B3D91', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                  <span style={{ fontSize: 8, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDia(d.dia)}</span>
                </div>
              ))}
          </div>
        </Card>
        {/* Top veículos */}
        <Card>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#1A2744' }}>Veículos ({porFonte.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
            {porFonte.slice(0, 8).map(f => (
              <div key={f.fonte} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5A6478' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fonte}</span>
                <span style={{ fontWeight: 700, color: '#1A2744' }}>{f.n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Lista de menções */}
      <Card>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#1A2744' }}>{filtradas.length} menções</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtradas.length === 0 ? <span style={{ fontSize: 13, color: '#6B7280' }}>Nenhuma menção para os filtros atuais.</span>
            : filtradas.map((m, i) => (
              <a key={m.hash || i} href={m.url} target="_blank" rel="noreferrer"
                style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 0', borderTop: i ? '1px solid rgba(26,39,68,0.06)' : 'none', textDecoration: 'none', color: '#1A2744' }}>
                <span title={m.sentimento} style={{ width: 8, height: 8, borderRadius: '50%', background: SENT_COR[m.sentimento] || '#94a3b8', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.35 }}>{m.title}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{m.adversario_nome} · {m.source} · {fmtDataHora(m.published)}</span>
                    {m.tipo && <Bd color="#0B3D91">{m.tipo}</Bd>}
                    {m.relevancia_rotulo === 'DIRETA' && <Bd color="#7c3aed">direta</Bd>}
                  </div>
                </div>
                <ExternalLink size={12} style={{ color: '#9CA3AF', flexShrink: 0, marginTop: 3 }} />
              </a>
            ))}
        </div>
      </Card>
    </div>
  );
}
