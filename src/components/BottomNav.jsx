import { useState } from 'react';
import {
  Target, GitCompare, TrendingUp, Radar,
  MapPin, Map as MapaIcon, ShieldCheck, Users, MoreHorizontal, X, MessageSquareText,
} from 'lucide-react';

// Portado do monitor-pmto, sem prop-types e sem ADMIN_TABS (a majoritaria nao tem
// RBAC). 4 abas primarias + "Mais" cobrindo as 8 do produto. Cor ativa = azul
// #0B3D91 (paleta da majoritaria), nao o dourado do PMTO.
const PRIMARY_TABS = [
  { id: 'inteligencia', label: 'Intel',      icon: Target },
  { id: 'confronto',    label: 'Confronto',  icon: GitCompare },
  { id: 'tendencias',   label: 'Tendências', icon: TrendingUp },
  { id: 'radar',        label: 'Radar',      icon: Radar },
];

const MORE_TABS = [
  { id: 'narrativa',  label: 'Narrativa',  icon: MessageSquareText },
  { id: 'geografia',  label: 'Geografia',  icon: MapPin },
  { id: 'territorio', label: 'Território', icon: MapaIcon },
  { id: 'cobertura',  label: 'Cobertura',  icon: ShieldCheck },
  { id: 'vices',      label: 'Vices',      icon: Users },
];

const ACTIVE = '#0B3D91';
const IDLE = '#8C93A8';

export default function BottomNav({ activePanel, setActivePanel }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = MORE_TABS.some(t => t.id === activePanel);

  return (
    <>
      {moreOpen && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998 }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div
          role="menu"
          aria-label="Mais painéis"
          style={{
            position: 'fixed', bottom: 68, left: 12, right: 12, zIndex: 999,
            background: '#FFFFFF', borderRadius: 16,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)', padding: '8px 0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 12px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2744' }}>Mais painéis</span>
            <button
              aria-label="Fechar"
              onClick={() => setMoreOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: IDLE, padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
          {MORE_TABS.map(({ id, label, icon: Icon }) => {
            const isAct = activePanel === id;
            return (
              <button
                key={id}
                role="menuitem"
                onClick={() => { setActivePanel(id); setMoreOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 20px',
                  background: isAct ? 'rgba(11,61,145,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: isAct ? ACTIVE : '#1A2744',
                  fontSize: 14, fontWeight: isAct ? 700 : 500, fontFamily: 'inherit',
                }}
              >
                <Icon size={20} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      <nav
        aria-label="Navegação principal"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 997,
          background: '#FFFFFF', borderTop: '1px solid rgba(26,39,68,0.08)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
          height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {PRIMARY_TABS.map(({ id, label, icon: Icon }) => {
          const isAct = activePanel === id;
          return (
            <button
              key={id}
              aria-current={isAct ? 'page' : undefined}
              onClick={() => setActivePanel(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isAct ? ACTIVE : IDLE,
                fontSize: 10, fontWeight: isAct ? 700 : 500,
                fontFamily: 'inherit', position: 'relative', transition: 'color 0.15s ease',
              }}
            >
              {isAct && (
                <span style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 3, borderRadius: '0 0 3px 3px', background: ACTIVE }} />
              )}
              <Icon size={22} />
              <span>{label}</span>
            </button>
          );
        })}

        <button
          aria-label="Mais painéis"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(v => !v)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            color: isMoreActive ? ACTIVE : IDLE,
            fontSize: 10, fontWeight: isMoreActive ? 700 : 500,
            fontFamily: 'inherit', position: 'relative', transition: 'color 0.15s ease',
          }}
        >
          {isMoreActive && (
            <span style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 3, borderRadius: '0 0 3px 3px', background: ACTIVE }} />
          )}
          <MoreHorizontal size={22} />
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}
