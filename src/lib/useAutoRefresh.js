import { useEffect, useRef, useState } from 'react';

// Portado do monitor-pmto. Default 30 MIN (nao reduzir — a coleta da majoritaria
// roda por cron, nao em tempo real; refresh agressivo so gasta request). O toggle
// persiste em localStorage. Primeira atualizacao 1 min apos montar (deixa o boot
// terminar), depois a cada intervalMinutes.
export function useAutoRefresh(callback, intervalMinutes = 30) {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefresh');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    localStorage.setItem('autoRefresh', JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const doRefresh = async () => {
      console.log('[AutoRefresh] Atualizando dados...');
      await callbackRef.current();
      setLastRefresh(new Date());
    };

    const initialTimeout = setTimeout(() => {
      doRefresh();
      intervalRef.current = setInterval(doRefresh, intervalMinutes * 60 * 1000);
    }, 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMinutes]);

  return { enabled, setEnabled, lastRefresh };
}
