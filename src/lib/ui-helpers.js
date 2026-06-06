import { useState, useEffect } from 'react';

// Non-component helpers split out of components/ui.jsx so that ui.jsx only
// exports components (satisfies react-refresh/only-export-components).

export const useWW = () => {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
};

export const fmtK = n => {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};
