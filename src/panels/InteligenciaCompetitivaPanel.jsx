import React from 'react';
import { Card, useWW, fmtK } from '../components/ui.jsx';
import { Target, Newspaper, Eye } from 'lucide-react';

const FORCA_C = {
  alta:  { bg: 'rgba(239,68,68,0.1)',  c: '#ef4444' },
  média: { bg: 'rgba(245,158,11,0.1)', c: '#f59e0b' },
  baixa: { bg: 'rgba(100,116,139,0.1)', c: '#64748b' },
};

const BLOCO_C = {
  Governista:   '#22c55e',
  Independente: '#0B3D91',
  'Oposição':   '#f59e0b',
  Esquerda:     '#ef4444',
  Outsider:     '#8b5cf6',
};

const DIMS = [
  ['Votos 2022 (ajust. cargo)', '25%'],
  ['Seguidores Instagram', '15%'],
  ['Sobreposição eleitorado', '15%'],
  ['Nível base', '10%'],
  ['Engajamento Instagram', '10%'],
  ['Mandato atual', '5%'],
  ['Severidade processual', '8%'],
  ['Vetor doadores', '4%'],
  ['Capital positivo', '4%'],
  ['Trajetória eleitoral', '4%'],
];

const SectionTitle = ({ icon: I, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    {I && <I size={15} style={{ color: '#0B3D91' }} />}
    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C93A8' }}>
      {children}
    </span>
  </div>
);

const Pill = ({ label, count, color }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${color}1a`, color }}>
    {label} <span style={{ fontFamily: 'var(--font-mono)' }}>{count}</span>
  </span>
);

const BlocoBadge = ({ bloco }) => (
  <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${BLOCO_C[bloco] || '#64748b'}1a`, color: BLOCO_C[bloco] || '#64748b' }}>
    {bloco}
  </span>
);

const fmtDateBR = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) {
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})\s*(.*)/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ' ' + m[4] : ''}`;
    return s;
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export default function InteligenciaCompetitivaPanel({ adversariosData, advMentionsData }) {
  const isMobile = useWW() < 768;
  if (!adversariosData) return null;

  const { ranking = [], stats = {}, nomes_fronteira = [], total_candidatos, vagas, data_atualizacao } = adversariosData;
  const candidatos = advMentionsData?.candidatos || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={20} style={{ color: '#0B3D91' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Inteligência Competitiva — Governo TO 2026
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill label="Alta" count={stats.forca_alta ?? 0} color="#ef4444" />
            <Pill label="Média" count={stats.forca_media ?? 0} color="#f59e0b" />
            <Pill label="Baixa" count={stats.forca_baixa ?? 0} color="#64748b" />
          </div>
        </div>
        {data_atualizacao && (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
            Atualizado em {fmtDateBR(data_atualizacao)}
          </p>
        )}
      </Card>

      {/* Main Grid: Ranking + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)', gap: 20 }}>
        {/* Left: Horizontal Bar Chart */}
        <Card>
          <SectionTitle icon={Target}>Ranking de Força Eleitoral</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ranking.map((c) => {
              const fc = FORCA_C[c.nivel_dinamico] || FORCA_C.baixa;
              const barW = Math.max(4, Math.round(c.score));
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#8C93A8', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {c.ranking}
                  </span>
                  <div style={{ width: isMobile ? 100 : 160, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{c.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{c.partido}</span>
                      <BlocoBadge bloco={c.bloco} />
                    </div>
                  </div>
                  <div style={{ flex: 1, height: 22, background: 'rgba(26,39,68,0.04)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${barW}%`, height: '100%', background: fc.c, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6, transition: 'width 0.4s ease' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {c.seguidores > 0 ? fmtK(c.seguidores) : c.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: fc.bg, color: fc.c, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {c.score.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Visão Geral */}
          <Card>
            <SectionTitle>Visão Geral</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Vagas</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{vagas}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Candidatos</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total_candidatos}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['Força alta', stats.forca_alta, '#ef4444'], ['Força média', stats.forca_media, '#f59e0b'], ['Força baixa', stats.forca_baixa, '#64748b']].map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${c}1a`, color: c, fontFamily: 'var(--font-mono)' }}>{v ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Score Dimensions */}
          <Card>
            <SectionTitle>Score — 10 Dimensões</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DIMS.map(([dim, pct]) => (
                <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{dim}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{pct}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Candidate Detail Cards */}
      <div>
        <SectionTitle icon={Eye}>Detalhamento por Candidato</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {ranking.map((c) => {
            const fc = FORCA_C[c.nivel_dinamico] || FORCA_C.baixa;
            return (
              <Card key={c.id} style={{ borderTop: `3px solid ${fc.c}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.nome}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.partido}</span>
                  <BlocoBadge bloco={c.bloco} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    ['Score', c.score.toFixed(1)],
                    ['Seguidores', fmtK(c.seguidores)],
                    ['Votos 2022', fmtK(c.votos_2022)],
                    ['Engajamento', `${c.taxa_engajamento_pct?.toFixed(2) ?? 0}%`],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: '#8C93A8', textTransform: 'uppercase', fontWeight: 600 }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {c.descricao && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{c.descricao}</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Press Mentions */}
      {advMentionsData && Object.keys(candidatos).length > 0 && (
        <div>
          <SectionTitle icon={Newspaper}>Imprensa dos Candidatos — últimos 7 dias</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Object.entries(candidatos).map(([id, cand]) => (
              <Card key={id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {cand.nome} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-secondary)' }}>{cand.partido}</span>
                  </span>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(11,61,145,0.1)', color: '#0B3D91', fontFamily: 'var(--font-mono)' }}>
                    {cand.total_mentions}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(cand.mentions || []).slice(0, 5).map((m, i) => (
                    <div key={i} style={{ borderLeft: '2px solid var(--surface-border)', paddingLeft: 8 }}>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0B3D91', textDecoration: 'none', fontWeight: 600, lineHeight: 1.3, display: 'block' }}>
                        {m.title}
                      </a>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {m.source} &middot; {fmtDateBR(m.published)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Nomes Fronteira */}
      {nomes_fronteira.length > 0 && (
        <div>
          <SectionTitle icon={Eye}>Nomes Fronteira — Monitoramento</SectionTitle>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nomes_fronteira.map((nf, i) => (
                <div key={i} style={{ borderLeft: '3px solid #d1d5db', paddingLeft: 12, paddingTop: 4, paddingBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {nf.nome} <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>{nf.partido}</span>
                  </div>
                  {nf.nota && <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{nf.nota}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
