import { useEffect, useState } from 'react';
import { Users, UserCheck, Clock } from 'lucide-react';
import { Card } from '../components/ui.jsx';

const DATA_URL = import.meta.env.DEV
  ? '/data/vices_config.json'
  : '/api/data/vices_config.json';

export default function VicesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Sem dados de vices.</div>;

  const vicesConfirmados = data.vices || {};
  const emNegociacao = data.vices_em_negociacao || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Users size={20} style={{ color: '#0B3D91' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            Vices das Chapas Majoritárias
          </span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
          Atualizado em {data.version || data.gerado_em}
        </p>
      </Card>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <UserCheck size={15} style={{ color: '#15803D' }} />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#15803D' }}>
            Confirmados ({Object.keys(vicesConfirmados).length})
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {Object.entries(vicesConfirmados).map(([key, vice]) => (
            <Card key={key} style={{ borderTop: '3px solid #15803D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <strong style={{ fontSize: 15 }}>{vice.nome}</strong>
                <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 4, fontWeight: 700 }}>
                  {vice.partido_atual}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Vice de <strong style={{ color: 'var(--text)' }}>{vice.vice_de}</strong>
              </div>
              <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-secondary)' }}>{vice.cargo_atual}</div>
              <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-secondary)' }}>{vice.carreira}</div>
              {vice.slogan && (
                <div style={{ fontSize: 12, marginTop: 8, fontStyle: 'italic', color: 'var(--text)', padding: '6px 10px', background: 'rgba(11,61,145,0.04)', borderRadius: 6 }}>
                  "{vice.slogan}"
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>Oficializado: {vice.oficializado_em}</span>
                {vice.local_oficializacao && <span>{vice.local_oficializacao}</span>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Clock size={15} style={{ color: '#A16207' }} />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A16207' }}>
            Em negociação ({Object.keys(emNegociacao).length} chapas)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {Object.entries(emNegociacao).map(([chapaKey, info]) => {
            const candidatoNome = chapaKey.replace('chapa_', '').replace(/_/g, ' ');
            return (
              <Card key={chapaKey} style={{ borderTop: '3px solid #F59E0B' }}>
                <strong style={{ fontSize: 14, textTransform: 'capitalize' }}>Chapa {candidatoNome}</strong>
                {info.nomes_em_disputa && info.nomes_em_disputa.length > 0 ? (
                  <ul style={{ marginTop: 8, paddingLeft: 16, fontSize: 13, listStyle: 'disc' }}>
                    {info.nomes_em_disputa.map((n, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        <strong>{n.nome}</strong>
                        {n.partido && <span style={{ color: 'var(--text-secondary)' }}> ({n.partido})</span>}
                        {n.vinculo && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{n.vinculo}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {info.status || 'Sem informações públicas'}
                  </div>
                )}
                {info.decisao_prazo_legal && (
                  <div style={{ fontSize: 11, marginTop: 8, color: '#A16207' }}>
                    Prazo legal: {info.decisao_prazo_legal}
                  </div>
                )}
                {info.decisao_prazo && (
                  <div style={{ fontSize: 11, marginTop: 8, color: '#A16207' }}>
                    Prazo previsto: {info.decisao_prazo}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
