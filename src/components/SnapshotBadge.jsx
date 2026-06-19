import { Camera } from 'lucide-react';

// Gate de snapshot (correção A1 do red team): geo_electoral / territorio_* /
// emenda_roi NÃO estão no loop de sync automático da monitor.yml — são gerados e
// commitados À MÃO e envelhecem em silêncio. Este selo declara a data do snapshot
// (data_atualizacao do próprio arquivo) para o operador não confundir dado parado
// com dado vivo. Sem data -> não renderiza (não inventa frescor).
export default function SnapshotBadge({ dataAtualizacao, fonte }) {
  if (!dataAtualizacao) return null;
  const dia = String(dataAtualizacao).replace(/^(\d{4})-(\d{2})-(\d{2}).*/, '$3/$2/$1');
  return (
    <span
      title="Snapshot estático — atualizado manualmente, fora do sync automático"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
        color: '#8A6D1B', background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)',
        whiteSpace: 'nowrap',
      }}
    >
      <Camera size={12} /> Snapshot de {dia}{fonte ? ` · ${fonte}` : ''}
    </span>
  );
}
