import React, { useState, useEffect } from 'react';

export const useWW = () => {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
};

export const CSS = `:root{--primary:#0B3D91;--primary-light:rgba(11,61,145,0.08);--surface:#FFFFFF;--surface-hover:#F5F3EE;--surface-border:rgba(26,39,68,0.08);--bg:#F8F7F4;--text:#1A2744;--text-secondary:#6B7280;--accent:#0B3D91;--radius-sm:8px;--radius-md:12px;--radius-lg:16px;--shadow-sm:0 1px 3px rgba(0,0,0,0.07);--shadow-md:0 4px 12px rgba(0,0,0,0.1);--shadow-lg:0 8px 24px rgba(0,0,0,0.14);--spacing-xs:8px;--spacing-sm:12px;--spacing-md:16px;--spacing-lg:24px;--spacing-xl:32px;--font-display:'DM Sans','Inter',system-ui,sans-serif;--font-mono:'Roboto Mono','Fira Code',monospace}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);font-family:var(--font-display)}*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}.hov-card{transition:transform 0.2s ease,box-shadow 0.2s ease}.hov-card:hover{transform:translateY(-2px)!important;box-shadow:var(--shadow-lg)!important}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.skeleton{background:linear-gradient(90deg,var(--surface) 25%,rgba(26,39,68,0.04) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}`;

export const Card = ({ children, style, noHover }) => (
  <div className={noHover ? '' : 'hov-card'} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)', ...style }}>
    {children}
  </div>
);

export const Met = ({ icon: I, label, value, sub, accent, compact }) => (
  <Card style={{ flex: compact ? '1 1 calc(50% - 4px)' : 1, minWidth: compact ? 0 : 140 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: compact ? 6 : 10 }}>
      <I size={compact ? 11 : 13} style={{ color: accent }} />
      <span style={{ fontSize: compact ? 9 : 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
    <p style={{ fontSize: compact ? 22 : 30, fontWeight: 700, color: accent, margin: 0, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>{value}</p>
    {sub && <p style={{ fontSize: compact ? 10 : 12, color: 'var(--text-secondary)', marginTop: compact ? 4 : 6, fontWeight: 500 }}>{sub}</p>}
  </Card>
);

export const Bd = ({ children, color, bg }) => (
  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: bg || `${color}22`, color }}>{children}</span>
);

export const Bt = ({ active, color, onClick, children }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', minHeight: 44, borderRadius: 20, fontSize: 12, fontWeight: 700, border: active ? `1.5px solid ${color}` : '1.5px solid rgba(26,39,68,0.15)', background: active ? `${color}1a` : 'rgba(26,39,68,0.04)', color: active ? color : '#5A6478', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit' }}>
    {children}
  </button>
);

export const PanelSkeleton = ({ rows = 5 }) => (
  <Card>
    <div className="skeleton" style={{ height: 24, width: '40%', borderRadius: 6, marginBottom: 20 }} />
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, flex: 1, borderRadius: 8 }} />)}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: 16, width: `${90 - i * 10}%`, borderRadius: 4, marginBottom: 10 }} />
    ))}
  </Card>
);

export const fmtK = n => {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};
