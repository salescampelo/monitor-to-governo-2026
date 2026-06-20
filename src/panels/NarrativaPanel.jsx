import { AlertTriangle, ExternalLink, MessageSquareText } from 'lucide-react';
import { Card, PanelSkeleton } from '../components/ui.jsx';
import { tomLabel, sentimentoPct, nivelCor } from '../lib/narrativa.js';

// Painel "Movimento de Narrativa" (Fase G) — reframe DESCRITIVO do CrisisPanel do
// monitor-pmto p/ o frame adversary-only: mede o tom da imprensa em torno de cada
// ADVERSARIO (sentimento derivado dos titulos) + alertas do radar. NAO prescreve
// resposta (isso reintroduziria candidato proprio). Sem PII: só manchetes/links.
const SENT_COR = { Positivo: '#22c55e', Negativo: '#ef4444', Neutro: '#94a3b8' };

const fmtData = (s) => (s ? s.replace(/^(\d{4})-(\d{2})-(\d{2}).*/, '$3/$2/$1') : '');

function AdversarioCard({ a, janela }) {
  // C18: o card rotula a seção como "últimos {janela}d", então barra/chip/contagens
  // usam o sentimento DA JANELA (campos _recente, já emitidos), não o agregado all-time.
  // Fallback p/ all-time se um JSON antigo não trouxer os campos _recente.
  const sr = a.sentimento_recente || a.sentimento;
  const pct = sentimentoPct(sr);
  const tom = tomLabel(a.tom_liquido_recente ?? a.tom_liquido);
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1A2744' }}>{a.nome}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
            {a.total_mencoes} menções · {a.recentes} nos últimos {janela}d
          </p>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: tom.color, background: `${tom.color}1a`, whiteSpace: 'nowrap' }}>
          {tom.label}
        </span>
      </div>

      {/* Barra empilhada de sentimento dos títulos */}
      {pct.total > 0 && (
        <div>
          <div role="img" aria-label={`Sentimento (${janela}d): ${sr.positivo} positivas, ${sr.neutro} neutras, ${sr.negativo} negativas`}
            style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: 'rgba(26,39,68,0.06)' }}>
            <div style={{ width: `${pct.pos}%`, background: SENT_COR.Positivo }} />
            <div style={{ width: `${pct.neu}%`, background: SENT_COR.Neutro }} />
            <div style={{ width: `${pct.neg}%`, background: SENT_COR.Negativo }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 10, color: '#6B7280' }}>
            <span style={{ color: SENT_COR.Positivo, fontWeight: 700 }}>{sr.positivo} pos</span>
            <span style={{ fontWeight: 700 }}>{sr.neutro} neutro</span>
            <span style={{ color: SENT_COR.Negativo, fontWeight: 700 }}>{sr.negativo} neg</span>
          </div>
        </div>
      )}

      {/* Alertas do radar (já agregados, sem PII) */}
      {a.alertas?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {a.alertas.map((al, i) => (
            <span key={i} title={al.evidencia || ''} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: nivelCor(al.nivel), background: `${nivelCor(al.nivel)}1a` }}>
              <AlertTriangle size={11} /> {al.tipo} ({al.nivel})
            </span>
          ))}
        </div>
      )}

      {/* Destaques: manchetes de imprensa pública (links). Nenhum dado de terceiro privado. */}
      {a.destaques?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(26,39,68,0.06)', paddingTop: 10 }}>
          {a.destaques.map((d, i) => (
            <a key={i} href={d.url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12, color: '#1A2744', textDecoration: 'none' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SENT_COR[d.sentimento] || '#94a3b8', flexShrink: 0, marginTop: 4 }} />
              <span style={{ flex: 1, lineHeight: 1.3 }}>{d.title}</span>
              <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap' }}>{d.source} · {fmtData(d.data)} <ExternalLink size={10} style={{ verticalAlign: 'middle' }} /></span>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function NarrativaPanel({ narrativaData }) {
  if (!narrativaData) return <PanelSkeleton rows={8} />;
  const { adversarios = [], janela_dias = 7, resumo = {}, updated_at, principio } = narrativaData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card noHover style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <MessageSquareText size={20} style={{ color: '#0B3D91' }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1A2744' }}>Movimento de Narrativa</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
            {resumo.adversarios || adversarios.length} adversários · {resumo.total_mencoes || 0} menções · {resumo.com_alerta_critico || 0} com alerta crítico
            {updated_at ? ` · atualizado ${updated_at}` : ''}
          </p>
        </div>
      </Card>

      {principio && (
        <p style={{ margin: 0, fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>{principio}</p>
      )}

      {adversarios.length === 0 ? (
        <Card><p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Sem menções classificadas no período.</p></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {adversarios.map((a) => <AdversarioCard key={a.id} a={a} janela={janela_dias} />)}
        </div>
      )}
    </div>
  );
}
